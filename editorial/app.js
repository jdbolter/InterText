'use strict';

const FUND_KINDS = ['clarification', 'example', 'qualification', 'counterargument', 'evidence', 'extension'];
const FUND_STATUSES = ['candidate', 'accepted', 'rejected', 'superseded'];
const SOURCE_STATUSES = ['not-required', 'needs-verification', 'verified'];

const state = {
  index: null, work: null, section: null, package: null, packageSource: null,
  selectedPassageId: null, editing: false, draft: null, baseVersionId: null,
  dirty: false, saving: false,
};

const els = {
  workSelect: document.querySelector('#work-select'),
  workTitle: document.querySelector('#work-title'),
  sectionList: document.querySelector('#section-list'),
  sectionKicker: document.querySelector('#section-kicker'),
  sectionTitle: document.querySelector('#section-title'),
  sectionSummary: document.querySelector('#section-summary'),
  spineView: document.querySelector('#spine-view'),
  emptySection: document.querySelector('#empty-section'),
  emptyNumber: document.querySelector('#empty-number'),
  fundContext: document.querySelector('#fund-context'),
  fundSummary: document.querySelector('#fund-summary'),
  fundList: document.querySelector('#fund-list'),
  clearFilter: document.querySelector('#clear-filter'),
  sectionButtonTemplate: document.querySelector('#section-button-template'),
  editSection: document.querySelector('#edit-section'),
  editToolbar: document.querySelector('#edit-toolbar'),
  changeSummary: document.querySelector('#change-summary'),
  cancelEdit: document.querySelector('#cancel-edit'),
  publishSection: document.querySelector('#publish-section'),
  addFundEntry: document.querySelector('#add-fund-entry'),
  editorNotice: document.querySelector('#editor-notice'),
};

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function visiblePackage() { return state.editing ? state.draft : state.package; }
function normalizePackage(sectionPackage) {
  return {
    ...sectionPackage,
    fundEntries: sectionPackage.fundEntries.map(entry => ({ ...entry, thread: entry.thread || null })),
  };
}

