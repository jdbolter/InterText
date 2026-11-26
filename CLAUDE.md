# InterText: notes for Claude sessions

InterText is Jay Bolter's interactive-reading app: a reader converses with a text that speaks as the work itself.
This file orients a new session in this repo. The design is in `CURRENT-DESIGN.md` and `EDITORIAL-ARCHITECTURE.md`.
There are two texts: *The Digital Plenitude* (`digital-plenitude/`) and the DH2027 paper on InterText
(`intertext-paper/`). Each is planned and recorded in Jay's vault, **Intertext-Author** (a sibling folder:
`../Intertext-Author`), in its own project: `projects/digital-plenitude/` and `projects/intertext-paper/`, above all
`STATE.md`, `standing.md` and `handoff/`. Hand-offs are numbered per project. Read those first.

## Working rules
- **Changes come through hand-offs.** Changes to this repo are proposed in a vault hand-off (`handoff/H-0NN-*.md`)
  and approved by Jay. Commits cite the hand-off ("H-025: …").
- **Commits and pushes.** Commit as Jay (`Jay Bolter <jdbolter@gatech.edu>`) with the session's attribution lines.
  **Jay pushes**, never the session.
- **Keys** live in `.env.local` (Anthropic, OpenAI, the Vercel KV database). Never print or view their values.
- **Run `npm test` before every commit.** It is quick, and every new mechanism has tests.
- **Agents draft, Jay approves.** The text's prose, its instructions, introductions, library lists, main lines and the
  list of how writers are introduced are Jay's. Agents draft them for his approval.

## Branches and deployment
- Work happens on `dev`, or on a branch from it for a larger change (`dev-UI` for the interface, H-030); such a
  branch is merged back into `dev`. `main` is what Vercel deploys (project `inter-text`). `h002-digital-plenitude`
  is the older working branch and still holds the older texts (also tagged `archive/older-texts`).
- **Vercel's Hobby plan allows 12 serverless functions, and every `.js` file under `api/` counts as one** unless its
  name or its folder's starts with an underscore. Only `api/chat.js` and `api/evolve.js` are functions; the helper
  modules live in `api/_lib/` for that reason. Never add a `.js` file to `api/` outside `_lib/`. A deploy that
  fails with "No more than 12 Serverless Functions" means a file broke this rule.
- **To deploy,** Jay runs `git checkout main && git merge --ff-only dev && git push origin main`.
- **The live site and local `npm run dev` share one KV database** when `.env.local` has the KV settings.

## The landing page (`index.html`, H-032)
In the annotated-book look. *The Digital Plenitude* is the main entry, opened on the first page of section 1 (its
opening box in miniature) with "Begin reading"; beneath it, under "How does a text like this work?", the paper, with
the system diagram, "The paper, in the same form" and "Ask the paper". Header: "InterText" and Jay's line "Texts that
respond to their readers and evolve as they are read." A test checks both entries, in order.

## The reader's page (`digital-plenitude/public/`, copied to `intertext-paper/public/`)
- **Two copies.** `intertext-paper/public/` is a copy of `digital-plenitude/public/` (H-001 of intertext-paper) with
  its own data in `app.js` (`CHAPTERS`, `SECTION_NUMERALS`, `SECTION_TITLES`, `SECTION_IMAGES`, `SECTION_INTROS`,
  `textId`) and its own title in `index.html`. A change to the look or behaviour of the page is made in both.
- **The look is the annotated book (H-030):** the reading is a printed page in EB Garamond (served from
  `public/fonts/`, OFL), with red small capitals for labels and numerals and a drop cap opening each section; the
  contents and the input sit on a dark cloth column. The look is all in `style.css`; markup and `app.js` are unchanged
  by it. Alternatives considered (paper and ink, gallery, chapter colours) are kept in the vault,
  `projects/digital-plenitude/design/interface-alternatives/`.
- The reading runs down the left: a running head (title; chapter and section) stays at the top, and the reader's
  own words ("You", blue-black italic) stand in the margin beside the reply they drew, tied to it by a leader line,
  on screens 1280px and wider; narrower, they stand in the reading above the reply, set in with a rule. Each element
  of the reading clears the margin at its end, so notes cannot drift past their replies. The right column holds
  the contents list (all chapters; the open chapter shows its sections; visited and finished sections marked),
  References beneath it, and the input dock at the foot: `Go on` becomes `Send` when there is text; Enter does the
  same; `Finish reading` beside it.
- Narrow screens (under 960px): one column, the contents as a sheet opened from the running head (`Contents`), the
  dock pinned to the bottom. The page sets `--dock-height` so the reading keeps room for it.
- A failed turn shows "Try again" and keeps the reader's words in place. The composing indicator is the text's
  label and three dots where the reply will appear.
- `synthetic-reader/lib/publicContent.js` runs `app.js` under a DOM stand-in to read the titles and boxes; load-time
  code added to the page must run under it (a test loads the real page).

