import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { emptyState, STORAGE_KEY } from '../public/model.js';

const browser = await chromium.launch({ headless: true });
const base = process.env.TEST_URL || 'http://localhost:3011';
const config = { url: 'https://browser-test.supabase.co', key: 'sb_publishable_test' };
const errors = [];
const rows = new Map();
let nextId = 1, failSave = false, pauseSave;
const makeRow = (id, content, title = 'Perguntas e respostas') => ({ id, content, title, revision: 1, updated_at: new Date().toISOString() });
rows.set('meeting-1', makeRow('meeting-1', emptyState()));
const context = await browser.newContext();
await context.route('**/config.json', route => route.fulfill({ json: config }));
await context.route(config.url + '/**', async route => {
  const request = route.request();
  const url = new URL(request.url());
  const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
  const respond = (json, status = 200) => route.fulfill({ status, headers, json });
  if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
  if (url.pathname !== '/rest/v1/meetings') return respond({ message: 'Unexpected path' }, 404);
  if (request.method() === 'GET') {
    // .maybeSingle() sends no special Accept header: PostgREST always answers with an
    // array, and the client itself unwraps 0/1 rows (erroring only when there are 2+).
    const [row] = rows.values();
    return respond(row ? [row] : []);
  }
  if (request.method() === 'POST') {
    // .single() does request the single-object representation, so PostgREST replies
    // with a bare object instead of an array.
    const body = request.postDataJSON();
    const row = makeRow(`meeting-${++nextId}`, body.content, body.title);
    rows.set(row.id, row);
    return respond(row, 201);
  }
  if (request.method() === 'PATCH') {
    if (pauseSave) { const pause = pauseSave; pauseSave = null; await pause; }
    if (failSave) return respond({ message: 'Offline' }, 503);
    const id = url.searchParams.get('id')?.replace('eq.', '');
    const row = rows.get(id);
    const expected = Number(url.searchParams.get('revision')?.replace('eq.', ''));
    if (!row || row.revision !== expected) return respond([]);
    Object.assign(row, request.postDataJSON()); row.revision++;
    return respond([{ revision: row.revision }]);
  }
  return respond({ message: 'Unexpected method' }, 400);
});
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
await page.goto(base);
await page.locator('#notebook').waitFor({ state: 'visible' });
assert.equal(await page.locator('textarea[data-question]:visible').count(), 20);
await page.locator('#answer-1').fill('Resposta preservada');
await page.waitForFunction(() => document.querySelector('#save-status').textContent === 'Salvo na nuvem');
// Edit a question's title: cancel discards, saving persists it across reloads.
await page.locator('[data-edit="1"]').click();
await page.locator('#question-text').fill('Pergunta cancelada');
await page.locator('#cancel-edit').click();
assert.ok(!await page.locator('.question-card').first().textContent().then(t => t.includes('Pergunta cancelada')));
await page.locator('[data-edit="1"]').click();
await page.locator('#question-text').fill('Qual o novo prazo?');
await page.getByRole('button', { name: 'Salvar pergunta', exact: true }).click();
await page.waitForFunction(() => document.querySelector('#save-status').textContent === 'Salvo na nuvem');
assert.equal(rows.get('meeting-1').content.questions[0].title, 'Qual o novo prazo?');
assert.equal(rows.get('meeting-1').content.answers[1], 'Resposta preservada');
await page.reload();
await page.locator('#notebook').waitFor({ state: 'visible' });
assert.ok((await page.locator('.question-card').first().textContent()).includes('Qual o novo prazo?'));
// Adding a question inserts it into the chosen section, with its own answer field.
await page.locator('[data-add-section="1"]').first().click();
await page.locator('#new-question-text').fill('Pergunta extra do time?');
await page.getByRole('button', { name: 'Adicionar', exact: true }).click();
await page.waitForFunction(() => document.querySelector('#save-status').textContent === 'Salvo na nuvem');
assert.equal(await page.locator('textarea[data-question]:visible').count(), 21);
assert.equal(await page.locator('#answered-count').textContent(), '1 de 21 respondidas');
assert.equal(rows.get('meeting-1').content.questions.at(-1).title, 'Pergunta extra do time?');
const newId = rows.get('meeting-1').content.questions.at(-1).id;
await page.locator(`#answer-${newId}`).fill('Resposta da pergunta extra');
await page.waitForFunction(() => document.querySelector('#save-status').textContent === 'Salvo na nuvem');
// Deleting a question removes it and its answer; a confirmation guards against accidents.
await page.locator(`[data-delete="${newId}"]`).click();
await page.locator('#confirm-accept').click();
await page.waitForFunction(() => document.querySelector('#save-status').textContent === 'Salvo na nuvem');
assert.equal(await page.locator('textarea[data-question]:visible').count(), 20);
assert.ok(!(newId in rows.get('meeting-1').content.answers));
await page.locator('#export-button').click();
const downloadEvent = page.waitForEvent('download');
await page.locator('#download-md').click();
const download = await downloadEvent;
assert.ok((await readFile(await download.path(), 'utf8')).includes('Qual o novo prazo?'));
await page.locator('[aria-label="Fechar"]').click();
// Edits arriving during an in-flight request must result in a second save.
let release;
pauseSave = new Promise(resolve => { release = resolve; });
await page.locator('#answer-2').fill('Primeiro valor');
await page.waitForFunction(() => document.querySelector('#save-status').textContent === 'Salvando na nuvem…');
await page.locator('#answer-2').fill('Último valor');
release();
await page.waitForFunction(() => document.querySelector('#save-status').textContent === 'Salvo na nuvem');
assert.equal(rows.get('meeting-1').content.answers[2], 'Último valor');
// Failed saves recover from a draft after a reload.
failSave = true;
await page.locator('#answer-3').fill('Rascunho sem conexão');
await page.locator('#retry-save').waitFor({ state: 'visible' });
await page.waitForFunction(() => document.querySelector('#save-status').textContent === 'Não salvo na nuvem');
failSave = false;
await page.reload();
await page.waitForFunction(() => document.querySelector('#save-status').textContent === 'Salvo na nuvem');
assert.equal(await page.locator('#answer-3').inputValue(), 'Rascunho sem conexão');
// An external revision never gets overwritten; reload adopts the cloud version.
rows.get('meeting-1').revision++;
rows.get('meeting-1').content.answers[4] = 'Versão de outro dispositivo';
await page.locator('#answer-4').fill('Minha versão');
await page.locator('#reload-cloud').waitFor({ state: 'visible' });
assert.equal(rows.get('meeting-1').content.answers[4], 'Versão de outro dispositivo');
await page.locator('#reload-cloud').click();
await page.locator('#confirm-accept').click();
await page.waitForFunction(() => document.querySelector('#reload-cloud').hidden === true);
assert.equal(await page.locator('#answer-4').inputValue(), 'Versão de outro dispositivo');
// Meetings are shared: another tab opening the same app sees the same content, without any login.
const second = await context.newPage();
await second.goto(base);
await second.locator('#notebook').waitFor({ state: 'visible' });
assert.equal(await second.locator('#answer-4').inputValue(), 'Versão de outro dispositivo');
await second.close();
await page.setViewportSize({ width: 390, height: 844 });
assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
await page.screenshot({ path: '/tmp/nerus-supabase-mobile.png' });
assert.deepEqual(errors, []);
// Local mode remains compatible with old backups.
const local = await browser.newContext();
await local.route('**/config.json', route => route.fulfill({ json: { url: '', key: '' } }));
const localPage = await local.newPage();
await localPage.goto(base);
await localPage.locator('#notebook').waitFor({ state: 'visible' });
await localPage.locator('[data-edit="1"]').click();
await localPage.locator('#question-text').fill('Pergunta local');
await localPage.getByRole('button', { name: 'Salvar pergunta', exact: true }).click();
await localPage.waitForFunction(() => document.querySelector('#save-status').textContent === 'Salvo neste navegador');
await localPage.reload();
await localPage.locator('#notebook').waitFor({ state: 'visible' });
assert.ok((await localPage.locator('.question-card').first().textContent()).includes('Pergunta local'));
await localPage.locator('[data-edit="1"]').click();
await localPage.locator('#restore-question').click();
await localPage.getByRole('button', { name: 'Salvar pergunta', exact: true }).click();
await localPage.waitForFunction(() => document.querySelector('#save-status').textContent === 'Salvo neste navegador');
assert.equal(await localPage.evaluate(key => JSON.parse(localStorage.getItem(key)).questions[0].title, STORAGE_KEY), 'Qual relatório ou processo mais sofre com o atraso, qual decisão depende dele e qual seria o prazo aceitável para o dado aparecer?');
await browser.close();
console.log('OK: sem login, edição/cancelamento/restauração, adicionar/excluir pergunta, backup, recarga, salvamento em sequência, recuperação offline, conflitos, dados compartilhados e celular. API simulada; validação de RLS exige o banco real.');
