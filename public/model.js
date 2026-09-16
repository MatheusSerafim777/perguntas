import { questions as defaultQuestions, sections } from './questions.js';

export const STORAGE_KEY = 'mapa-de-dados:caderno:v2';
export { defaultQuestions, sections };

export function emptyState() {
  return {
    app: 'mapa-de-dados', version: 2, savedAt: '',
    questions: defaultQuestions.map(q => ({ ...q })),
    answers: Object.fromEntries(defaultQuestions.map(q => [q.id, ''])),
  };
}

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const string = (value, max = 50000) => {
  if (typeof value !== 'string' || value.length > max) throw new Error('O arquivo contém um campo inválido ou muito extenso.');
  return value;
};

export function nextQuestionId(state) {
  return state.questions.reduce((max, q) => Math.max(max, q.id), 0) + 1;
}

function readQuestions(list) {
  if (!Array.isArray(list) || !list.length) throw new Error('O backup não tem nenhuma pergunta.');
  const ids = new Set();
  return list.map(q => {
    if (!object(q) || typeof q.id !== 'number' || !Number.isInteger(q.id)) throw new Error('Uma pergunta do backup está inválida.');
    if (ids.has(q.id)) throw new Error('Há perguntas repetidas no backup.');
    ids.add(q.id);
    const title = string(q.title, 2000).trim();
    if (!title) throw new Error('A pergunta não pode ficar vazia.');
    return { id: q.id, section: Number.isInteger(q.section) ? q.section : null, priority: Boolean(q.priority), title, hint: string(q.hint || '', 4000) };
  });
}

export function validateState(input) {
  if (!object(input) || input.app !== 'mapa-de-dados' || !object(input.answers)) {
    throw new Error('Selecione um backup JSON exportado por este caderno.');
  }
  const result = { app: 'mapa-de-dados', version: 2, savedAt: string(input.savedAt || '', 100), questions: [], answers: {} };
  if (input.version === 2) {
    result.questions = readQuestions(input.questions);
    for (const q of result.questions) result.answers[q.id] = string(input.answers[q.id] ?? '');
  } else if (input.version === 1) {
    // Backups do formato anterior guardavam campos que não existem mais (classificação,
    // evidência, responsável, próximo passo, dados da reunião e linha do tempo). Mantemos
    // apenas o texto das perguntas (com títulos editados) e as respostas.
    if (!object(input.meta) || !object(input.trace)) throw new Error('Selecione um backup JSON exportado por este caderno.');
    const titles = object(input.questionTitles) ? input.questionTitles : {};
    result.questions = defaultQuestions.map(q => {
      const custom = titles[q.id];
      return { ...q, title: typeof custom === 'string' && custom.trim() ? string(custom, 2000).trim() : q.title };
    });
    for (const q of defaultQuestions) {
      const entry = input.answers[q.id];
      result.answers[q.id] = string(object(entry) ? entry.answer || '' : '');
    }
  } else {
    throw new Error('Versão de backup não reconhecida.');
  }
  return result;
}

export const answered = text => Boolean(text.trim());
export function counts(state) {
  return { answered: state.questions.filter(q => answered(state.answers[q.id] || '')).length };
}

const inline = value => value.replace(/\r?\n/g, ' ').replace(/([\\`*_[\]<>|])/g, '\\$1');
const field = value => value.trim() || '_Não informado._';

export function toSimpleMarkdown(state) {
  const lines = ['# Perguntas e respostas', ''];
  const bySection = id => state.questions.filter(q => q.section === id);
  for (const section of sections) {
    const items = bySection(section.id);
    if (!items.length) continue;
    lines.push(`## ${section.title}`, '');
    for (const q of items) lines.push(`### ${q.id}. ${inline(q.title)}`, '', field(state.answers[q.id] || ''), '');
  }
  const known = new Set(sections.map(s => s.id));
  const extra = state.questions.filter(q => !known.has(q.section));
  if (extra.length) {
    lines.push('## Outras perguntas', '');
    for (const q of extra) lines.push(`### ${q.id}. ${inline(q.title)}`, '', field(state.answers[q.id] || ''), '');
  }
  return lines.join('\n');
}
