import { createClient } from '@supabase/supabase-js';
import { STORAGE_KEY, emptyState, validateState, counts, nextQuestionId, toSimpleMarkdown, defaultQuestions, sections } from './model.js';
import { notebookRepository, ConflictError } from './cloud.js';

const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
let state = emptyState();
let client, repository, meeting, config;
let dirty = false, blocked = false, conflict = false, loading = true;
let editVersion = 0, editingQuestion = null, addingSection = null;
let saveTimer, savePromise, toastTimer;
let originalBackup = '';

function notice(message) {
  $('#storage-warning').textContent = message;
  $('#storage-warning').hidden = false;
}
function status(message, error = false) {
  $('#save-status').textContent = message;
  $('#save-status').classList.toggle('save-error', error);
}
function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4500);
}
function renderQuestions() {
  const known = new Set(sections.map(s => s.id));
  const groups = sections.map(section => ({ id: section.id, title: section.title, items: state.questions.filter(q => q.section === section.id) }));
  const extra = state.questions.filter(q => !known.has(q.section));
  if (extra.length) groups.push({ id: 'extra', title: 'Outras perguntas', items: extra });
  $('#question-list').innerHTML = groups.map(group => `<section class="question-group" aria-labelledby="group-${group.id}">
    <div class="section-heading"><h2 id="group-${group.id}">${escape(group.title)}</h2><button class="text-button add-button" type="button" data-add-section="${group.id}">Adicionar pergunta</button></div>
    ${group.items.map(q => `<article class="question-card">
      <div class="question-heading"><label for="answer-${q.id}"><span class="question-number">${q.id}.</span> ${escape(q.title)}</label>
      <div class="question-actions">
        <button class="text-button edit-button" type="button" data-edit="${q.id}" aria-label="Editar pergunta ${q.id}">Editar pergunta</button>
        <button class="text-button delete-button" type="button" data-delete="${q.id}" aria-label="Excluir pergunta ${q.id}">Excluir pergunta</button>
      </div></div>
      <textarea id="answer-${q.id}" data-question="${q.id}" rows="4" maxlength="50000" placeholder="Escreva sua resposta…">${escape(state.answers[q.id] || '')}</textarea>
    </article>`).join('')}
  </section>`).join('');
  updateProgress();
}
function updateProgress() {
  $('#answered-count').textContent = `${counts(state).answered} de ${state.questions.length} respondidas`;
}
function controls() {
  const ready = !loading && (!client || Boolean(meeting));
  $('#notebook').hidden = !ready;
  $('#export-button').hidden = !ready;
  $('#reset-button').hidden = !ready;
  $('#retry-save').hidden = !client || (!dirty && Boolean(meeting)) || conflict || loading;
  $('#reload-cloud').hidden = !conflict || !meeting;
  $('#storage-note').textContent = client ? 'As respostas ficam salvas na nuvem, compartilhadas entre todos os dispositivos. Aguarde “Salvo na nuvem” antes de fechar.' : 'As respostas são salvas apenas neste navegador. Configure o Supabase para salvar na nuvem.';
}
function draftKey() {
  return client && meeting ? `${STORAGE_KEY}:${new URL(config.url).hostname}:${meeting.id}` : STORAGE_KEY;
}
function cacheDraft() {
  try {
    const value = client ? { state, revision: meeting.revision, pending: dirty } : state;
    localStorage.setItem(draftKey(), JSON.stringify(value));
    return true;
  } catch {
    notice(client ? 'Não foi possível guardar uma cópia neste navegador. Aguarde a confirmação do salvamento na nuvem ou exporte um backup.' : 'O navegador não permitiu salvar. Exporte um backup antes de fechar.');
    return false;
  }
}
function changed() {
  state.savedAt = new Date().toISOString();
  editVersion++;
  dirty = true;
  if (!blocked) cacheDraft();
  status(blocked ? 'Salvamento pausado' : client ? 'Alterações pendentes…' : 'Salvando…', blocked);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void save(), client ? 700 : 200);
  updateProgress();
  controls();
}
async function save() {
  clearTimeout(saveTimer);
  if (savePromise) { await savePromise; return !dirty; }
  if (!dirty) return true;
  if (blocked || loading || (client && !meeting)) return false;
  if (!client) {
    if (!cacheDraft()) { status('Exporte para guardar', true); return false; }
    dirty = false;
    status('Salvo neste navegador');
    return true;
  }
  let failed = false;
  savePromise = (async () => {
    while (dirty && !blocked) {
      const version = editVersion;
      const snapshot = structuredClone(state);
      status('Salvando na nuvem…');
      try {
        const revision = await repository.save(meeting.id, meeting.revision, snapshot);
        meeting.revision = revision;
        dirty = editVersion !== version;
        cacheDraft();
        status(dirty ? 'Alterações pendentes…' : 'Salvo na nuvem');
        $('#storage-warning').hidden = true;
      } catch (error) {
        failed = true;
        if (error instanceof ConflictError) {
          blocked = conflict = true;
          notice('Este caderno mudou em outra aba ou dispositivo. Suas alterações continuam aqui. Exporte um backup ou carregue a versão da nuvem.');
          status('Conflito de versões', true);
        } else {
          notice('Não foi possível salvar na nuvem. Suas alterações continuam nesta tela. Verifique a conexão e tente salvar novamente.');
          status('Não salvo na nuvem', true);
        }
        break;
      }
    }
  })();
  try { await savePromise; } finally {
    savePromise = null;
    controls();
    if (!failed && dirty && !blocked) saveTimer = setTimeout(() => void save(), 700);
  }
  return !dirty;
}

