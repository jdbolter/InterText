const conv = document.getElementById('conversation');
const input = document.getElementById('message-input');
const goBtn = document.getElementById('go-btn');
const finishBtn = document.getElementById('finish-btn');
const runningPosition = document.getElementById('running-position');

let history = [];
let sectionIndex = 0;
let shownImages = new Set();
let shownMedia = new Set(); // H-018
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
const visitedSections = new Set();
let sending = false;
let endShown = false;
const CONTINUE_MESSAGE = 'Continue reading from where we have reached in this section.';

// H-014: one work in chapters; numerals start again in each chapter.
const SECTION_NUMERALS = ["I", "II", "III", "IV", "V", "VI"];

// H-014: must match config.chapters (number, title, firstSection); a test checks this.
const CHAPTERS = [
  { number: 1, title: "InterText", firstSection: 0, label: "The paper" },
];

// A chapter with a label (the Conclusion) is headed by the label alone.
function chapterHeading(chapter) {
  return chapter.label || `Chapter ${chapter.number}: ${chapter.title}`;
}

function chapterOf(idx) {
  let found = CHAPTERS[0];
  CHAPTERS.forEach(chapter => { if (chapter.firstSection <= idx) found = chapter; });
  return found;
}

const SECTION_TITLES = [
  "Introduction",
  "Literature Review",
  "How a Reading Works",
  "A Text That Evolves",
  "Synthetic Readers",
  "Further Development",
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

// Images live in intertext-paper/images/.
const SECTION_IMAGES = [
  null,
  null,
  [
    { id: "readers-page", src: "../images/fig-1-readers-page.png", alt: "InterText's reader's page for this paper: section III, How a Reading Works, set as a printed page, with a reader's question in the margin beside the reply it drew, the system diagram below it, and the contents of the six sections and the input on a dark column to the right", figure: true },
    { id: "system-overview", src: "../images/fig-2-system-overview.svg", alt: "Diagram of the InterText system: the author's original text feeds the interactive book (opening vignettes, points, spine, fund, library, media); system prompts and web search feed a model that drafts and then revises each reply to the reader; contributing readers' conversations go to an editorial evaluation whose approved changes are published as a new version", figure: true },
  ],
  [
    { id: "system-overview", src: "../images/fig-2-system-overview.svg", alt: "Diagram of the InterText system, with the loop by which contributing readers' conversations become new versions of the text", figure: true },
  ],
  [
    { id: "synthetic-reading", src: "../images/fig-3-synthetic-reading.svg", alt: "Diagram of the synthetic reading process: reader characters, a synthetic reader played by GPT 5.6 terra in dialogue with InterText, transcripts evaluated by script measures, a blind judge and the author, and revisions that lead to the next round", figure: true },
  ],
  null,
];

// Flat lookup map for inline image tokens
const IMAGE_MAP = {};
SECTION_IMAGES.forEach(section => {
  if (section) section.forEach(img => { IMAGE_MAP[img.id] = img; });
});

const SECTION_INTROS = [
  // Drafted by a Claude session; approved by Jay, 2026-11-25 (H-001, project intertext-paper).
  `<p>In 1992 the novelist Robert Coover announced the end of books: hypertext, he argued, would free readers from the fixed line of the printed page. Three decades later the most successful hypertext is Wikipedia, whose articles are still fixed pages joined by links. Large language models make a different change possible. A text can now answer its reader, take up an objection, and change what it says next. Literary theorists from Stanley Fish to Wolfgang Iser argued that meaning is made in the act of reading. InterText puts that idea to work.</p>`,
  `<p>In December 2025 Amazon added Ask this Book to the Kindle app, so that a reader can stop and question the book in hand. Google's Gemini and a growing number of other systems do the same, and some writers have gone further, handing part of the writing itself to a model, an approach Hannes Bajohr and Luciano Floridi call distant writing. In every case the text stays as it was. The reader can question the book but not change it, and the next reader receives the same book. InterText asks what happens when a text grows with each reading.</p>`,
  `<p>A reader opens a section and finds a short boxed passage. If she presses Return, about 250 words follow; if she types a question, the text answers it. Behind each reply stand the author's text and a statement of its argument, a library of works the text may cite, a set of checked images and videos, and two calls to a language model: one drafts the reply, the other revises it before the reader sees it. The reply is new each time, and it is meant to stay on the author's argument and close to the author's tone.</p>`,
  `<p>A reader who agrees to contribute finishes a section and closes the window. One pass of the model then reads the conversation and proposes changes to the text; a second pass reviews them, and only what it approves is published as a new version of the section. The next reader meets the changed text. Apart from the boxed openings, InterText has no canonical text: it takes shape in each conversation and evolves from one reading to the next, under rules the author sets.</p>`,
  `<p>Before any person reads it, InterText has been read many times by machines. A model from another company, OpenAI's GPT 5.6 terra, plays the reader: curious, skeptical, collaborative, a general reader, or a student with the chapter assigned. It asks, objects, presses Return or moves on, and after each turn notes privately how well it understood and how interested it is. Its sessions show where the text drifts or repeats, and they have sent the author back to his own argument.</p>`,
  `<p>The e-reader succeeded because it asked readers to change almost nothing: the page turns, the line runs on, and reading stays linear. InterText asks for more. The reader has to question, object or press on, and the text answers differently each time. Whether people will read this way is a question synthetic readers cannot settle. The next step is human readers.</p>`,
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

appendSectionBreak(0, false);
visitedSections.add(0);

// ── TOC navigation ──

// H-014: the contents list is built here, grouped by chapter; only the current chapter is open.
function buildToc() {
  const toc = document.getElementById('toc');
  toc.innerHTML = '';
  CHAPTERS.forEach((chapter, c) => {
    const last = c + 1 < CHAPTERS.length ? CHAPTERS[c + 1].firstSection : SECTION_TITLES.length;
    const group = document.createElement('div');
    group.className = 'toc-chapter';
    group.dataset.chapter = String(chapter.number);
    const head = document.createElement('button');
    head.className = 'toc-chapter-title';
    head.type = 'button';
    head.textContent = chapterHeading(chapter);
    head.addEventListener('click', () => group.classList.toggle('open'));
    const list = document.createElement('div');
    list.className = 'toc-sections';
    for (let i = chapter.firstSection; i < last; i += 1) {
      const item = document.createElement('button');
      item.className = 'toc-item';
      item.type = 'button';
      item.dataset.section = String(i);
      const num = document.createElement('span');
      num.className = 'toc-num';
      num.textContent = SECTION_NUMERALS[i];
      const title = document.createElement('span');
      title.className = 'toc-title';
      title.textContent = SECTION_TITLES[i];
      item.appendChild(num);
      item.appendChild(title);
      list.appendChild(item);
    }
    group.appendChild(head);
    group.appendChild(list);
    toc.appendChild(group);
  });
  markTocActive(sectionIndex);
}

function markTocActive(idx) {
  document.querySelectorAll('.toc-item').forEach(el => {
    const n = Number(el.dataset.section);
    el.classList.toggle('active', n === idx);
    el.classList.toggle('visited', visitedSections.has(n) && n !== idx);
    el.classList.toggle('complete', completedSections.has(n));
  });
  const current = String(chapterOf(idx).number);
  document.querySelectorAll('.toc-chapter').forEach(group => {
    group.classList.toggle('open', group.dataset.chapter === current);
    group.classList.toggle('current', group.dataset.chapter === current);
  });
  // Keep the active section in view within the list itself, without moving anything else.
  const toc = document.getElementById('toc');
  const active = document.querySelector('.toc-item.active');
  if (toc && active && typeof active.getBoundingClientRect === 'function') {
    const box = toc.getBoundingClientRect();
    const item = active.getBoundingClientRect();
    if (item.top < box.top) toc.scrollTop -= box.top - item.top + 16;
    else if (item.bottom > box.bottom) toc.scrollTop += item.bottom - box.bottom + 16;
  }
  updateRunningPosition(idx);
}

// The running head says where the reader is: the chapter, and the section's numeral and title.
function updateRunningPosition(idx) {
  if (!runningPosition) return;
  runningPosition.textContent = '';
  const chapter = chapterOf(idx);
  const where = document.createElement('span');
  where.className = 'pos-chapter';
  where.textContent = chapter.label ? chapter.label : `Chapter ${chapter.number}`;
  runningPosition.appendChild(where);
  if (!chapter.label || SECTION_TITLES[idx] !== chapterHeading(chapter)) {
    runningPosition.appendChild(document.createTextNode(' · '));
    const section = document.createElement('span');
    section.className = 'pos-section';
    section.textContent = `${SECTION_NUMERALS[idx]} ${SECTION_TITLES[idx]}`;
    runningPosition.appendChild(section);
  }
}

buildToc();

function selectSection(newIdx) {
  if (newIdx === sectionIndex) return;
  saveCurrentSection();
  sectionHistoryStart = contributionHistory.length;
  sectionIndex = newIdx;
  visitedSections.add(newIdx);
  markTocActive(newIdx);
  appendSectionBreak(sectionIndex);
}

document.querySelectorAll('.toc-item').forEach(item => {
  item.addEventListener('click', () => {
    if (sending) return;
    closeContents();
    selectSection(Number(item.dataset.section));
    focusInput();
  });
});

// ── Contents on a narrow screen: a sheet opened from the running head ──

const contentsToggle = document.getElementById('contents-toggle');
const sideScrim = document.getElementById('side-scrim');

function openContents() {
  document.body.classList.add('contents-open');
  contentsToggle.setAttribute('aria-expanded', 'true');
  sideScrim.hidden = false;
}

function closeContents() {
  if (!document.body.classList.contains('contents-open')) return;
  document.body.classList.remove('contents-open');
  contentsToggle.setAttribute('aria-expanded', 'false');
  sideScrim.hidden = true;
}

contentsToggle.addEventListener('click', () => {
  if (document.body.classList.contains('contents-open')) closeContents(); else openContents();
});
sideScrim.addEventListener('click', closeContents);
document.getElementById('side-close').addEventListener('click', closeContents);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeContents(); });

