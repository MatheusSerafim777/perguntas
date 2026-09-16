import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { questions } from '../public/questions.js';
import { emptyState, validateState, counts, nextQuestionId, toSimpleMarkdown } from '../public/model.js';

test('mantém as 20 perguntas do roteiro e suas 10 prioridades', async () => {
  const original = await readFile(new URL('../docs/perguntas-principais-reuniao.md', import.meta.url), 'utf8');
  const titles = [...original.matchAll(/^- \[ \] \*\*(\d+)\. (?:★ )?(.+)\*\*$/gm)].map(match => match[2]);
  assert.deepEqual(questions.map(q => q.title), titles);
  assert.equal(questions.filter(q => q.priority).length, 10);
});

test('backup preserva perguntas e respostas, incluindo edições e novas perguntas', () => {
  const state = emptyState();
  state.questions[0].title = 'Pergunta editada';
  state.answers[1] = 'Resposta';
  const id = nextQuestionId(state);
  state.questions.push({ id, section: 1, priority: false, title: 'Pergunta extra', hint: '' });
  state.answers[id] = 'Outra resposta';
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(state))), state);
});

test('rejeita backups inválidos antes de substituir dados', () => {
  assert.throws(() => validateState({}), /backup JSON/);
  const base = questionsList => ({ app: 'mapa-de-dados', version: 2, answers: {}, questions: questionsList });
  assert.throws(() => validateState(base([])), /nenhuma pergunta/);
  assert.throws(() => validateState(base([{ id: 1, title: '  ' }])), /vazia/);
  assert.throws(() => validateState(base([{ id: 1, title: 'a' }, { id: 1, title: 'b' }])), /repetidas/);
  assert.throws(() => validateState({ app: 'mapa-de-dados', version: 3, answers: {}, questions: [] }), /Versão/);
});

test('progresso conta apenas respostas preenchidas', () => {
  const state = emptyState();
  state.answers[1] = '  ';
  state.answers[2] = 'Relato preenchido';
  assert.deepEqual(counts(state), { answered: 1 });
});

test('exportação em markdown agrupa por seção e inclui todas as perguntas e respostas', () => {
  const state = emptyState();
  state.answers[20] = 'Resposta final';
  const md = toSimpleMarkdown(state);
  assert.equal((md.match(/^### \d+\./gm) || []).length, 20);
  assert.ok(md.includes('## Fechamento e próximo passo'));
  assert.ok(md.includes('Resposta final'));
});