function appendInlineMarkdown(container, text) {
  const tokenRe = /(\[([^\]]+)\]\((https?:\/\/[^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let cursor = 0;
  let match;
  while ((match = tokenRe.exec(text)) !== null) {
    if (match.index > cursor) container.append(document.createTextNode(text.slice(cursor, match.index)));
    if (match[2] && match[3]) {
      const link = document.createElement('a');
      link.href = match[3];
      link.textContent = match[2];
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      container.append(link);
    } else if (match[4]) {
      const strong = document.createElement('strong');
      strong.textContent = match[4];
      container.append(strong);
    } else if (match[5]) {
      const em = document.createElement('em');
      em.textContent = match[5];
      container.append(em);
    }
    cursor = tokenRe.lastIndex;
  }
  if (cursor < text.length) container.append(document.createTextNode(text.slice(cursor)));
}

function renderMarkdown(markdown) {
  const wrapper = document.createElement('div');
  wrapper.className = 'markdown-body';
  String(markdown).split(/\n\s*\n/).forEach(block => {
    const value = block.trim();
    if (!value) return;
    const isQuote = value.startsWith('>');
    const element = document.createElement(isQuote ? 'blockquote' : 'p');
    appendInlineMarkdown(element, isQuote ? value.replace(/^>\s?/gm, '') : value);
    wrapper.append(element);
  });
  return wrapper;
}

function makeChip(text) {
  const chip = document.createElement('span');
  chip.className = 'summary-chip';
  chip.textContent = text;
  return chip;
}

function makeField(labelText, control, className = '') {
  const label = document.createElement('label');
  label.className = `editor-field ${className}`.trim();
  const labelSpan = document.createElement('span');
  labelSpan.className = 'editor-field__label';
  labelSpan.textContent = labelText;
  label.append(labelSpan, control);
  return label;
}

function textInput(value, onInput, options = {}) {
  const input = document.createElement('input');
  input.type = options.type || 'text';
  input.value = value ?? '';
  if (options.placeholder) input.placeholder = options.placeholder;
  if (options.readOnly) input.readOnly = true;
  if (options.min !== undefined) input.min = String(options.min);
  input.addEventListener('input', () => onInput(input.value));
  return input;
}

function textArea(value, onInput, rows = 4) {
  const textarea = document.createElement('textarea');
  textarea.value = value ?? '';
  textarea.rows = rows;
  textarea.addEventListener('input', () => onInput(textarea.value));
  return textarea;
}

function selectInput(values, selected, onChange) {
  const select = document.createElement('select');
  values.forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value.replaceAll('-', ' ');
    option.selected = value === selected;
    select.append(option);
  });
  select.addEventListener('change', () => onChange(select.value));
  return select;
}

function markDirty() {
  state.dirty = true;
  updateEditingChrome();
}

function showNotice(message, kind = 'info') {
  els.editorNotice.textContent = message;
  els.editorNotice.className = `editor-notice editor-notice--${kind}`;
  els.editorNotice.hidden = false;
}

function clearNotice() {
  els.editorNotice.hidden = true;
  els.editorNotice.textContent = '';
}

function selectedWork() {
  return state.index.works.find(work => work.id === els.workSelect.value) || state.index.works[0];
}

function renderWorkOptions() {
  els.workSelect.replaceChildren();
  state.index.works.forEach(work => {
    const option = document.createElement('option');
    option.value = work.id;
    option.textContent = work.title;
    els.workSelect.append(option);
  });
}

function renderSectionNav() {
  els.workTitle.textContent = state.work.title;
  els.sectionList.replaceChildren();
  state.work.sections.forEach(section => {
    const fragment = els.sectionButtonTemplate.content.cloneNode(true);
    const button = fragment.querySelector('button');
    button.dataset.sectionId = section.id;
    button.classList.toggle('is-active', state.section && state.section.id === section.id);
    button.querySelector('.section-number').textContent = String(section.order).padStart(2, '0');
    button.querySelector('.section-name').textContent = section.title;
    button.querySelector('.status-dot').classList.toggle('status-dot--ready', section.readiness === 'packaged');
    button.addEventListener('click', () => {
      if (state.section && state.section.id === section.id) return;
      if (!guardDiscard()) return;
      selectSection(section);
    });
    els.sectionList.append(fragment);
  });
}

function renderFundSummary(entries) {
  els.fundSummary.replaceChildren();
  if (!visiblePackage()) return;
  els.fundSummary.append(makeChip(`${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`));
  FUND_STATUSES.forEach(status => {
    const count = entries.filter(entry => entry.status === status).length;
    if (count) els.fundSummary.append(makeChip(`${count} ${status}`));
  });
}

function provenanceDetails(entry) {
  const details = document.createElement('details');
  details.className = 'provenance-details';
  const summary = document.createElement('summary');
  summary.textContent = 'Provenance (read only)';
  const pre = document.createElement('pre');
  pre.textContent = JSON.stringify(entry.provenance, null, 2);
  details.append(summary, pre);
  return details;
}

function renderSourceEditor(entry, card) {
  const group = document.createElement('div');
  group.className = 'source-editor';
  const heading = document.createElement('div');
  heading.className = 'source-editor__heading';
  const title = document.createElement('span');
  title.textContent = 'Sources';
  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'text-button';
  add.textContent = 'Add source';
  add.addEventListener('click', () => {
    entry.sources.push({ title: '', url: '' });
    markDirty();
    renderFund();
  });
  heading.append(title, add);
  group.append(heading);

  if (entry.sources.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'field-help';
    empty.textContent = 'No sources attached.';
    group.append(empty);
  }
  entry.sources.forEach((source, index) => {
    const row = document.createElement('div');
    row.className = 'source-row';
    row.append(
      makeField('Title', textInput(source.title, value => { source.title = value; markDirty(); })),
      makeField('URL', textInput(source.url, value => { source.url = value; markDirty(); }, { type: 'url' }))
    );
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'icon-button';
    remove.setAttribute('aria-label', `Remove source ${index + 1}`);
    remove.textContent = '×';
    remove.addEventListener('click', () => {
      entry.sources.splice(index, 1);
      markDirty();
      renderFund();
    });
    row.append(remove);
    group.append(row);
  });
  card.append(group);
}

function renderStatusEditor(entry, card) {
  const group = document.createElement('fieldset');
  group.className = 'status-editor';
  const legend = document.createElement('legend');
  legend.textContent = 'Editorial status';
  group.append(legend);
  FUND_STATUSES.forEach(status => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'status-choice';
    button.textContent = status;
    button.setAttribute('aria-pressed', String(entry.status === status));
    button.addEventListener('click', () => {
      entry.status = status;
      group.querySelectorAll('.status-choice').forEach(candidate => {
        candidate.setAttribute('aria-pressed', String(candidate.textContent === status));
      });
      markDirty();
      renderFundSummary(state.draft.fundEntries);
    });
    group.append(button);
  });
  card.append(group);
}

