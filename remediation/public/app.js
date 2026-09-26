const conv = document.getElementById('conversation');
const input = document.getElementById('message-input');
const intro = document.getElementById('intro');
const leftCol = document.getElementById('left-col');
const readerHistory = document.getElementById('reader-history');

let history = [];
let sectionIndex = 0;
let shownImages = new Set();
let saveConsent = false;
// Which text this session reads when not contributing: the collectively-evolved
// edition as it stands today, or the untouched original. Contributing always means
// reading (and building on) the evolving edition.
let readingEdition = 'evolving';
let sectionHistoryStart = 0;
const contributionHistory = [];
const sectionHistories = new Map();
const sectionSummaries = new Map();
const editorialVersionIds = new Map();
const presentedFundEntryIds = new Map();
const contributionSessionId = `intertext-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const completedSections = new Set();
let sending = false;
let endShown = false;
const CONTINUE_MESSAGE = 'Continue reading from where we have reached in this section.';

const SECTION_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

const SECTION_TITLES = [
  'The Two Logics of Remediation',
  'Perspective and Automaticity',
  'Photorealism and the Real',
  'The Windowed Interface',
  'A Genealogy of Hypermediacy',
  'Repurposing and Remediation',
  'Rivalry and Refashioning',
];

function priorSectionSummaries(activeSection) {
  return Array.from(sectionSummaries.entries())
    .filter(([section]) => section !== activeSection)
    .sort(([a], [b]) => a - b)
    .map(([section, summary]) => ({
      sectionIndex: section,
      title: SECTION_TITLES[section],
      summary,
    }));
}

const SECTION_IMAGES = [
  null, null, null, null, null, null, null,
];

// Flat lookup map for inline image tokens
const IMAGE_MAP = {};
SECTION_IMAGES.forEach(section => {
  if (section) section.forEach(img => { IMAGE_MAP[img.id] = img; });
});

const SECTION_INTROS = [
  `<p>Contemporary media are pulled by two contrary desires. One is for a medium that disappears, leaving an apparently immediate encounter with the real. The other is for a medium that displays its own surfaces, interruptions, and multiplicity. Remediation develops through the interplay between these logics of transparent immediacy and hypermediacy.</p>`,

  `<p>The wish to make a medium disappear did not begin with digital technology. Linear perspective, oil painting, photography, and computer graphics each promise transparency through different techniques: mathematical space, the erasure of the surface, automatic reproduction, or the deferral of human agency into a program.</p>`,

  `<p>Photorealism measures a digital image against photography rather than against an unmediated world. Animation and virtual reality extend that standard into movement and responsiveness, even while the apparatus and the viewer&rsquo;s knowledge of mediation remain. The desire for immediacy persists through the very media it seeks to erase.</p>`,

  `<p>The graphical user interface does not offer a single transparent window onto a unified world. It offers many windows, menus, icons, and overlapping spaces. Its automatic operations coexist with constant human intervention, making the interface a contemporary expression of the logic of hypermediacy.</p>`,

  `<p>Hypermediacy has a history as long as the desire for transparency. Illuminated manuscripts, cabinets of curiosities, Dutch painting, photography, collage, graphic design, rock music, CD-ROMs, and the Web all multiply media and forms of representation. They make viewing an oscillation between looking through a medium and looking at it.</p>`,

  `<p>A new medium often begins by borrowing the content and conventions of an older one. Film adapts the novel; digital collections re-present painting, photography, and print; electronic encyclopedias promise to improve the printed book. These acts of repurposing range from transparent access to visibly altered, translucent forms.</p>`,

  `<p>Remediation can become an explicit rivalry in which one medium refashions, absorbs, or is absorbed by another. Digital media refashion film and television, while film and television appropriate digital graphics in return. No medium escapes this dialectic: claims of novelty are themselves measured against the media they would supersede.</p>`,
];

// ── Consent dialog ──

function focusInput() {
  input.focus({ preventScroll: true });
  input.setSelectionRange(input.value.length, input.value.length);
}

function chooseEntry(consent, edition) {
  saveConsent = consent;
  readingEdition = edition;
  document.getElementById('consent-overlay').style.display = 'none';
  focusInput();
}

document.getElementById('consent-contribute').addEventListener('click', () => chooseEntry(true, 'evolving'));
document.getElementById('consent-current').addEventListener('click', () => chooseEntry(false, 'evolving'));
document.getElementById('consent-original').addEventListener('click', () => chooseEntry(false, 'original'));

// ── Initialise first section ──

intro.innerHTML = SECTION_INTROS[sectionIndex];
intro.classList.add('is-hiding');
appendSectionBreak(0, false);

// ── TOC navigation ──

function selectSection(newIdx) {
  if (newIdx === sectionIndex) return;
  saveCurrentSection();
  sectionHistoryStart = contributionHistory.length;
  sectionIndex = newIdx;
  document.querySelectorAll('.toc-item').forEach(el => {
    el.classList.toggle('active', Number(el.dataset.section) === newIdx);
  });
  intro.innerHTML = SECTION_INTROS[sectionIndex];
  appendSectionBreak(sectionIndex);
}

document.querySelectorAll('.toc-item').forEach(item => {
  item.addEventListener('click', () => {
    if (!sending) selectSection(Number(item.dataset.section));
  });
});

// ── Finish button ──

document.getElementById('finish-btn').addEventListener('click', async () => {
  if (saveConsent) {
    showFarewellSaving();
    await saveCurrentSection();
    showFarewellDone();
  } else {
    showFarewellDone();
  }
});

// ── Save and farewell ──

async function saveCurrentSection() {
  if (!saveConsent) return;
  const sectionToSave = sectionIndex;
  const slice = contributionHistory.slice(sectionHistoryStart);
  if (slice.length === 0) return;
  try {
    const res = await fetch('/api/evolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sectionIndex: sectionToSave,
        conversationHistory: slice,
        textId: 'remediation',
        sessionId: contributionSessionId,
        baseVersionId: editorialVersionIds.get(sectionToSave) || null,
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Editorial update failed');
    if (data.editorial?.versionId) editorialVersionIds.set(sectionToSave, data.editorial.versionId);
    return data;
  } catch (error) {
    appendSystemMessage(`Your contribution could not be saved: ${error.message}`);
    return null;
  }
}

function showFarewellSaving() {
  document.getElementById('farewell-saving').style.display = '';
  document.getElementById('farewell-done').style.display = 'none';
  document.getElementById('farewell').style.display = 'flex';
}

function showFarewellDone() {
  document.getElementById('farewell-saving').style.display = 'none';
  document.getElementById('farewell-done').style.display = '';
  document.getElementById('farewell').style.display = 'flex';
}

// ── DOM helpers ──

function appendSectionBreak(idx, scroll = true) {
  const el = document.createElement('div');
  el.className = 'section-break';

  const header = document.createElement('div');
  header.className = 'section-break-header';

  const num = document.createElement('span');
  num.className = 'section-break-num';
  num.textContent = SECTION_NUMERALS[idx];

  const title = document.createElement('span');
  title.textContent = SECTION_TITLES[idx];

  header.appendChild(num);
  header.appendChild(title);

  const introBox = document.createElement('div');
  introBox.className = 'section-break-intro';
  introBox.innerHTML = SECTION_INTROS[idx];

  el.appendChild(header);
  el.appendChild(introBox);
  conv.appendChild(el);

  // Automatic advancement happens while the thinking indicator already exists.
  // Keep it after the newly inserted opening rather than stranded above it.
  const thinking = document.getElementById('thinking');
  if (thinking) conv.appendChild(thinking);
  if (scroll) (thinking || el).scrollIntoView({ behavior: 'smooth', block: thinking ? 'end' : 'start' });
}

function renderText(container, text) {
  const re = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) container.appendChild(document.createTextNode(text.slice(last, m.index)));
    const a = document.createElement('a');
    a.href = m[2];
    a.textContent = m[1];
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    container.appendChild(a);
    last = re.lastIndex;
  }
  if (last < text.length) container.appendChild(document.createTextNode(text.slice(last)));
}

function appendGuideResponse(text) {
  const turn = document.createElement('div');
  turn.className = 'turn';

  const label = document.createElement('div');
  label.className = 'turn-label';
  label.textContent = 'Guide';

  const body = document.createElement('div');
  body.className = 'turn-body';

  // Split on [[IMAGE:id]] tokens; odd-indexed parts are image ids
  const parts = text.split(/\[\[IMAGE:([^\]]+)\]\]/);
  parts.forEach((part, i) => {
    if (i % 2 === 0) {
      part.split(/\n\n+/).forEach(para => {
        const trimmed = para.trim();
        if (trimmed) {
          const p = document.createElement('p');
          if (trimmed.startsWith('Sources: ')) p.className = 'turn-sources';
          renderText(p, trimmed);
          body.appendChild(p);
        }
      });
    } else {
      const id = part.trim();
      const imgData = IMAGE_MAP[id];
      if (imgData) {
        shownImages.add(id);
        const img = document.createElement('img');
        img.src = imgData.src;
        img.alt = imgData.alt;
        img.className = 'response-image';
        body.appendChild(img);
      }
    }
  });

  turn.appendChild(label);
  turn.appendChild(body);
  conv.appendChild(turn);
  turn.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function appendReaderMessage(text) {
  const entry = document.createElement('div');
  entry.className = 'reader-entry';
  entry.textContent = text;
  readerHistory.appendChild(entry);
  readerHistory.scrollTop = readerHistory.scrollHeight;
}

function showThinking() {
  const el = document.createElement('div');
  el.className = 'thinking';
  el.id = 'thinking';
  const spinner = document.createElement('div');
  spinner.className = 'thinking-spinner';
  el.appendChild(spinner);
  conv.appendChild(el);
  el.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function removeThinking() {
  const el = document.getElementById('thinking');
  if (el) el.remove();
}

function appendSystemMessage(text) {
  const el = document.createElement('div');
  el.className = 'system-message';
  el.textContent = text;
  conv.appendChild(el);
  el.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

// Keep the writing position visible even while the reader looks elsewhere.
function updateCaretMarker() {
  input.parentElement.classList.toggle('show-caret', input.value === '' && input.placeholder === '');
}

// ── Send ──

function setSending(value) {
  sending = value;
  document.querySelectorAll('.toc-item').forEach(el => { el.disabled = value; });
  document.getElementById('finish-btn').disabled = value;
  input.setAttribute('aria-busy', String(value));
}

async function send() {
  if (sending) return;
  const text = input.value.trim();
  const continuing = !text;
  input.value = '';
  input.placeholder = '';
  updateCaretMarker();
  input.style.height = 'auto';
  if (!continuing) appendReaderMessage(text);
  input.focus();
  setSending(true);
  showThinking();

  try {
    // An exhausted section with no new prose advances in this same Enter press.
    for (;;) {
      if (continuing && completedSections.has(sectionIndex)) {
        if (sectionIndex === SECTION_TITLES.length - 1) {
          if (!endShown) appendSystemMessage('End of the final section.');
          endShown = true;
          break;
        }
        selectSection(sectionIndex + 1);
      }
      const activeSection = sectionIndex;
      const activeSectionHistory = sectionHistories.get(activeSection) || [];
      const firstContinuation = continuing && activeSectionHistory.length === 0;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text, history: readingEdition === 'original' ? history : [], sectionIndex: activeSection,
          shownImages: Array.from(shownImages), textId: 'remediation', edition: readingEdition,
          presentedFundEntryIds: Array.from(presentedFundEntryIds.get(activeSection) || []),
          ...(readingEdition !== 'original'
            ? {
                sectionHistory: activeSectionHistory,
                priorSectionSummaries: priorSectionSummaries(activeSection),
              }
            : {}),
          ...(editorialVersionIds.has(activeSection)
            ? { editorialVersionId: editorialVersionIds.get(activeSection) }
            : {}),
          ...(continuing
            ? {
                action: 'continue',
                firstContinuation,
                ...(readingEdition === 'original'
                  ? { sectionHistory: activeSectionHistory }
                  : {}),
              }
            : {})
        })
      });
      const data = await res.json();
      if (!res.ok || (!data.response && !(continuing && data.sectionComplete === true))) {
        throw new Error('No reading response');
      }
      if (data.editorial?.packageVersionId && !editorialVersionIds.has(activeSection)) {
        editorialVersionIds.set(activeSection, data.editorial.packageVersionId);
      }
      if (Array.isArray(data.editorial?.usedFundEntryIds)) {
        const used = presentedFundEntryIds.get(activeSection) || new Set();
        data.editorial.usedFundEntryIds.forEach(id => used.add(id));
        presentedFundEntryIds.set(activeSection, used);
      }
      if (typeof data.editorial?.sectionSummary === 'string' && data.editorial.sectionSummary.trim()) {
        sectionSummaries.set(activeSection, data.editorial.sectionSummary.trim());
      }
      if (data.response) {
        const turns = [
          { role: 'user', content: continuing ? CONTINUE_MESSAGE : text },
          { role: 'assistant', content: data.response }
        ];
        history.push(...turns);
        sectionHistories.set(activeSection, [...(sectionHistories.get(activeSection) || []), ...turns]);
        // Reading on is navigation, not a reader intervention for synthesis.
        if (!continuing) contributionHistory.push(...turns);
        appendGuideResponse(data.response);
      }
      if (continuing && data.sectionComplete === true) completedSections.add(activeSection);
      if (data.response) break;
    }
  } catch (err) {
    appendSystemMessage('Could not continue the conversation. Please try again.');
    if (!continuing && !input.value) input.value = text;
  } finally {
    removeThinking();
    setSending(false);
    updateCaretMarker();
    focusInput();
  }
}

input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    send();
  }
});

input.addEventListener('input', () => {
  // This hint is only for the first use, not each newly cleared draft.
  if (input.value.length > 0) input.placeholder = '';
  updateCaretMarker();
  const atLatest = readerHistory.scrollTop + readerHistory.clientHeight >= readerHistory.scrollHeight - 2;
  input.style.height = 'auto';
  input.style.height = input.scrollHeight + 'px';
  if (atLatest) readerHistory.scrollTop = readerHistory.scrollHeight;
});
