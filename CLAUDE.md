# InterText: notes for Claude sessions

InterText is Jay Bolter's interactive-reading app: a reader converses with a text that speaks as the work itself.
This file orients a new session in this repo. The design is in `CURRENT-DESIGN.md` and `EDITORIAL-ARCHITECTURE.md`.
The work on *The Digital Plenitude* is planned and recorded in Jay's vault, **Intertext-Author** (a sibling folder:
`../Intertext-Author`), above all `projects/digital-plenitude/STATE.md`, `standing.md` and `handoff/`. Read those
first.

## Working rules
- **Changes come through hand-offs.** Changes to this repo are proposed in a vault hand-off (`handoff/H-0NN-*.md`)
  and approved by Jay. Commits cite the hand-off ("H-011: …").
- **Commits and pushes.** Commit as Jay (`Jay Bolter <jdbolter@gatech.edu>`) with the session's attribution lines.
  **Jay pushes**, never the session.
- **Keys** live in `.env.local` (Anthropic, OpenAI, the Vercel KV database). Never print or view their values.
- **Run `npm test` before every commit.** It is quick, and every new mechanism has tests.
- **Old texts keep running.** `plenitude`, `uncanny`, `remediation` and `blood-on-the-wall` still run at their own
  addresses, but only `digital-plenitude` is offered on the landing page (Jay, 2026-11-02) until the others move to
  the new system.
- **Agents draft, Jay approves.** The text's prose, its instructions, introductions, library lists, main lines and the
  list of how writers are introduced are Jay's. Agents draft them for his approval.

## Branches and deployment
- Work happens on `h001-digital-plenitude`. `main` is what Vercel deploys (project `inter-text`).
- **To deploy,** Jay runs `git checkout main && git merge --ff-only h001-digital-plenitude && git push origin main`.
- **The live site and local `npm run dev` share one KV database** when `.env.local` has the KV settings.

## The reader's page (`digital-plenitude/public/`, H-019)
- The reading runs down the left: a running head (title; chapter and section) stays at the top, and the reader's
  own words stand in the reading above the reply they drew ("You"), set in from the margin. The right column holds
  the contents list (all chapters; the open chapter shows its sections; visited and finished sections marked),
  References beneath it, and the input dock at the foot: `Go on` becomes `Send` when there is text; Enter does the
  same; `Finish reading` beside it.
- Narrow screens (under 960px): one column, the contents as a sheet opened from the running head (`Contents`), the
  dock pinned to the bottom. The page sets `--dock-height` so the reading keeps room for it.
- A failed turn shows "Try again" and keeps the reader's words in place. The composing indicator is the text's
  label and three dots where the reply will appear.
- `synthetic-reader/lib/publicContent.js` runs `app.js` under a DOM stand-in to read the titles and boxes; load-time
  code added to the page must run under it (a test loads the real page).

## The prompt and the calls (H-020)
- **Order and caching:** `api/lib/system-prompt.js` puts what stays the same through a section first (the text's
  instructions, the passage, the library list), marks the last of those for caching, and puts what changes from
  turn to turn after it (continuation instructions, images and media not yet shown, the writers introduced so far,
  the fund). Anything added to the prompt goes in the right half: a per-turn line placed before the passage would
  break the cache on every call. The revision pass gets the passage as a cached system block too.
- **Introductions (H-008):** each library entry carries its manner once; one per-turn line names the writers
  already introduced (`introducedLine`).
- **Length:** a draft over `config.revision.wordLimit` (250) is handed to the editor with its count and the excess.
- **Notes** follow the punctuation they sit beside (`checkCitations`). `api/lib/words.js` counts the words a reader
  sees.
- `api/chat.js` makes its Anthropic client on first use; a test puts a stand-in in its place with `setClient`.

## Models (as of 2026-11-02)
- **Replies, the revision pass and evolution** run on `claude-sonnet-5-5`, the default for every text (`textModel`).
- **Sonnet 5.5 does not support forced tool calls** (`tool_choice` "tool"/"any"). The older works' editorial path
  forces a tool, so it stays on `claude-sonnet-5` (`editorialModel`).