function renderAnchorEditor(entry, card) {
  const group = document.createElement('fieldset');
  group.className = 'anchor-editor';
  const legend = document.createElement('legend');
  legend.textContent = 'Anchored passages';
  group.append(legend);
  state.draft.spine.forEach((passage, index) => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = entry.anchors.includes(passage.id);
    checkbox.addEventListener('change', () => {
      entry.anchors = checkbox.checked
        ? [...new Set([...entry.anchors, passage.id])]
        : entry.anchors.filter(id => id !== passage.id);
      markDirty();
    });
    label.append(checkbox, document.createTextNode(`${String(index + 1).padStart(2, '0')} · ${passage.id}`));
    group.append(label);
  });
  card.append(group);
}

function renderFundEntryEditor(entry) {
  const card = document.createElement('article');
  card.className = 'fund-card fund-card--editing';
  card.dataset.entryId = entry.id;
  const existing = state.package.fundEntries.some(candidate => candidate.id === entry.id);

  const identity = document.createElement('div');
  identity.className = 'editor-grid editor-grid--identity';
  identity.append(
    makeField('Entry ID', textInput(entry.id, value => {
      if (!existing) { entry.id = value; card.dataset.entryId = value; markDirty(); }
    }, { readOnly: existing })),
    makeField('Kind', selectInput(FUND_KINDS, entry.kind, value => { entry.kind = value; markDirty(); }))
  );
  card.append(identity);
  card.append(makeField('Title', textInput(entry.title, value => { entry.title = value; markDirty(); })));
  renderStatusEditor(entry, card);
  card.append(makeField('Fund text', textArea(entry.markdown, value => { entry.markdown = value; markDirty(); }, 7)));
  card.append(makeField('Use when', textArea(entry.useWhen, value => { entry.useWhen = value; markDirty(); }, 3)));
  renderAnchorEditor(entry, card);

  const threadGrid = document.createElement('div');
  threadGrid.className = 'editor-grid editor-grid--thread';
  const threadId = textInput(entry.thread?.id || '', value => {
    const id = value.trim();
    entry.thread = id ? { id, order: entry.thread?.order || 1 } : null;
    markDirty();
  }, { placeholder: 'Optional thread ID' });
  const threadOrder = textInput(entry.thread?.order || 1, value => {
    if (entry.thread) entry.thread.order = Number(value);
    markDirty();
  }, { type: 'number', min: 1 });
  threadGrid.append(makeField('Thread', threadId), makeField('Thread order', threadOrder));
  card.append(threadGrid);

  card.append(makeField('Source status', selectInput(SOURCE_STATUSES, entry.sourceStatus, value => {
    entry.sourceStatus = value;
    markDirty();
  })));
  renderSourceEditor(entry, card);
  card.append(provenanceDetails(entry));

  if (!existing) {
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'danger-button';
    remove.textContent = 'Remove new entry';
    remove.addEventListener('click', () => {
      state.draft.fundEntries = state.draft.fundEntries.filter(candidate => candidate !== entry);
      markDirty();
      renderFund();
    });
    card.append(remove);
  }
  return card;
}