// On a narrow screen the dock is pinned over the page; the page keeps room for it.
function measureDock() {
  const dock = document.getElementById('dock');
  if (dock) document.documentElement.style.setProperty('--dock-height', `${dock.offsetHeight}px`);
}
window.addEventListener('resize', measureDock);
measureDock();

// ── Finish button ──

finishBtn.addEventListener('click', async () => {
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
        textId: 'intertext-paper',
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

  // H-014: a chapter's first section opens under the chapter's heading.
  const chapter = CHAPTERS.find(ch => ch.firstSection === idx);
  if (chapter) {
    const chapterHead = document.createElement('div');
    chapterHead.className = 'chapter-heading';
    chapterHead.textContent = chapterHeading(chapter);
    el.appendChild(chapterHead);
  }

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

// H-034: a reply may carry Markdown links and italics (titles are set *between asterisks*). Both are rendered;
// everything else stays plain text. An italic run needs a non-space after its opening asterisk and before its
// closing one, so a lone asterisk is left as it is.
const INLINE_MARKUP = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)|\*(?=\S)([^*\n]+?)(?<=\S)\*/g;

function renderText(container, text) {
  const re = new RegExp(INLINE_MARKUP.source, 'g');
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) container.appendChild(document.createTextNode(text.slice(last, m.index)));
    if (m[2]) {
      const a = document.createElement('a');
      a.href = m[2];
      a.textContent = m[1];
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      container.appendChild(a);
    } else {
      const em = document.createElement('em');
      em.textContent = m[3];
      container.appendChild(em);
    }
    last = re.lastIndex;
  }
  if (last < text.length) container.appendChild(document.createTextNode(text.slice(last)));
}

