'use strict';

const state = {
  index: null,
  work: null,
  section: null,
  package: null,
  selectedPassageId: null,
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
};

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
    const trimmed = block.trim();
    if (!trimmed) return;
    const isQuote = trimmed.startsWith('>');
    const element = document.createElement(isQuote ? 'blockquote' : 'p');
    appendInlineMarkdown(element, isQuote ? trimmed.replace(/^>\s?/gm, '') : trimmed);
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
    button.addEventListener('click', () => selectSection(section));
    els.sectionList.append(fragment);
  });
}

function renderFundSummary(entries) {
  els.fundSummary.replaceChildren();
  if (!state.package) return;
  const candidateCount = entries.filter(entry => entry.status === 'candidate').length;
  const acceptedCount = entries.filter(entry => entry.status === 'accepted').length;
  els.fundSummary.append(
    makeChip(`${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`),
    makeChip(`${candidateCount} candidate`),
    makeChip(`${acceptedCount} accepted`)
  );
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
  status.className = 'status-label';
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
  const detailRows = [
    ['Use when', entry.useWhen],
    ['Anchors', entry.anchors.join(', ')],
    ['Origin', `${entry.provenance.type}${entry.provenance.sessionId ? ` · ${entry.provenance.sessionId}` : ''}`],
    ['Turns', entry.provenance.turns.length ? entry.provenance.turns.join(', ') : '—'],
  ];
  detailRows.forEach(([label, value]) => {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    details.append(dt, dd);
  });

  if (entry.provenance.artifactPath) {
    const dt = document.createElement('dt');
    dt.textContent = 'Artifact';
    const dd = document.createElement('dd');
    const artifact = document.createElement('a');
    artifact.textContent = entry.provenance.artifactPath.split('/').pop();
    if (entry.provenance.artifactPath.startsWith('editorial/')) {
      artifact.href = entry.provenance.artifactPath.replace(/^editorial\//, '');
      artifact.target = '_blank';
      artifact.rel = 'noopener noreferrer';
    } else {
      artifact.removeAttribute('href');
      artifact.title = entry.provenance.artifactPath;
    }
    dd.append(artifact);
    details.append(dt, dd);
  }

  if (entry.sources.length) {
    const dt = document.createElement('dt');
    dt.textContent = 'Sources';
    details.append(dt);
    entry.sources.forEach(source => {
      const dd = document.createElement('dd');
      const link = document.createElement('a');
      link.href = source.url;
      link.textContent = source.title;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      dd.append(link);
      details.append(dd);
    });
  }
  card.append(details);
  return card;
}

function renderFund() {
  els.fundList.replaceChildren();
  if (!state.package) {
    els.fundContext.textContent = 'This section has no spine-and-fund package yet.';
    els.fundSummary.replaceChildren();
    els.clearFilter.hidden = true;
    return;
  }

  const allEntries = state.package.fundEntries;
  const entries = state.selectedPassageId
    ? allEntries.filter(entry => entry.anchors.includes(state.selectedPassageId))
    : allEntries;
  renderFundSummary(entries);
  els.clearFilter.hidden = !state.selectedPassageId;
  els.fundContext.textContent = state.selectedPassageId
    ? `Entries anchored to ${state.selectedPassageId}.`
    : 'Candidate and accepted material available for selective presentation.';

  if (entries.length === 0) {
    const message = document.createElement('p');
    message.className = 'fund-context';
    message.textContent = 'No fund entries are anchored to this passage.';
    els.fundList.append(message);
    return;
  }
  entries.forEach(entry => els.fundList.append(renderFundEntry(entry)));
}

function renderSpine() {
  els.spineView.replaceChildren();
  if (!state.package) return;
  state.package.spine.forEach((passage, index) => {
    const article = document.createElement('article');
    article.className = 'passage';
    article.dataset.passageId = passage.id;
    article.classList.toggle('is-selected', passage.id === state.selectedPassageId);
    article.tabIndex = 0;
    article.setAttribute('role', 'button');
    article.setAttribute('aria-label', `Filter fund entries for passage ${index + 1}`);

    const label = document.createElement('div');
    label.className = 'passage-label';
    label.append(document.createTextNode(`Passage ${String(index + 1).padStart(2, '0')} · ${passage.id}`));
    const fundCount = state.package.fundEntries.filter(entry => entry.anchors.includes(passage.id)).length;
    if (fundCount) {
      const count = document.createElement('span');
      count.className = 'passage-fund-count';
      count.textContent = `${fundCount} fund ${fundCount === 1 ? 'entry' : 'entries'}`;
      label.append(count);
    }
    article.append(label, renderMarkdown(passage.markdown));

    const choose = () => {
      state.selectedPassageId = state.selectedPassageId === passage.id ? null : passage.id;
      renderSpine();
      renderFund();
    };
    article.addEventListener('click', choose);
    article.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        choose();
      }
    });
    els.spineView.append(article);
  });
}

function renderSection() {
  renderSectionNav();
  els.sectionKicker.textContent = `Section ${state.section.order}`;
  els.sectionTitle.textContent = state.section.title;
  els.emptyNumber.textContent = String(state.section.order).padStart(2, '0');
  els.emptySection.hidden = Boolean(state.package);
  els.spineView.hidden = !state.package;

  if (state.package) {
    const candidateCount = state.package.fundEntries.filter(entry => entry.status === 'candidate').length;
    els.sectionSummary.innerHTML = '';
    const version = document.createElement('div');
    version.textContent = state.package.versionId;
    const counts = document.createElement('div');
    counts.textContent = `${state.package.spine.length} passages · ${candidateCount} candidates`;
    els.sectionSummary.append(version, counts);
  } else {
    els.sectionSummary.textContent = 'Not yet packaged';
  }
  renderSpine();
  renderFund();
}

async function selectSection(section) {
  state.section = section;
  state.selectedPassageId = null;
  state.package = null;
  renderSection();
  if (!section.packageUrl) return;
  try {
    const response = await fetch(section.packageUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.package = await response.json();
    if (state.section.id === section.id) renderSection();
  } catch (err) {
    showError(`Could not load ${section.title}: ${err.message}`);
  }
}

function selectWork(work) {
  state.work = work;
  const firstReady = work.sections.find(section => section.readiness === 'packaged');
  selectSection(firstReady || work.sections[0]);
}

function showError(message) {
  const box = document.createElement('div');
  box.className = 'error-box';
  box.textContent = message;
  document.querySelector('.workspace').replaceChildren(box);
}

els.workSelect.addEventListener('change', () => selectWork(selectedWork()));
els.clearFilter.addEventListener('click', () => {
  state.selectedPassageId = null;
  renderSpine();
  renderFund();
});

async function init() {
  try {
    const response = await fetch('data/index.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.index = await response.json();
    renderWorkOptions();
    selectWork(state.index.works[0]);
  } catch (err) {
    showError(`Editorial data could not be loaded (${err.message}). Run npm run editorial-build, then serve the repository through vercel dev.`);
  }
}

init();