- **Thinking off is set per model:** `{type:'between_tools'}` on 5.5, `{type:'disabled'}` on 5 (`thinkingOff`).
- **`npm run check-models`** tries each kind of call against the real API.

## *The Digital Plenitude* (`digital-plenitude/`)
The proofs' chapters 1 and 2, fifteen sections. Its `config.js` carries everything specific to it:

- **The voice and model**
  - `behavioralInstructions`: the text speaks as the work about the world, in the third person. It answers the
    question first and names the main line; it introduces anything the reader has not been shown; it meets a
    challenge as an essay meets an objection; it acknowledges a real factual error plainly.
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
- **Media lists (H-018).** Videos, images and web pages a reply may show, one checked list per section in
  `source_texts/media-lists/section-N.json` (`mediaListsDir`). Each item says when to use it.
  - The model writes `[[MEDIA:id]]` on a line of its own; `api/lib/media.js` keeps only listed items, one per reply,
    and returns them as `media`. The revision pass must keep the marker.
  - The page (`shared/media-items.js`) plays a video whose embedding was checked (youtube-nocookie or Vimeo), shows an
    image whose licence was cleared with its credit, and shows everything else, or an image that fails to load, as a
    card that opens a new tab.
  - **Keeping the lists:** `npm run media -- add | bulk | check | search | list` (`scripts/media.js`). It needs open
    network (YouTube and Vimeo oEmbed, Commons, the Met, the Art Institute), so it runs in Jay's own terminal. An item
    is never listed by hand from memory: the script's check is its basis.
- **Chapters (H-014).** One work in chapters: `chapters` lists `{ number, title, firstSection, point }`, and a
  section belongs to the last chapter starting at or before it. Chapter 1 is sections 1 to 7; chapter 2, *Popular
  Modernism*, sections 8 to 15; chapter 3, *Dichotomies*, 16 to 18; chapter 4, *Catharsis*, 19 to 23. The page's `CHAPTERS` in `public/app.js` must match (a test checks it); the contents
  list is built from it, grouped by chapter, and numerals start again in each chapter.
- **The argument in brief:** `sectionPoints` and each chapter's `point`. Before every reply, the model gets the point
  for the section and for its chapter, and states it as a claim, never as "the main line" (H-013).
- **Evolution**
  - `synthesisInstructions`: used only for dry-run previews of the old whole-section rewrite.
  - `editorialDelivery: 'markers'`: the text's editorial path runs without forced tools (H-011).
- **The opening boxes:** `sectionIntros` must match `SECTION_INTROS` in `public/app.js`; a test checks this.

## The evolving edition (spine and fund, H-011)
- **The package.** `editorial/content/digital-plenitude/` holds a spine passage for each paragraph and empty funds.
  `npm run editorial-build` writes `api/editorial-seed/`.
- **Reading.** The reader edition (Contribute / Read the current text) reads the current KV version, or the seed if
  none exists. It delivers by markers: `[[FUND:id]]` after a sentence an entry informs, and a private
  `[[MEMORY: …]]` line. The server reads and removes both. The reading then goes through the whole pipeline above.
- **Evolution.** When a contributing reader finishes, `api/evolve.js` runs the two editorial passes (proposal, then
  review) in `api/lib/editorial-evolution.js`, by checked JSON (`structured: 'json'`), and publishes an immutable
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
  in plain spoken sentences) and `student` (H-021: an undergraduate reading an assigned chapter, no web search).
- **Measuring a round:** `npm run reading-report -- <dir>` (H-021) reads a round's `session.json` files and prints
  words per reply and how many run over the limit, notes per reply, self-reference, repeats, the reader's private
  reflections, revisions applied, and the cache share. `--json` for data.
- **Output.** Transcripts show notes, and the draft before revision.
- **Reading rounds** are run from scripts in the vault (`projects/digital-plenitude/readings/run-*.sh`) and measured
  there by a blind judge.