function download(content, name, type) {
  const url = URL.createObjectURL(new Blob([content], { type: `${type};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url; link.download = name;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function filename(extension) { return `caderno-${new Date().toISOString().slice(0, 10)}.${extension}`; }
function confirmAction(title, description, label) {
  $('#export-dialog').close();
  const dialog = $('#confirm-dialog');
  $('#confirm-title').textContent = title;
  $('#confirm-description').textContent = description;
  $('#confirm-accept').textContent = label;
  return new Promise(resolve => {
    dialog.returnValue = '';
    $('#confirm-cancel').onclick = () => dialog.close('cancel');
    $('#confirm-accept').onclick = () => dialog.close('accept');
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'accept'), { once: true });
    dialog.showModal();
  });
}
function recoverRaw(raw) {
  const button = document.createElement('button');
  button.className = 'text-button';
  button.textContent = 'Baixar conteúdo anterior para recuperação';
  button.addEventListener('click', () => download(raw, 'caderno-recuperacao.json', 'application/json'));
  $('#storage-warning').append(document.createElement('br'), button);
}

$('#question-list').addEventListener('input', event => {
  if (!event.target.dataset.question) return;
  state.answers[event.target.dataset.question] = event.target.value;
  changed();
});
$('#question-list').addEventListener('click', event => {
  const editButton = event.target.closest('[data-edit]');
  if (editButton) {
    editingQuestion = state.questions.find(q => q.id === Number(editButton.dataset.edit));
    const original = defaultQuestions.find(q => q.id === editingQuestion.id);
    $('#edit-title').textContent = `Editar pergunta ${editingQuestion.id}`;
    $('#question-text').value = editingQuestion.title;
    $('#question-text').setCustomValidity('');
    $('#restore-question').hidden = !original || original.title === editingQuestion.title;
    $('#edit-dialog').showModal();
    $('#question-text').focus();
    return;
  }
  const deleteButton = event.target.closest('[data-delete]');
  if (deleteButton) { void deleteQuestion(Number(deleteButton.dataset.delete)); return; }
  const addButton = event.target.closest('[data-add-section]');
  if (addButton) {
    addingSection = addButton.dataset.addSection === 'extra' ? null : Number(addButton.dataset.addSection);
    $('#new-question-text').value = '';
    $('#add-dialog').showModal();
    $('#new-question-text').focus();
  }
});
$('#edit-form').addEventListener('submit', event => {
  event.preventDefault();
  const title = $('#question-text').value.trim();
  if (!title) { $('#question-text').setCustomValidity('Escreva o texto da pergunta.'); $('#question-text').reportValidity(); return; }
  editingQuestion.title = title;
  const id = editingQuestion.id;
  $('#edit-dialog').close();
  renderQuestions(); changed();
  $(`[data-edit="${id}"]`).focus();
});
$('#question-text').addEventListener('input', () => $('#question-text').setCustomValidity(''));
$('#restore-question').addEventListener('click', () => {
  $('#question-text').value = defaultQuestions.find(q => q.id === editingQuestion.id)?.title || '';
  $('#question-text').setCustomValidity('');
});
$('#cancel-edit').addEventListener('click', () => $('#edit-dialog').close());
$('#add-form').addEventListener('submit', event => {
  event.preventDefault();
  const title = $('#new-question-text').value.trim();
  if (!title) { $('#new-question-text').setCustomValidity('Escreva o texto da pergunta.'); $('#new-question-text').reportValidity(); return; }
  const id = nextQuestionId(state);
  state.questions.push({ id, section: addingSection, priority: false, title, hint: '' });
  state.answers[id] = '';
  $('#add-dialog').close();
  renderQuestions(); changed();
  $(`#answer-${id}`).focus();
});
$('#new-question-text').addEventListener('input', () => $('#new-question-text').setCustomValidity(''));
$('#cancel-add').addEventListener('click', () => $('#add-dialog').close());
async function deleteQuestion(id) {
  if (state.questions.length <= 1) { toast('É preciso manter pelo menos uma pergunta.'); return; }
  if (!(await confirmAction('Excluir esta pergunta?', 'A resposta registrada para ela também será apagada.', 'Excluir'))) return;
  state.questions = state.questions.filter(q => q.id !== id);
  delete state.answers[id];
  renderQuestions(); changed();
}
$('#export-button').addEventListener('click', () => { void save(); $('#export-dialog').showModal(); });
$('#download-md').addEventListener('click', () => download(toSimpleMarkdown(state), filename('md'), 'text/markdown'));
$('#download-json').addEventListener('click', () => download(JSON.stringify(state, null, 2), filename('json'), 'application/json'));
$('#import-button').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', async event => {
  const file = event.target.files[0]; event.target.value = '';
  if (!file) return;
  try {
    if (file.size > 8 * 1024 * 1024) throw new Error('O backup deve ter no máximo 8 MB.');
    const candidate = validateState(JSON.parse(await file.text()));
    if (!(await confirmAction('Importar backup?', 'As perguntas e respostas atuais serão substituídas pelo conteúdo do backup.', 'Importar'))) return;
    state = candidate; blocked = false; renderQuestions(); changed();
    await save();
  } catch (error) { toast(error instanceof SyntaxError ? 'O arquivo não contém um backup JSON válido.' : error.message); }
});
function buildPrint() {
  $('#print-content').innerHTML = `<h1>Perguntas e respostas</h1>${sections.map(section => `<section><h2>${escape(section.title)}</h2>${state.questions.filter(q => q.section === section.id).map(q => `<article><h3>${q.id}. ${escape(q.title)}</h3><p>${escape(state.answers[q.id] || 'Sem resposta.')}</p></article>`).join('')}</section>`).join('')}`;
}
$('#print-button').addEventListener('click', () => { void save(); buildPrint(); $('#export-dialog').close(); window.print(); });
window.addEventListener('beforeprint', buildPrint);