function appendGuideResponse(text, notes = null, media = null) {
  const turn = document.createElement('div');
  turn.className = 'turn';

  const label = document.createElement('div');
  label.className = 'turn-label';
  label.textContent = 'The text';

  const body = document.createElement('div');
  body.className = 'turn-body';

  // Split on [[IMAGE:id]] and [[MEDIA:id]] tokens; parts come in threes: text, kind, id
  const parts = text.split(/\[\[(IMAGE|MEDIA):([^\]]+)\]\]/);
  parts.forEach((part, i) => {
    if (i % 3 === 1) return;
    if (i % 3 === 2 && parts[i - 1] === 'MEDIA') {
      const item = media && media[part.trim()];
      if (item) {
        shownMedia.add(item.id);
        body.appendChild(MediaItems.render(item));
      }
      return;
    }
    if (i % 3 === 0) {
      part.split(/\n\n+/).forEach(para => {
        const trimmed = para.trim();
        if (trimmed) {
          const p = document.createElement('p');
          if (trimmed.startsWith('Sources: ')) p.className = 'turn-sources';
          CitationNotes.renderParagraph(p, trimmed, notes, renderText);
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
        if (imgData.credit) {
          // H-017: a picture whose licence asks for credit carries it underneath.
          const figure = document.createElement('figure');
          figure.className = imgData.figure ? 'response-figure' : 'response-image';
          const caption = document.createElement('figcaption');
          caption.className = 'image-credit';
          caption.textContent = imgData.credit + ' ';
          if (imgData.creditUrl) {
            const a = document.createElement('a');
            a.href = imgData.creditUrl;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.textContent = 'Licence';
            caption.appendChild(a);
          }
          figure.appendChild(img);
          figure.appendChild(caption);
          body.appendChild(figure);
        } else {
          img.className = imgData.figure ? 'response-figure' : 'response-image';
          body.appendChild(img);
        }
      }
    }
  });

  turn.appendChild(label);
  turn.appendChild(body);
  conv.appendChild(turn);
  revealResponse(turn);
}

// Jay, 2026-11-03: a reply that fits is scrolled fully into view; a longer one keeps its
// beginning in view, and the reader scrolls down to finish it.
function revealResponse(el) {
  const pane = document.getElementById('left-col');
  const scrolls = pane && getComputedStyle(pane).overflowY !== 'visible';
  // On a narrow screen the window scrolls and the dock covers the bottom of it.
  const dock = document.getElementById('dock');
  const covered = scrolls ? 0 : (dock ? dock.offsetHeight : 0);
  const viewHeight = (scrolls ? pane.clientHeight : window.innerHeight) - covered;
  const fits = el.getBoundingClientRect().height <= viewHeight * 0.9;
  el.scrollIntoView({ behavior: 'smooth', block: fits ? 'end' : 'start' });
}

// The reader's words take their place in the reading, above the reply they draw, so
// that the conversation reads back as one (2026-11-14; before, they stood apart in the
// right-hand pane).
function appendReaderMessage(text) {
  const turn = document.createElement('div');
  turn.className = 'turn turn-reader';
  const label = document.createElement('div');
  label.className = 'turn-label';
  label.textContent = 'You';
  const body = document.createElement('div');
  body.className = 'turn-body';
  body.textContent = text;
  turn.appendChild(label);
  turn.appendChild(body);
  conv.appendChild(turn);
  return turn;
}

function showThinking() {
  const el = document.createElement('div');
  el.className = 'thinking';
  el.id = 'thinking';
  el.setAttribute('aria-label', 'The text is composing a reply');
  const label = document.createElement('div');
  label.className = 'turn-label';
  label.textContent = 'The text';
  const dots = document.createElement('div');
  dots.className = 'thinking-dots';
  dots.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 3; i += 1) dots.appendChild(document.createElement('span'));
  el.appendChild(label);
  el.appendChild(dots);
  conv.appendChild(el);
  el.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function removeThinking() {
  const el = document.getElementById('thinking');
  if (el) el.remove();
}

function appendSystemMessage(text, { retry = null } = {}) {
  const el = document.createElement('div');
  el.className = 'system-message';
  el.textContent = text;
  if (retry) {
    el.appendChild(document.createTextNode(' '));
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Try again';
    btn.addEventListener('click', () => { el.remove(); retry(); });
    el.appendChild(btn);
  }
  conv.appendChild(el);
  el.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

// Keep the writing position visible even while the reader looks elsewhere.
function updateCaretMarker() {
  input.parentElement.classList.toggle('show-caret', input.value === '' && input.placeholder === '');
}

// The button beside the input says what Enter would do: go on, or send what is written.
function updateGoButton() {
  const hasText = input.value.trim().length > 0;
  goBtn.textContent = hasText ? 'Send' : 'Go on';
  goBtn.setAttribute('aria-label', hasText ? 'Send your message' : 'Go on reading');
  goBtn.classList.toggle('has-text', hasText);
}

function fitInput() {
  input.style.height = 'auto';
  input.style.height = input.scrollHeight + 'px';
  measureDock();
}

// ── Send ──

function setSending(value) {
  sending = value;
  document.querySelectorAll('.toc-item').forEach(el => { el.disabled = value; });
  finishBtn.disabled = value;
  goBtn.disabled = value;
  input.setAttribute('aria-busy', String(value));
}

// `given` repeats a turn that failed: its words are already in the reading.
async function send(given = null) {
  if (sending) return;
  const text = (given === null ? input.value : given).trim();
  const continuing = !text;
  input.value = '';
  input.placeholder = '';
  updateCaretMarker();
  updateGoButton();
  fitInput();
  closeContents();
  if (!continuing && given === null) appendReaderMessage(text);
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
          shownImages: Array.from(shownImages), shownMedia: Array.from(shownMedia), textId: 'intertext-paper', edition: readingEdition,
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
        if (!continuing) {
          contributionHistory.push(
            { role: 'user', content: text },
            { role: 'assistant', content: CitationNotes.plainReply(data.response, data.notes) }
          );
        }
        appendGuideResponse(data.response, data.notes, data.media);
      }
      if (continuing && data.sectionComplete === true) {
        completedSections.add(activeSection);
        markTocActive(sectionIndex);
      }
      if (data.response) break;
    }
  } catch (err) {
    // The reader's words stay in the reading; one press tries the same turn again.
    const attempt = continuing ? '' : text;
    appendSystemMessage(continuing ? 'The text could not go on just now.' : 'The text could not reply just now.', {
      retry: () => send(attempt),
    });
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

goBtn.addEventListener('click', () => send());

input.addEventListener('input', () => {
  // This hint is only for the first use, not each newly cleared draft.
  if (input.value.length > 0) input.placeholder = '';
  updateCaretMarker();
  updateGoButton();
  fitInput();
});

updateGoButton();
markTocActive(sectionIndex);
