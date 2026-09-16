import { validateState } from './model.js';

export class ConflictError extends Error {
  constructor() { super('O caderno foi alterado em outro dispositivo.'); this.name = 'ConflictError'; }
}

const TITLE = 'Perguntas e respostas';

// There is a single, global row: everyone using the app reads and writes the same
// content. The database trigger increments the revision atomically, so concurrent
// updates cannot silently overwrite data.
export function notebookRepository(client) {
  return {
    async load() {
      const { data, error } = await client.from('meetings').select('id,content,revision').order('created_at', { ascending: true }).limit(1).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { ...data, content: validateState(data.content) };
    },
    async create(content) {
      const { data, error } = await client.from('meetings').insert({ title: TITLE, content: validateState(content) }).select('id,revision').single();
      if (error) throw error;
      return data;
    },
    async save(id, revision, content) {
      const { data, error } = await client.from('meetings').update({ content: validateState(content) }).eq('id', id).eq('revision', revision).select('revision').maybeSingle();
      if (error) throw error;
      if (!data) throw new ConflictError();
      return data.revision;
    },
  };
}