function renderFundEntry(entry) {
  const card = document.createElement('article');
  card.className = 'fund-card';
  card.dataset.entryId = entry.id;
  const meta = document.createElement('div');
  meta.className = 'fund-card__meta';
  const kind = document.createElement('span');
  kind.className = 'kind-label';
  kind.textContent = entry.kind;
  const status = document.createElement('span');
  status.className = `status-label status-label--${entry.status}`;
  status.textContent = entry.status;
  meta.append(kind, status);
  const title = document.createElement('h3');
  title.textContent = entry.title;
  card.append(meta, title, renderMarkdown(entry.markdown));

  if (entry.sourceStatus === 'needs-verification') {
    const warning = document.createElement('p');
    warning.className = 'source-warning';
    warning.textContent = 'Source needed before this factual material is accepted.';
    card.append(warning);
  }
  const details = document.createElement('dl');
  details.className = 'entry-detail';
  const rows = [
    ['Use when', entry.useWhen], ['Anchors', entry.anchors.join(', ')],
    ['Thread', entry.thread ? `${entry.thread.id} · ${entry.thread.order}` : '—'],
    ['Source status', entry.sourceStatus],
    ['Origin', `${entry.provenance.type}${entry.provenance.sessionId ? ` · ${entry.provenance.sessionId}` : ''}`],
    ['Turns', entry.provenance.turns.length ? entry.provenance.turns.join(', ') : '—'],
  ];
  rows.forEach(([label, value]) => {
    const dt = document.createElement('dt'); dt.textContent = label;
    const dd = document.createElement('dd'); dd.textContent = value;
    details.append(dt, dd);
  });
  if (entry.provenance.artifactPath) {
    const dt = document.createElement('dt'); dt.textContent = 'Artifact';
    const dd = document.createElement('dd');
    const artifact = document.createElement('a');
    artifact.textContent = entry.provenance.artifactPath.split('/').pop();
    if (entry.provenance.artifactPath.startsWith('editorial/')) {
      artifact.href = entry.provenance.artifactPath.replace(/^editorial\//, '');
      artifact.target = '_blank'; artifact.rel = 'noopener noreferrer';
    } else artifact.title = entry.provenance.artifactPath;
    dd.append(artifact); details.append(dt, dd);
  }
  if (entry.sources.length) {
    const dt = document.createElement('dt'); dt.textContent = 'Sources'; details.append(dt);
    entry.sources.forEach(source => {
      const dd = document.createElement('dd');
      const link = document.createElement('a');
      link.href = source.url; link.textContent = source.title; link.target = '_blank'; link.rel = 'noopener noreferrer';
      dd.append(link); details.append(dd);
    });
  }
  card.append(details);
  return card;
}

function renderFund() {
  els.fundList.replaceChildren();
  const sectionPackage = visiblePackage();
  if (!sectionPackage) {
    els.fundContext.textContent = 'This section has no spine-and-fund package yet.';
    els.fundSummary.replaceChildren(); els.clearFilter.hidden = true; return;
  }
  const allEntries = sectionPackage.fundEntries;
  const entries = state.editing || !state.selectedPassageId
    ? allEntries : allEntries.filter(entry => entry.anchors.includes(state.selectedPassageId));
  renderFundSummary(entries);
  els.clearFilter.hidden = state.editing || !state.selectedPassageId;
  els.fundContext.textContent = state.editing
    ? 'Edit the complete fund. Existing IDs and provenance remain stable; statuses and editorial fields are author-controlled.'
    : state.selectedPassageId ? `Entries anchored to ${state.selectedPassageId}.`
      : 'Candidate and accepted material available for selective presentation.';
  if (entries.length === 0) {
    const message = document.createElement('p');
    message.className = 'fund-context'; message.textContent = 'No fund entries are anchored to this passage.';
    els.fundList.append(message); return;
  }
  entries.forEach(entry => els.fundList.append(state.editing ? renderFundEntryEditor(entry) : renderFundEntry(entry)));
}

function renderSpine() {
  els.spineView.replaceChildren();
  const sectionPackage = visiblePackage();
  if (!sectionPackage) return;
  sectionPackage.spine.forEach((passage, index) => {
    const article = document.createElement('article');
    article.className = `passage${state.editing ? ' passage--editing' : ''}`;
    article.dataset.passageId = passage.id;
    article.classList.toggle('is-selected', passage.id === state.selectedPassageId);
    const label = document.createElement('div');
    label.className = 'passage-label';
    label.append(document.createTextNode(`Passage ${String(index + 1).padStart(2, '0')} · ${passage.id}`));
    const fundCount = sectionPackage.fundEntries.filter(entry => entry.anchors.includes(passage.id)).length;
    if (fundCount) {
      const count = document.createElement('span');
      count.className = 'passage-fund-count'; count.textContent = `${fundCount} fund ${fundCount === 1 ? 'entry' : 'entries'}`;
      label.append(count);
    }
    if (state.editing) {
      const textarea = textArea(passage.markdown, value => { passage.markdown = value; markDirty(); }, 12);
      textarea.className = 'passage-editor'; textarea.setAttribute('aria-label', `Edit passage ${index + 1}`);
      article.append(label, textarea);
    } else {
      article.tabIndex = 0; article.setAttribute('role', 'button');
      article.setAttribute('aria-label', `Filter fund entries for passage ${index + 1}`);
      article.append(label, renderMarkdown(passage.markdown));
      const choose = () => {
        state.selectedPassageId = state.selectedPassageId === passage.id ? null : passage.id;
        renderSpine(); renderFund();
      };
      article.addEventListener('click', choose);
      article.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(); }
      });
    }
    els.spineView.append(article);
  });
}

