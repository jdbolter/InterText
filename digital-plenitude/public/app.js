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
  'The Great Divide',
  'The Philadelphia (Orchestra) Story',
  'Class in America',
  'The Case of Music',
  'Shocking Art',
  'Art as a Special Interest',
  'Communities & Creativity',
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

// Image filenames: drop files in digital-plenitude/images/ matching these names.
// Section 2: night-at-opera.png, whats-opera-doc.png
// Section 5: olmstead.png, kandinsky.jpg
const SECTION_IMAGES = [
  null,
  [
    { id: 'night-at-opera', src: '../images/night-at-opera.png', alt: 'A Night at the Opera, Marx Brothers (1935)' },
    { id: 'whats-opera-doc', src: '../images/whats-opera-doc.png', alt: "What's Opera, Doc? (1957)" },
  ],
  null,
  null,
  [
    { id: 'olmstead', src: '../images/olmstead.png', alt: 'Painting by Marla Olmstead, subject of My Kid Could Paint That (2007)' },
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
  `<p>In 2013 JAY-Z released &ldquo;Picasso Baby,&rdquo; a song and a video: the rapper wants to own a Picasso and ends by claiming to be a new Picasso. He is performing in New York&rsquo;s Pace Gallery, one of the city&rsquo;s prestigious art spaces. Art-world figures and fans take turns standing across from him while he raps. Marina Abramović, whose MoMA performance of 2010 he was borrowing (she sat motionless for more than two months, staring at one stranger after another), appears as one of his partners. Everyone in the film is delighted that the art world has accepted the rapper as an artist. The great divide between elite art and popular culture is in the process of dissolving.</p>`,

  `<p>In 1940 Leopold Stokowski, the flamboyant conductor who had led the Philadelphia Orchestra for more than two decades, appeared in Disney&rsquo;s <em>Fantasia</em> as a silhouette, and Mickey Mouse treated him with nervous reverence. Even that was too much for one newspaper columnist, who called the film a symptom of &ldquo;the collapse of the civilized world.&rdquo; Seventeen years later, in the cartoon <em>What&rsquo;s Opera, Doc?</em>, Bugs Bunny played Brünnhilde to Elmer Fudd&rsquo;s Siegfried, with no reverence at all. In April 2011 the Philadelphia Orchestra filed for bankruptcy, the first of America&rsquo;s &ldquo;Big Five&rdquo; orchestras to do so. Opera and the symphony have lost their claim to cultural preeminence: there is in fact no longer <em>any</em> music that every educated person is expected to know.</p>`,

  `<p>In 1926 F. Scott Fitzgerald wrote that the very rich are different from you and me. Twelve years later Ernest Hemingway borrowed the line and added: yes, they have more money. American culture has come round to Hemingway. The society column, still a fixture of the newspaper in 1940, when <em>The Philadelphia Story</em> put Main Line high society on the screen, is now an amusing relic. A &ldquo;socialite&rdquo; like Paris Hilton became famous for being famous, and royalty borrow their celebrity from rock and movie stars, not the reverse. Once no class could claim to be essentially different, no art could claim to be essentially higher. The old hierarchy of taste survives only in fragments, and not everyone shares them.</p>`,

  `<p>When the rock and roll pioneer Chuck Berry sang &ldquo;Roll Over Beethoven,&rdquo; he meant no hostility. He and his young audience did not know or care about the classical tradition, and Beethoven was simply the name for the music his own was replacing. By the end of the century, American culture had largely accepted that rock, country, hip-hop and symphonic music all have equal creative potential. Wikipedia lists well over a hundred genres of rock alone. In 2018 the opera star Anna Netrebko had some 50,000 followers on Twitter, and Justin Timberlake over 65 million. Music no longer has one great divide but many small ones, between communities that mostly ignore each other.</p>`,

  `<p>In April 1919, at a Dada evening in a large hall in Zurich, Walter Serner began to read his manifesto. Young men leaped from the gallery onto the stage, brandishing pieces of the balustrade, and chased him out of the building. Hans Richter, who chronicled Dada, called it the climax of Dada in Zurich. In 1960 John Cage performed <em>Water Walk</em>, a piece for a water pitcher, a rubber duck and other objects, on the television game show <em>I&rsquo;ve Got a Secret</em>. The studio audience listened and occasionally laughed. Nobody stormed the stage. Art had stopped being dangerous to its public, because there was no longer an elite whose verdict on art mattered to everyone.</p>`,

  `<p>In 2012 the painter Thomas Kinkade died. His website called him America&rsquo;s &ldquo;Most Collected Artist,&rdquo; and his company sold prints and assembly-line oil paintings of light-dappled cottages and gardens to thousands of customers a year. To the art world they were the definition of kitsch, and his obituary in the <em>New York Times</em> was careful to let his fans do the praising. The question was not whether Kinkade was good, but whether the standards that excluded him still obtained. Art, once a category with a mission for the whole culture, has become a special interest, or rather many: the art world, Kinkade&rsquo;s collectors and countless others, each with its own community.</p>`,

  `<p>The Metropolitan Museum of Art has a website. So does deviantART. On web traffic rankings, deviantART scores considerably higher. Both pages load in the same browser, with equal claims on the same search results. None of this caused the collapse of cultural hierarchy &mdash; that was well underway before the Internet arrived. But digital media built an ideal home for what the collapse left behind.</p>`,
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
        textId: 'digital-plenitude',
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

function appendGuideResponse(text, notes = null) {
  const turn = document.createElement('div');
  turn.className = 'turn';

  const label = document.createElement('div');
  label.className = 'turn-label';
  label.textContent = 'The text';

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
          shownImages: Array.from(shownImages), textId: 'digital-plenitude', edition: readingEdition,
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
        appendGuideResponse(data.response, data.notes);
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