function adoptMeeting(row, restoreDraft = true) {
  meeting = { id: row.id, revision: row.revision };
  state = row.content;
  dirty = blocked = conflict = false;
  $('#storage-warning').hidden = true;
  status('Salvo na nuvem');
  if (restoreDraft) {
    let raw;
    try {
      raw = localStorage.getItem(draftKey());
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.pending) {
          state = validateState(draft.state);
          dirty = true;
          if (draft.revision !== row.revision) {
            blocked = conflict = true;
            notice('Há um rascunho neste navegador e uma versão diferente na nuvem. Exporte o rascunho ou carregue a versão da nuvem.');
            status('Conflito de versões', true);
          } else status('Rascunho recuperado; salvando…');
        }
      }
    } catch {
      if (raw) {
        blocked = conflict = true;
        notice('O rascunho local está inválido. Baixe uma cópia antes de carregar novamente a versão da nuvem.');
        recoverRaw(raw);
      }
    }
  }
  renderQuestions();
}
async function loadInitial() {
  loading = true; controls(); status('Carregando…');
  try {
    let row = await repository.load();
    if (!row) {
      const created = await repository.create(emptyState());
      row = { ...created, content: emptyState() };
    }
    adoptMeeting(row);
  } catch {
    status('Não foi possível carregar', true);
    notice('Não foi possível acessar o questionário. Verifique a conexão e se a configuração do banco foi concluída. Clique em “Tentar novamente”.');
  } finally {
    loading = false; controls();
    if (dirty && !blocked) void save();
  }
}
$('#retry-save').addEventListener('click', () => { if (meeting) void save(); else void loadInitial(); });
async function resetAll() {
  if (!(await confirmAction('Recomeçar o questionário?', 'Isso apaga todas as respostas e restaura as perguntas originais. Exporte um backup antes se quiser guardar o conteúdo atual.', 'Recomeçar'))) return;
  state = emptyState(); blocked = false; renderQuestions(); changed(); await save();
}
$('#reset-button').addEventListener('click', resetAll);
$('#reload-cloud').addEventListener('click', async () => {
  if (!(await confirmAction('Carregar a versão da nuvem?', 'As alterações desta tela serão substituídas. Exporte um backup antes de continuar, se quiser guardá-las.', 'Carregar'))) return;
  loading = true; controls();
  try {
    const row = await repository.load();
    adoptMeeting(row, false); cacheDraft();
  } catch { toast('Não foi possível carregar. Suas alterações continuam aqui.'); }
  finally { loading = false; controls(); }
});
$('#import-local').addEventListener('click', async () => {
  try {
    const local = validateState(JSON.parse(localStorage.getItem(STORAGE_KEY)));
    if (!(await confirmAction('Importar caderno deste navegador?', client ? 'As perguntas e respostas salvas na nuvem serão substituídas pelas deste navegador.' : 'As perguntas e respostas atuais serão substituídas pelas deste navegador.', 'Importar'))) return;
    state = local; blocked = false; renderQuestions(); changed(); await save();
  } catch { toast('Não foi possível importar o caderno local. Use um backup válido ou tente novamente.'); }
});

