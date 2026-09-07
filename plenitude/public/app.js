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
const contributionHistory = [];
const sectionHistories = new Map();
const completedSections = new Set();
let sending = false;
let endShown = false;
const CONTINUE_MESSAGE = 'Continue reading from where we have reached in this section.';

const SECTION_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

const SECTION_TITLES = [
  'The Great Divide',
  'The Philadelphia Story',
  'Class in America',
  'The Case of Music',
  'Shocking Art',
  'Art as a Special Interest',
  'Communities & Creativity',
];

// Image filenames: drop files in plenitude/images/ matching these names.
// Section 2: night-at-opera.jpg, whats-opera-doc.jpg
// Section 5: olmstead.jpg, kandinsky.jpg
const SECTION_IMAGES = [
  null,
  [
    { id: 'night-at-opera', src: '../images/night-at-opera.jpg', alt: 'A Night at the Opera, Marx Brothers (1935)' },
    { id: 'whats-opera-doc', src: '../images/whats-opera-doc.jpg', alt: "What's Opera, Doc? (1957)" },
  ],
  null,
  null,
  [
    { id: 'olmstead', src: '../images/olmstead.jpg', alt: 'Painting by Marla Olmstead, subject of My Kid Could Paint That (2007)' },
    { id: 'kandinsky', src: '../images/kandinsky.jpg', alt: 'Wassily Kandinsky, Composition IV (1911)' },
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
  `<p>In June 2013, Jay Z performed for six hours at the Pace Gallery in Manhattan &mdash; one of the city&rsquo;s most prestigious white-box art spaces. Art-world figures and fans rotated through to stand across from him while he rapped. Marina Abramović, who had spent 30 days sitting motionless at MOMA staring at strangers, appeared as one of his partners. Everyone was delighted.</p>`,

  `<p>In April 2011, the Philadelphia Symphony Orchestra filed for Chapter 11 bankruptcy &mdash; the first of America&rsquo;s &ldquo;Big Five&rdquo; orchestras ever to do so. It had been playing for over a century. In 1939, its director Leopold Stokowski appeared as a silhouetted figure in Disney&rsquo;s <em>Fantasia</em>, where Mickey Mouse greeted him with nervous reverence. By 2011, the orchestra&rsquo;s problem was not reverence but revenue.</p>`,

  `<p>In the 1940s, major American newspapers ran society columns. Today, where they still exist, they read like dispatches from a costume party. Paris Hilton is a &ldquo;socialite&rdquo; &mdash; a word that now designates someone famous for being famous. In the 1920s, Fitzgerald said the rich were different from us. Hemingway reportedly replied: yes, they have more money. American culture eventually chose Hemingway&rsquo;s answer.</p>`,

  `<p>In 1956, Chuck Berry recorded &ldquo;Roll Over Beethoven.&rdquo; He wasn&rsquo;t hostile to Beethoven &mdash; he barely knew Beethoven. He used the name as shorthand for music that was over, music that no longer had anything to do with his audience&rsquo;s lives. The Beatles covered it in 1963. By 2013, when Jay Z rapped about Picasso in a gallery, the art world was happy to attend.</p>`,

  `<p>In April 1919, a performer named Walter Serner walked to a lectern at a Dada event in Zurich and began reading his manifesto to an audience already primed for outrage. Before he finished, young men rushed the stage, broke off pieces of the balustrade, and chased him out of the building. Hans Richter, who was there, called it the climax of Dada activity. The audience&rsquo;s fury was the point: art still mattered enough to fight over.</p>`,

  `<p>In 2012, Thomas Kinkade died. His company&rsquo;s website called him America&rsquo;s &ldquo;Most Collected Artist.&rdquo; He painted glowing cottages and saccharine pastoral scenes &mdash; the kind of work that the traditional art world treats as the definition of kitsch. His obituary in the <em>New York Times</em> was careful: it let his fans speak for his work. Within the art world, the question was not whether Kinkade was good, but whether the category that excluded him still meant anything.</p>`,

  `<p>The Metropolitan Museum of Art has a website. So does deviantART. On web traffic rankings, deviantART scores considerably higher. Both pages load in the same browser, with equal claims on the same search results. None of this caused the collapse of cultural hierarchy &mdash; that was well underway before the Internet arrived. But digital media built an ideal home for what the collapse left behind.</p>`,
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
      body: JSON.stringify({ sectionIndex, conversationHistory: slice, textId: 'plenitude' })
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
          shownImages: Array.from(shownImages), textId: 'plenitude',
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