function updateEditingChrome() {
  els.editSection.hidden = state.editing || !state.package;
  els.editToolbar.hidden = !state.editing;
  els.addFundEntry.hidden = !state.editing;
  els.workSelect.disabled = state.editing || state.saving;
  els.publishSection.disabled = state.saving || !state.dirty;
  els.publishSection.textContent = state.saving ? 'Publishing…' : 'Publish author revision';
  els.cancelEdit.disabled = state.saving;
  document.body.classList.toggle('is-editing', state.editing);
}

function renderSection() {
  renderSectionNav();
  els.sectionKicker.textContent = `Section ${state.section.order}`;
  els.sectionTitle.textContent = state.section.title;
  els.emptyNumber.textContent = String(state.section.order).padStart(2, '0');
  els.emptySection.hidden = Boolean(state.package); els.spineView.hidden = !state.package;
  if (state.package) {
    const sectionPackage = visiblePackage();
    const acceptedCount = sectionPackage.fundEntries.filter(entry => entry.status === 'accepted').length;
    const candidateCount = sectionPackage.fundEntries.filter(entry => entry.status === 'candidate').length;
    const historicalCount = sectionPackage.fundEntries.length - acceptedCount - candidateCount;
    els.sectionSummary.replaceChildren();
    const version = document.createElement('div');
    version.textContent = `${state.package.versionId}${state.packageSource ? ` · ${state.packageSource === 'kv' ? 'live KV' : 'local seed'}` : ''}`;
    const counts = document.createElement('div');
    counts.textContent = `${sectionPackage.spine.length} passages · ${acceptedCount} accepted · ${candidateCount} candidates${historicalCount ? ` · ${historicalCount} historical` : ''}`;
    els.sectionSummary.append(version, counts);
    if (state.editing) els.sectionSummary.append(makeChip('Unpublished author draft'));
  } else els.sectionSummary.textContent = 'Not yet packaged';
  renderSpine(); renderFund(); updateEditingChrome();
}

function guardDiscard() {
  if (!state.editing || !state.dirty) return true;
  return window.confirm('Discard the unpublished author edits?');
}