## The prompt and the calls
- **Order and caching:** `api/_lib/system-prompt.js` puts what stays the same through a section first (the text's
  instructions, the passage, the library list), marks the last of those for caching, and puts what changes from
  turn to turn after it (continuation instructions, images and media not yet shown, the writers introduced so far,
  the fund). Anything added to the prompt goes in the right half: a per-turn line placed before the passage would
  break the cache on every call. The revision pass gets the passage as a cached system block too.
- **Style sample:** a text may give `styleSample` (passages of its author's prose, chosen by the author); the revision
  pass then gets them, with one generic sentence, as a model of style (`styleSampleBlock` in `api/_lib/reply-revision.js`).
  Author-neutral: the system names no author. `intertext-paper` gives five passages of the paper; `digital-plenitude`
  none (intertext-paper H-002).
- **Introductions:** each library entry carries its manner once; one per-turn line names the writers
  already introduced (`introducedLine`).
- **Length:** a draft over `config.revision.wordLimit` (250) is handed to the editor with its count and the excess.
- **Notes** follow the punctuation they sit beside (`checkCitations`). `api/_lib/words.js` counts the words a reader
  sees.
- `api/chat.js` makes its Anthropic client on first use; a test puts a stand-in in its place with `setClient`.

## Models
- **Replies, the revision pass and evolution** run on `claude-sonnet-5-5`, the default for every text (`textModel`).
- **Sonnet 5.5 does not support forced tool calls** (`tool_choice` "tool"/"any"). The experiment editions' editorial path
  forces a tool, so it stays on `claude-sonnet-5` (`editorialModel`).
- **Thinking off is set per model:** `{type:'between_tools'}` on 5.5, `{type:'disabled'}` on 5 (`thinkingOff`).
- **`npm run check-models`** tries each kind of call against the real API.

## *The Digital Plenitude* (`digital-plenitude/`)
The whole book: the proofs' nine chapters, 49 sections. The reader's page names it *The Digital Plenitude*, with no
edition label (H-031). Its `config.js` carries everything specific to it:

- **The voice and model**
  - `behavioralInstructions`: the text speaks as the work about the world, in the third person. It answers the
    question first; the section's point steers it and is not announced in every reply; it states each claim at the
    strength its evidence gives, with its reach, and closes on something of its own, not an antithesis or a stock
    open question; it takes a challenge as real and grants what is right in a plain clause; it introduces anything the
    reader has not been shown; it acknowledges a real factual error plainly.
  - `model`: Sonnet 5.5. `voiceName`: "Text".
- **Return turns and the label**
  - `continuationVoice` and `continuationWording`: the wording of Return turns, with no "section".
  - `sectionLabel`: "Now under discussion".
- **The revision pass**
  - `revision` (model, instructions, thinking): a second call rewrites each draft into the voice.
  - It sees the main line, what the reader has been shown, and the section.
- **The library list** (the works the text may cite)
  - `libraryLists`, `libraryListsDir`, `libraryPreamble` and `libraryInstruction`: the list for each section, in
    `source_texts/library-lists/section-N.md`. Entries begin with `[id]`.
  - `citationMarkers` and `referencesFile` (`source_texts/references.json`): Chicago author-date references.
    - **Pages.** A marker may carry only pages within its entry's ranges.
    - **How a writer is mentioned:** introduced then named, by note only, or the work's own (Bolter's own work is
      never named).
  - The model writes `[[CITE:id|pages]]`. The server checks it. Web citations become `[[WEB:k]]`. The page
    (`shared/citation-notes.js`) numbers the notes and shows the references.
- **Media lists.** Videos, images and web pages a reply may show, one checked list per section in
  `source_texts/media-lists/section-N.json` (`mediaListsDir`). Each item says when to use it.
  - The model writes `[[MEDIA:id]]` on a line of its own; `api/_lib/media.js` keeps only listed items, one per reply,
    and returns them as `media`. The revision pass must keep the marker.
  - The page (`shared/media-items.js`) plays a video whose embedding was checked (youtube-nocookie or Vimeo), shows an
    image whose licence was cleared with its credit, and shows everything else, or an image that fails to load, as a
    card that opens a new tab.
  - **Keeping the lists:** `npm run media -- add | bulk | check | search | list` (`scripts/media.js`). It needs open
    network (YouTube and Vimeo oEmbed, Commons, the Met, the Art Institute), so it runs in Jay's own terminal. An item
    is never listed by hand from memory: the script's check is its basis.
- **Chapters.** One work in chapters: `chapters` lists `{ number, title, firstSection, point }`, and a
  section belongs to the last chapter starting at or before it. Chapter 1 is sections 1 to 7; chapter 2, *Popular
  Modernism*, sections 8 to 15; chapter 3, *Dichotomies*, 16 to 18; chapter 4, *Catharsis*, 19 to 23;
  chapter 5, *Flow*, 24 to 29; chapter 6, *Remix and Originality*, 30 to 34; chapter 7, *Procedurality, History, and
  Simulation*, 35 to 40; chapter 8, *Social Media and the Politics of Flow*, 41 to 48; chapter 9, the Conclusion
  (carries a `label`, not "Chapter 9"), section 49. The page's `CHAPTERS` in `public/app.js` must match (a test checks it); the contents
  list is built from it, grouped by chapter, and numerals start again in each chapter.
