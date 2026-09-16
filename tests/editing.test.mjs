import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, validateState, toSimpleMarkdown, defaultQuestions } from '../public/model.js';
import { publicConfig } from '../scripts/config.mjs';

test('backup antigo (versão 1) é convertido: mantém título editado e resposta, descarta campos removidos', () => {
  const legacy = {
    app: 'mapa-de-dados', version: 1, savedAt: '', questionTitles: { 1: 'Pergunta renomeada' },
    meta: { company: 'Empresa', date: '2026-09-15', participants: '', findings: '', pilot: '', success: '', nextSteps: '' },
    trace: { report: '', record: '', event: 'creation', timezone: '', stages: Array.from({ length: 7 }, () => ({ time: '', evidence: '', skipped: false })) },
    answers: Object.fromEntries(defaultQuestions.map(q => [q.id, { answer: q.id === 2 ? 'Resposta antiga' : '', classification: 'unverified', evidence: '', owner: '', nextStep: '' }])),
  };
  const restored = validateState(legacy);
  assert.equal(restored.version, 2);
  assert.equal(restored.questions.find(q => q.id === 1).title, 'Pergunta renomeada');
  assert.equal(restored.questions.length, defaultQuestions.length);
  assert.equal(restored.answers[2], 'Resposta antiga');
});

test('título editado sobrevive ao backup e aparece na exportação', () => {
  const state = emptyState();
  state.questions[0].title = 'Nova pergunta?';
  state.answers[1] = 'Mesma resposta';
  const restored = validateState(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.questions[0].title, 'Nova pergunta?');
  assert.ok(toSimpleMarkdown(restored).includes('### 1. Nova pergunta?'));
  assert.equal(restored.answers[1], 'Mesma resposta');
});

test('rejeita perguntas vazias, repetidas ou com texto muito grande', () => {
  const base = questionsList => ({ app: 'mapa-de-dados', version: 2, answers: {}, questions: questionsList });
  for (const questionsList of [[{ id: 1, title: '  ' }], [{ id: 1, title: 'a' }, { id: 1, title: 'b' }], [{ id: 1, title: 'a'.repeat(2001) }], []]) {
    assert.throws(() => validateState(base(questionsList)));
  }
});

test('build publica somente chaves de cliente e uma URL de projeto válida', () => {
  assert.deepEqual(publicConfig({}), { url: '', key: '' });
  const url = 'https://example.supabase.co';
  assert.deepEqual(publicConfig({ SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test' }), { url, key: 'sb_publishable_test' });
  assert.throws(() => publicConfig({ SUPABASE_URL: url }));
  assert.throws(() => publicConfig({ SUPABASE_URL: url + '/rest/v1/', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test' }));
  assert.throws(() => publicConfig({ SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: 'sb_secret_private' }));
  const jwt = role => `header.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.signature`;
  assert.throws(() => publicConfig({ SUPABASE_URL: url, SUPABASE_ANON_KEY: jwt('service_role') }));
  assert.equal(publicConfig({ SUPABASE_URL: url, SUPABASE_ANON_KEY: jwt('anon') }).key, jwt('anon'));
});
