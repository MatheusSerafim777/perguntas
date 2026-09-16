import test from 'node:test';
import assert from 'node:assert/strict';
import { notebookRepository, ConflictError } from '../public/cloud.js';
import { emptyState } from '../public/model.js';

// Minimal PostgREST double: a single global row; concurrent writers race against one revision.
function database(initial) {
  let row = initial;
  return {
    get row() { return row; },
    from(table) {
      assert.equal(table, 'meetings');
      let mode, payload, expected;
      const query = {
        select() { return query; },
        insert(value) { mode = 'insert'; payload = value; return query; },
        update(value) { mode = 'update'; payload = value; return query; },
        eq(key, value) { if (key === 'revision') expected = value; return query; },
        order() { return query; },
        limit() { return query; },
        async maybeSingle() {
          if (mode === 'update') {
            if (expected !== row.revision) return { data: null, error: null };
            row = { ...row, content: payload.content, revision: row.revision + 1 };
            return { data: { revision: row.revision }, error: null };
          }
          return { data: row, error: null };
        },
        async single() {
          row = { id: 'row-1', revision: 1, content: payload.content };
          return { data: { id: row.id, revision: row.revision }, error: null };
        },
      };
      return query;
    },
  };
}

test('grava título de pergunta e resposta juntos; revisão impede sobrescrita concorrente', async () => {
  const db = database({ id: 'row-1', revision: 1, content: emptyState() });
  const first = notebookRepository(db), second = notebookRepository(db);
  const state = emptyState();
  state.questions[0].title = 'Pergunta editada';
  state.answers[1] = 'Primeira alteração';
  assert.equal(await first.save(db.row.id, 1, state), 2);
  const stale = emptyState();
  stale.answers[1] = 'Resposta de outro navegador';
  await assert.rejects(second.save(db.row.id, 1, stale), ConflictError);
  assert.equal(db.row.content.answers[1], 'Primeira alteração');
  assert.equal(db.row.content.questions[0].title, 'Pergunta editada');
});

test('load retorna null quando a tabela está vazia, e create grava a primeira linha', async () => {
  const client = { from() { const q = { select: () => q, order: () => q, limit: () => q, insert(v) { q.payload = v; return q; }, maybeSingle: async () => ({ data: null, error: null }), single: async () => ({ data: { id: 'row-1', revision: 1 }, error: null }) }; return q; } };
  const repository = notebookRepository(client);
  assert.equal(await repository.load(), null);
  const created = await repository.create(emptyState());
  assert.deepEqual(created, { id: 'row-1', revision: 1 });
});

test('erro da API não é tratado como salvamento bem-sucedido', async () => {
  const client = { from() { const q = { update: () => q, eq: () => q, select: () => q, maybeSingle: async () => ({ error: new Error('offline') }) }; return q; } };
  await assert.rejects(notebookRepository(client).save('row-1', 1, emptyState()), /offline/);
});
