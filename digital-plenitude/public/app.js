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

// H-014: one work in chapters; numerals start again in each chapter.
const SECTION_NUMERALS = [
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII',
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII',
];

// H-014: must match config.chapters (number, title, firstSection); a test checks this.
const CHAPTERS = [
  { number: 1, title: 'The Great Divide', firstSection: 0 },
  { number: 2, title: 'Popular Modernism', firstSection: 7 },
];

function chapterOf(idx) {
  let found = CHAPTERS[0];
  CHAPTERS.forEach(chapter => { if (chapter.firstSection <= idx) found = chapter; });
  return found;
}

const SECTION_TITLES = [
  'The Great Divide',
  'The Philadelphia (Orchestra) Story',
  'Class in America',
  'The Case of Music',
  'Shocking Art',
  'Art as a Special Interest',
  'Communities & Creativity',
  'Popular Modernism',
  'Popular Modernism: Formal, Progressive and Avant-Garde',
  'Popular Music and Formal Modernism',
  'John Lennon and Yoko Ono as Political Modernists',
  'McLuhan and Popular Modernism',
  'Steve Jobs',
  'The Future as Popular Modernist Kitsch',
  'Forgetting (Popular) Modernism',
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
  null, null, null, null, null, null, null, null, // H-014: chapter 2
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

  `<p>On the web, the Metropolitan Museum of Art and deviantART, a site where millions of amateurs post their own art, are equally accessible, and deviantART draws considerably more visitors. Fan fiction for shows like <em>Star Trek</em> was once distributed on mimeographed sheets. Such fiction is now posted to online communities whose members often number in the millions. Digital media did not cause the breakdown of cultural hierarchy. But they provide an ideal framework for our current networked culture, in which creativity is a synonym for art and each community judges it by its own standard.</p>`,

  // H-014: chapter 2 (drafts for Jay's approval).
  `<p>On January 9, 2007, Steve Jobs walked onto the stage at Macworld to introduce the iPhone. Apple, he said, had already changed everything twice, with the Macintosh in 1984 and the iPod in 2001, and now it was reinventing the telephone. Claims like this, that a new device or medium changes society or even human nature, have become the standard rhetoric of digital culture. Such claims derive ultimately from a popularization of the aesthetics and cultural politics of twentieth-century modernism. Where the modernists promoted revolutionary art, today&rsquo;s technologists and designers promote digital media as a revolution in the way we live.</p>`,

  `<p>Modernism was never one idea. Painters from the Cubists to the Abstract Expressionists pursued formal innovation, which the critic Clement Greenberg saw as modernism&rsquo;s great achievement. The Bauhaus, the German design school the Nazis closed in 1933, meant to design a better society through simplicity and purity. And the avant-gardes, from the Futurists to the Surrealists, wanted, as the cultural historian Peter Bürger put it, to dissolve art into everyday life. All three strands passed into popular culture after 1950: into jazz and rock, into the political performances of John Lennon and Yoko Ono, into the media theory of Marshall McLuhan, and into the products of Steve Jobs.</p>`,

  `<p>In the film <em>The Blackboard Jungle</em> (1955), rebellious students smash their teacher&rsquo;s collection of jazz records. Jazz had become &ldquo;modern&rdquo; after the war, music for listening rather than dancing, played by Charlie Parker, Miles Davis and John Coltrane and championed by critics as art. Rock and roll was music for teenagers. Yet within a dozen years it took the same path: in 1967 the Beatles released <em>Sgt. Pepper&rsquo;s Lonely Hearts Club Band</em>, which <em>Rolling Stone</em> once ranked as the greatest rock album of all time. Jazz and rock each ran through a compressed version of modernism&rsquo;s formal trajectory, from simple forms to works claimed as art, and each had reached its end by the 1970s.</p>`,

  `<p>In March 1969 John Lennon married Yoko Ono in Gibraltar, and the couple spent their honeymoon in bed at the Amsterdam Hilton, receiving reporters for a week with one message: the people themselves could end the war in Vietnam. Ono came from Fluxus, an avant-garde that staged events to bring art and life together, and through her Lennon turned his own celebrity into a performance. That December, in Toronto, the couple were interviewed by another popular modernist, Marshall McLuhan. The avant-gardes of the early twentieth century had shocked small audiences of art patrons. Lennon reached millions, and since then many popular musicians and performers have become similarly influential, culturally and politically.</p>`,

  `<p>In Woody Allen&rsquo;s <em>Annie Hall</em> (1977), Marshall McLuhan appears as himself to tell a Columbia University professor of communications that he does not understand McLuhan&rsquo;s work. By then McLuhan, an English professor who had turned to the study of media, had spent a decade as the celebrated prophet of the &ldquo;electric age.&rdquo; He made media, not art, the agent of revolutionary change, arguing that each new medium extends the human sensorium and that &ldquo;the medium is the message.&rdquo; He brought the modernist idea of medium specificity into popular culture. Many digital writers have followed him, regarding the computer as the final revolution, the medium that absorbs all the others.</p>`,

  `<p>On January 22, 1984, during the Super Bowl, Apple ran a commercial directed by Ridley Scott. An athletic woman, chased by armed police, runs through a hall of despondent workers watching a dictator on a giant screen and hurls a hammer into it. The Macintosh, the narrator promised, would prove that &ldquo;1984 will not be like <em>1984</em>.&rdquo; Steve Jobs, who led the making of the Macintosh, loved Dylan and the Beatles, but his own modernism was that of the Bauhaus: clean, simple, totally designed machines, closed to tinkering. He put modernist design into the hands of tens of millions of computer users.</p>`,

  `<p>Aboard the Starship <em>Enterprise</em>, in the <em>Star Trek</em> of the 1960s, the furniture parodies mid-century modern design, almost everything is plastic or alloy, war and poverty on Earth are things of the past, and everyone fits into a spandex jumpsuit. From Fritz Lang&rsquo;s <em>Metropolis</em> (1927) on, science fiction turned the modernist fascination with technology into a popular vision of the future. Artificial intelligence, from Alan Turing&rsquo;s paper of 1950 to Ray Kurzweil&rsquo;s &ldquo;singularity,&rdquo; promised the same future in the language of science. Silly and endearing, these visions are progressive modernism in a popular idiom, and they have barely changed since the science fiction pulps of the 1930s.</p>`,

  `<p>In Ridley Scott&rsquo;s <em>Alien</em> (1979), a Hollywood monster film plays out on a spaceship from the world of <em>Star Trek</em>; in his <em>Blade Runner</em> (1982), film noir moves into a dystopian modernist future. This is popular postmodernism, playing with the fragments of modernism and of earlier popular forms alike. It has not replaced popular modernism: Steve Jobs held to modernist design to the end, and millions love their iPhones, which they use to reach the careless interfaces of Facebook. With no mainstream left, there can be no avant-garde, and the counterculture became business culture. Popular modernism is what modernism became on its way to dissolution.</p>`,
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
    head.textContent = `Chapter ${chapter.number}: ${chapter.title}`;
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
    el.classList.toggle('active', Number(el.dataset.section) === idx);
  });
  const current = String(chapterOf(idx).number);
  document.querySelectorAll('.toc-chapter').forEach(group => {
    group.classList.toggle('open', group.dataset.chapter === current);
    group.classList.toggle('current', group.dataset.chapter === current);
  });
}

buildToc();

function selectSection(newIdx) {
  if (newIdx === sectionIndex) return;
  saveCurrentSection();
  sectionHistoryStart = contributionHistory.length;
  sectionIndex = newIdx;
  markTocActive(newIdx);
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

  // H-014: a chapter's first section opens under the chapter's heading.
  const chapter = CHAPTERS.find(ch => ch.firstSection === idx);
  if (chapter) {
    const chapterHead = document.createElement('div');
    chapterHead.className = 'chapter-heading';
    chapterHead.textContent = `Chapter ${chapter.number}: ${chapter.title}`;
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
  revealResponse(turn);
}

// Jay, 2026-11-03: a reply that fits is scrolled fully into view; a longer one keeps its
// beginning in view, and the reader scrolls down to finish it.
function revealResponse(el) {
  const pane = document.getElementById('left-col');
  const scrolls = pane && getComputedStyle(pane).overflowY !== 'visible';
  const viewHeight = scrolls ? pane.clientHeight : window.innerHeight;
  const fits = el.getBoundingClientRect().height <= viewHeight * 0.9;
  el.scrollIntoView({ behavior: 'smooth', block: fits ? 'end' : 'start' });
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