async function selectSection(section) {
  state.section = section; state.selectedPassageId = null; state.package = null; state.packageSource = null;
  state.editing = false; state.draft = null; state.dirty = false; clearNotice(); renderSection();
  if (!section.packageUrl) return;
  try {
    const currentUrl = `/api/current-section?textId=${encodeURIComponent(state.work.id)}&sectionIndex=${section.order - 1}`;
    let response = await fetch(currentUrl);
    if (response.ok) {
      const current = await response.json();
      state.package = normalizePackage(current.sectionPackage); state.packageSource = current.source;
    } else {
      response = await fetch(section.packageUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      state.package = normalizePackage(await response.json()); state.packageSource = 'seed';
    }
    if (state.section.id === section.id) renderSection();
  } catch (error) { showFatalError(`Could not load ${section.title}: ${error.message}`); }
}

function selectWork(work) {
  state.work = work;
  const firstReady = work.sections.find(section => section.readiness === 'packaged');
  selectSection(firstReady || work.sections[0]);
}

function showFatalError(message) {
  const box = document.createElement('div'); box.className = 'error-box'; box.textContent = message;
  document.querySelector('.workspace').replaceChildren(box);
}

function beginEdit() {
  if (!state.package) return;
  clearNotice(); state.editing = true; state.draft = clone(normalizePackage(state.package));
  state.baseVersionId = state.package.versionId; state.selectedPassageId = null; state.dirty = false;
  els.changeSummary.value = ''; renderSection();
}

function cancelEdit() {
  if (!guardDiscard()) return;
  state.editing = false; state.draft = null; state.baseVersionId = null; state.dirty = false;
  clearNotice(); renderSection();
}

function addFundEntry() {
  const existingIds = new Set(state.draft.fundEntries.map(entry => entry.id));
  let index = 1;
  while (existingIds.has(`new-entry-${index}`)) index += 1;
  state.draft.fundEntries.push({
    id: `new-entry-${index}`, title: '', anchors: [state.draft.spine[0].id],
    kind: 'clarification', status: 'candidate', markdown: '', useWhen: '', thread: null,
    sourceStatus: 'not-required', sources: [],
    provenance: { type: 'author-editor', sessionId: null, turns: [], artifactPath: null },
  });
  markDirty(); renderFund();
  els.fundList.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function publishDraft() {
  if (!state.editing || !state.dirty || state.saving) return;
  const changeSummary = els.changeSummary.value.trim();
  if (!changeSummary) {
    showNotice('Add a concise change summary before publishing.', 'error');
    els.changeSummary.focus(); return;
  }
  clearNotice(); state.saving = true; updateEditingChrome();
  try {
    const response = await fetch('/api/author-section', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        textId: state.work.id, sectionIndex: state.section.order - 1,
        baseVersionId: state.baseVersionId, changeSummary,
        spine: state.draft.spine, fundEntries: state.draft.fundEntries,
      }),
    });
    const result = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
    state.package = normalizePackage(result.sectionPackage); state.packageSource = result.source;
    state.editing = false; state.draft = null; state.baseVersionId = null; state.dirty = false;
    els.changeSummary.value = ''; renderSection();
    showNotice(`Published ${state.package.versionId} as an author revision.`, 'success');
  } catch (error) { showNotice(error.message, 'error'); }
  finally { state.saving = false; updateEditingChrome(); }
}

els.workSelect.addEventListener('change', () => {
  if (!guardDiscard()) { els.workSelect.value = state.work.id; return; }
  selectWork(selectedWork());
});
els.clearFilter.addEventListener('click', () => {
  state.selectedPassageId = null; renderSpine(); renderFund();
});
els.editSection.addEventListener('click', beginEdit);
els.cancelEdit.addEventListener('click', cancelEdit);
els.publishSection.addEventListener('click', publishDraft);
els.addFundEntry.addEventListener('click', addFundEntry);
els.changeSummary.addEventListener('input', updateEditingChrome);
window.addEventListener('beforeunload', event => {
  if (!state.editing || !state.dirty) return;
  event.preventDefault(); event.returnValue = '';
});

async function init() {
  try {
    const response = await fetch('data/index.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.index = await response.json(); renderWorkOptions(); selectWork(state.index.works[0]);
  } catch (error) {
    showFatalError(`Editorial data could not be loaded (${error.message}). Run npm run editorial-build, then npm run editorial-preview.`);
  }
}

init();