document.addEventListener('visibilitychange', () => { if (document.hidden) void save(); });
window.addEventListener('pagehide', () => { if (dirty && !blocked && (!client || meeting)) cacheDraft(); });
window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
window.addEventListener('online', () => { if (dirty && !blocked) void save(); });
window.addEventListener('storage', event => {
  if (client || event.key !== STORAGE_KEY && event.key !== null) return;
  if (event.newValue === JSON.stringify(state)) return;
  blocked = true; clearTimeout(saveTimer);
  notice('Este caderno foi alterado em outra aba. Exporte suas anotações e recarregue para abrir a versão salva.');
  status('Alterado em outra aba', true);
});

async function initialize() {
  try {
    const response = await fetch('/config.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Configuração indisponível');
    config = await response.json();
    if (config.url && config.key) {
      client = createClient(config.url, config.key, { auth: { persistSession: false } });
      repository = notebookRepository(client);
      try { $('#import-local').hidden = !localStorage.getItem(STORAGE_KEY); } catch { /* Local storage may be disabled. */ }
      await loadInitial();
    } else {
      try {
        originalBackup = localStorage.getItem(STORAGE_KEY) || '';
        if (originalBackup) state = validateState(JSON.parse(originalBackup));
        status(state.savedAt ? 'Salvo neste navegador' : 'Pronto para começar');
      } catch {
        blocked = true;
        notice('Não foi possível abrir o caderno local. Exporte suas novas anotações e recupere o conteúdo anterior antes de substituir o caderno.');
        if (originalBackup) recoverRaw(originalBackup);
        status('Salvamento indisponível', true);
      }
      loading = false; renderQuestions(); controls();
    }
  } catch {
    status('Configuração indisponível', true);
    notice('Não foi possível iniciar o aplicativo. Recarregue a página ou verifique a configuração da hospedagem.');
  }
}
void initialize();
