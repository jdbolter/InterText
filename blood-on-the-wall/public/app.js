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
let sectionHistoryStart = 0;

const SECTION_NUMERALS = ['I', 'II', 'III', 'IV'];

const SECTION_TITLES = [
  'The Shot Heard in Berlin',
  'Graduated Pressure',
  'A Fog of Distrust',
  'The Files Break Open',
];

const SECTION_IMAGES = [null, null, null, null];

// Flat lookup map for inline image tokens (none for this text)
const IMAGE_MAP = {};
SECTION_IMAGES.forEach(section => {
  if (section) section.forEach(img => { IMAGE_MAP[img.id] = img; });
});

const SECTION_INTROS = [
  `<p>West Berlin, June 26, 1963. Two years earlier, the Wall had gone up overnight; now an American president stood before the Rathaus Schöneberg to tell 120,000 West Berliners that their city’s freedom was not negotiable. He was three sentences from finishing. What happened next did not stay a Berlin story, or even an American one — it became the fact every later decision of the Cold War had to route around.</p>`,

  `<p>Washington had two instincts fighting each other: retaliate, or manage. The National Security Council apparatus, barely broken in during the Cuban Missile Crisis eight months earlier, was handed something worse than a Soviet warhead in Havana — a dead president and a paper trail leading straight to East Berlin. What Moscow chose to protect, and what it chose to sacrifice, would set the terms for how the entire Eastern bloc disciplined itself for the next two decades.</p>`,

  `<p>By the 1970s, both superpowers wanted a thaw badly enough to sign things they didn’t fully believe. But some agreements carry a name folded into their fine print. At Helsinki in 1975, one clause existed because of one man, killed twelve years earlier on a Berlin stage — and by the time Reagan needed a villain in 1983, that clause had already done its work.</p>`,

  `<p>November 1989. The Wall did not just fall in Berlin — a filing cabinet did, at Stasi headquarters on Normannenstraße, where crowds who had waited twenty-six years to ask one specific question finally forced their way to an answer. What they found did not close the case. It just made not-closing it a matter of public record.</p>`,
];

// ── Consent dialog ──

document.getElementById('consent-yes').addEventListener('click', () => {
  saveConsent = true;
  document.getElementById('consent-overlay').style.display = 'none';
});

document.getElementById('consent-no').addEventListener('click', () => {
  saveConsent = false;
  document.getElementById('consent-overlay').style.display = 'none';
});

// ── Initialise first section ──

intro.innerHTML = SECTION_INTROS[sectionIndex];
intro.classList.add('is-hiding');
appendSectionBreak(0, false);

// ── TOC navigation ──

document.querySelectorAll('.toc-item').forEach(item => {
  item.addEventListener('click', () => {
    const newIdx = parseInt(item.dataset.section, 10);
    if (newIdx === sectionIndex) return;

    saveCurrentSection(); // fire and forget — does not block navigation
    sectionHistoryStart = history.length;

    sectionIndex = newIdx;
    document.querySelectorAll('.toc-item').forEach(el => el.classList.remove('active'));
    item.classList.add('active');
    intro.innerHTML = SECTION_INTROS[sectionIndex];
    firstSend = true;

    if (conv.children.length > 0) {
      appendSectionBreak(sectionIndex);
    } else {
      intro.classList.remove('is-hiding');
    }
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
  const slice = history.slice(sectionHistoryStart);
  if (slice.length === 0) return;
  try {
    await fetch('/api/evolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectionIndex, conversationHistory: slice, textId: 'blood-on-the-wall' })
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
  label.textContent = 'Historian';

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

// ── Send ──

async function send() {
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  input.style.height = 'auto';

  firstSend = false;
  appendReaderMessage(text);
  showThinking();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history, sectionIndex, shownImages: Array.from(shownImages), textId: 'blood-on-the-wall' })
    });

    const data = await res.json();
    removeThinking();

    if (data.response) {
      history.push({ role: 'user', content: text });
      history.push({ role: 'assistant', content: data.response });
      appendGuideResponse(data.response);
    } else {
      appendGuideResponse('[No response]');
    }
  } catch (err) {
    removeThinking();
    appendGuideResponse('[Error reaching server]');
  }

  input.focus();
}

input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    send();
  }
});

input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = input.scrollHeight + 'px';
});
