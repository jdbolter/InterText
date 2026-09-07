const conv = document.getElementById('conversation');
const input = document.getElementById('message-input');
const intro = document.getElementById('intro');
const leftCol = document.getElementById('left-col');
const readerHistory = document.getElementById('reader-history');

let history = [];
let firstSend = true;
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
const completedSections = new Set();
let sending = false;
let endShown = false;
const CONTINUE_MESSAGE = 'Continue reading from where we have reached in this section.';

const SECTION_NUMERALS = ['I', 'II', 'III', 'IV', 'V'];

const SECTION_TITLES = [
  'The Uncanny Valley & the Double',
  'Film and the Uncanny',
  'The Double in Film',
  'Uncanny Avatars in Mirror Worlds',
  'Feature, not a Bug',
];

const SECTION_IMAGES = [
  [
    { id: 'valley-graph', src: '../images/uncanny-valley-graph.png', alt: 'Masahiro Mori\'s uncanny valley graph (1970)' },
  ],
  [
    { id: 'train', src: '../images/train.jpeg', alt: 'The Arrival of the Train at La Ciotat Station (1896)' },
  ],
  [
    {id: 'freud',src: '../images/freud.jpg', alt: 'Das Unheimliche (The Uncanny) (1919)'},
    {id: 'pod',src: '../images/gemini-pod.png', alt: 'Gemini\'s representation of the pod described in Invasion of the Body Snatchers (1956)'},
  ],
  null,
  null,
];

// Flat lookup map for inline image tokens
const IMAGE_MAP = {};
SECTION_IMAGES.forEach(section => {
  if (section) section.forEach(img => { IMAGE_MAP[img.id] = img; });
});

const SECTION_INTROS = [
  `<p>In 1970, Japanese roboticist Masahiro Mori drew a graph. On one axis: how human-like a robot looks. On the other: how much affinity people feel toward it. The line rises steadily — then suddenly plummets. There is a valley right at the point of near-human resemblance. He called it the uncanny valley. It was an observation about robots, but it also applied to computer graphics and other media forms.</p>`,

  `<p>It&rsquo;s January 1896, and you&rsquo;re sitting in the audience in a hall in the Grand Caf&eacute; in Paris, about to watch one of the first public demonstrations of the Lumi&egrave;re brothers&rsquo; all-in-one camera and projector: the cin&eacute;matographe. One of the films shown is &ldquo;The Arrival of the Train at la Ciotat Station.&rdquo; Legend has it that the audience fears that the train will break through the screen and crush them. They rush for the doors.</p>`,

  `<p>In The Invasion of the Body Snatchers (1956), a small-town doctor named Miles is called to examine a strange body found in his friend&rsquo;s basement. It looks human &mdash; it has all the features. But something is wrong. &ldquo;It&rsquo;s like the first impression that&rsquo;s stamped on a coin,&rdquo; his friend says. &ldquo;It isn&rsquo;t finished.&rdquo; No details. No character. No lines. The pod double is in the uncanny valley. The film understands this instinctively, decades before anyone had a name for it.</p>`,

  `<p>In September 2023, Mark Zuckerberg sat across from podcaster Lex Fridman for an interview. They were not in the same room. They appeared as photorealistic avatars &mdash; truncated floating figures, torsos only, suspended in a black space. Fridman kept repeating: &ldquo;This is incredible. The realism here is just incredible.&rdquo; Near the end, Zuckerberg said something almost offhand: &ldquo;We want to get more people scanned and into the system.&rdquo;</p>`,

  `<p>Film is more than a century old. It has survived and flourished in a media economy that includes photography, radio, television, video games, streaming. Each has flourished not by winning the argument about realism, but by refusing to settle it.</p>`,
];

// ── Consent dialog ──

function chooseEntry(consent, edition) {
  saveConsent = consent;
  readingEdition = edition;
  document.getElementById('consent-overlay').style.display = 'none';
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
  firstSend = true;
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
  const slice = contributionHistory.slice(sectionHistoryStart);
  if (slice.length === 0) return;
  try {
    await fetch('/api/evolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectionIndex, conversationHistory: slice, textId: 'uncanny' })
    });
  } catch {
    // silent failure — saving is best-effort
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

  if (scroll) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  firstSend = false;
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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text, history, sectionIndex: activeSection,
          shownImages: Array.from(shownImages), textId: 'uncanny', edition: readingEdition,
          ...(continuing ? { action: 'continue', sectionHistory: sectionHistories.get(activeSection) || [] } : {})
        })
      });
      const data = await res.json();
      if (!res.ok || (!data.response && !(continuing && data.sectionComplete === true))) {
        throw new Error('No reading response');
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
    input.focus();
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