- **The argument in brief:** `sectionPoints` and each chapter's `point`. Before every reply, the model gets the point
  for the section and for its chapter. It steers the reply and is stated only when the reader's message bears on it,
  as a claim, never as "the main line".
- **Evolution**
  - `synthesisInstructions`: used only for dry-run previews of the old whole-section rewrite.
  - `editorialDelivery: 'markers'`: the text's editorial path runs without forced tools.
- **The opening boxes:** `sectionIntros` must match `SECTION_INTROS` in `public/app.js`; a test checks this. The boxes,
  chapter points and section points of all nine chapters are Jay's. A synthetic reader reads them from these two files, so a reading round's text is the text
  of the commit it names.

## The DH2027 paper (`intertext-paper/`)
"InterText: An AI-supported system for interactive reading", the paper submitted to DH2027, as an InterText (vault:
`projects/intertext-paper/`, H-001). Six sections: the paper's five, with III divided into "How a Reading Works" and
"A Text That Evolves"; one chapter, labelled "The paper", whose point is the paper's argument.
- **The spine is the paper,** one passage per paragraph, unchanged apart from its figure references; a test checks
  that spine and section files agree. When the paper changes, both change together.
- **The fund is the documentation:** 34 entries drawn from `CURRENT-DESIGN`, `EDITORIAL-ARCHITECTURE`, `PROMPTS` and
  `synthetic-reader/README`, accepted by Jay (2026-11-25), each sourced to the public repo's copy where there is one.
  Their prose was redrafted in the paper's register (H-002, 2026-11-26), so that the text has its author's manner to
  retell, not the documentation's.
  When the system changes, the entries that describe it change too.
- **The voice** speaks as the paper about InterText in the third person; it may say once, when asked, that the reader
  is reading through InterText; it never describes its own reply. Nothing from *The Digital Plenitude* enters beyond
  what the paper itself says.
- **Library and figures.** The paper's references, without pages (`references.json`, per-section lists); Jay's three
  figures as local images in `intertext-paper/images/` (`sectionImagePrompts`). Fig. 1 is a screenshot of this
  text's own reader's page (2026-11-26), the same in the public repo.
- **The title** mirrors the paper's and follows it if the paper's changes.
- **Also in the public repo** (Intertext-Public, H-035). A change here is copied there.

## The evolving edition (spine and fund)
- **The package.** `editorial/content/digital-plenitude/` holds a spine passage for each paragraph and empty funds.
  `npm run editorial-build` writes `api/editorial-seed/`.
- **Reading.** The reader edition (Contribute / Read the current text) reads the current KV version, or the seed if
  none exists. It delivers by markers: `[[FUND:id]]` after a sentence an entry informs, and a private
  `[[MEMORY: …]]` line. The server reads and removes both. The reading then goes through the whole pipeline above.
- **Evolution.** When a contributing reader finishes, `api/evolve.js` runs the two editorial passes (proposal, then
  review) in `api/_lib/editorial-evolution.js`, by checked JSON (`structured: 'json'`), and publishes an immutable
  child version.
  - Corrections and proportionate changes go into the spine.
  - Optional material goes into the fund, anchored to a passage.
- **Tools**
  - `npm run editorial-propose -- --session <synthetic run>`: previews the editor without publishing.
  - `npm run editorial-kv -- status|export --text digital-plenitude --section N`: shows or exports a section's
    current version.
  - `npm run evolved -- show|reset --text <id> [--yes]`: the old whole-section store, no longer used by
    digital-plenitude.

## Synthetic readers
- **Running a reader.** `npm run synthetic-reader -- --text digital-plenitude --edition original --section N
  --profile <p> --turns N --out <dir> [--base-url …]` needs the local server running and the OpenAI key.
- **Profiles:** `curious`, `skeptical`, `collaborative`, `general` (the target reader, who reads for the argument,
  in plain spoken sentences) and `student` (an undergraduate reading an assigned chapter, no web search).
- **Measuring a round:** `npm run reading-report -- <dir>` reads a round's `session.json` files and prints
  words per reply and how many run over the limit, notes per reply, self-reference, repeats, the reader's private
  reflections, revisions applied, and the cache share. `--json` for data.
- **Output.** Transcripts show notes, and the draft before revision.
- **Voice counts.** `projects/digital-plenitude/readings/measure-voice.py` in the vault counts absolutes, hedges and closing
  formulas in a round's replies or in the book's own sections. The counts are crude and say how the prose sounds, not whether a claim is right.
- **Reading rounds** are run from scripts in the vault (`projects/digital-plenitude/readings/run-*.sh`) and measured
  there by a blind judge.
