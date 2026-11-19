# InterText

A platform for AI-mediated interactive reading. A reader converses with a text that speaks as the work itself: it answers questions, takes up objections, and carries the reading on at a press of Return. Each text lives in its own folder with a config file and its source sections; two generic serverless functions serve every text. A reader who contributes can shape the edition that later readers receive, through an editorial layer that keeps each section's narrative spine apart from a fund of optional material.

## Quick start

Requires Node.js 22 or later.

```bash
npm install
```

Put the keys in `.env.local` at the project root (never committed):

| Variable | Used for |
|---|---|
| `ANTHROPIC_API_KEY` | the text's replies, the revision pass and editorial passes |
| `OPENAI_API_KEY` | the synthetic readers only |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | the Vercel KV (Upstash) database that holds the evolving edition |

```bash
npm run dev      # Vercel dev server on http://localhost:3000, with .env.local loaded
npm test         # offline test suite; run before every commit
```

Open `http://localhost:3000/` for the landing page, or a text directly at `http://localhost:3000/<text-id>/public/index.html`. With the KV variables set, local development reads and writes the same database as the live site. Without them a reading uses the bundled seed (`api/editorial-seed/`) and a contribution cannot be saved.

## Layout

```
InterText/
├── index.html                landing page (offers digital-plenitude)
├── api/
│   ├── chat.js               serverless function: one reading turn (config-driven by textId)
│   ├── evolve.js             serverless function: a contributing reader's editorial update
│   ├── _lib/                 helpers (citations, media, prompt, revision pass, editorial store and passes)
│   └── editorial-seed/       generated baseline packages, bundled into the functions
├── shared/                   page code shared by texts (citation notes, media items)
├── editorial/                spine-and-fund packages, schema, build, local author editor, KV tools
├── synthetic-reader/         CLI harness: a simulated reader drives /api/chat
├── scripts/                  reading-report, media lists, model check, evolved-store tool
├── digital-plenitude/        The Digital Plenitude (config.js, source_texts/, public/, images/)
├── vercel.json  .vercelignore  package.json
└── CLAUDE.md                 working notes for a Claude session
```

A text folder holds `config.js` (everything specific to the text: sections, introductions, the voice's instructions, images), `source_texts/` (the section files the API loads), and `public/` (the reader's page). `digital-plenitude` has its own page (running head, contents by chapter, citation notes and media items from `shared/`).

## The texts

| textId | Work | Sections | Status |
|---|---|---|---|
| `digital-plenitude` | *The Digital Plenitude*, the whole book in nine chapters | 49 | the text on the landing page; replies on `claude-sonnet-5-5` with a revision pass, library lists and citations, media lists |


## How a reading works

1. **Entry.** The reader chooses *Contribute* (read the evolving edition and let the conversation inform later editions), *Read the current text* (the same edition, nothing saved), or *Read the original* (the untouched authored text).
2. **Turns.** The page sends each message, or an empty Return, to `/api/chat` with the section index. The function loads the section (current KV version, or the seed), builds a cached prompt, and calls the model. For `digital-plenitude` a second call revises the draft into the text's voice, and the server then checks citations and media markers.
3. **Contribution.** When a contributing reader finishes, `/api/evolve` runs a proposal pass and an independent review pass over the conversation and publishes any approved change as a new immutable section version.

The design is in [`CURRENT-DESIGN.md`](CURRENT-DESIGN.md); the data model, storage and editorial passes are in [`EDITORIAL-ARCHITECTURE.md`](EDITORIAL-ARCHITECTURE.md).

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | local server on port 3000 |
| `npm test` | editorial, synthetic-reader and script tests |
| `npm run editorial-build` | validate `editorial/content/` and write `editorial/data/` and `api/editorial-seed/` |
| `npm run editorial-preview` | build, then serve the author editor at `http://127.0.0.1:4173` |
| `npm run editorial-kv -- status\|init\|export --text <id> --section <n>` | inspect, initialize or export a section's shared version |
| `npm run editorial-propose -- --session <run-folder>` | run the two editorial passes on a synthetic reading without publishing |
| `npm run synthetic-reader -- …` | run a simulated reader (see `synthetic-reader/README.md`) |
| `npm run reading-report -- <dir>` | measure a round of synthetic readings |
| `npm run media -- add\|bulk\|check\|search\|list` | maintain the media lists (needs open network) |
| `npm run check-models` | try each kind of model call against the real API |
| `npm run evolved -- show\|reset --text <id>` | the legacy whole-section store (no text uses it now) |

## Deployment

Vercel project `inter-text`; `main` is what it deploys. `vercel.json` bundles `api/editorial-seed/**` into both functions, and `.vercelignore` excludes `editorial/` (the author editor and its manuscript and provenance data stay local). The Hobby plan allows 12 serverless functions and every `.js` file under `api/` counts unless its name or folder starts with an underscore, so only `chat.js` and `evolve.js` live directly in `api/` and all helpers are in `api/_lib/`. Environment variables are set in the Vercel dashboard.

## Adding a text

1. Create `<id>/config.js`, `<id>/source_texts/sections/section-N.md`, and `<id>/public/` (start from `digital-plenitude/public/` and change the per-text data and the `textId`).
2. Add the id to `ALLOWED_TEXT_IDS` in `api/chat.js` and `api/evolve.js`, and to `synthetic-reader/lib/textRegistry.js`.
3. Create `editorial/content/<id>/work.json` and a package for every section (see `editorial/README.md`), then run `npm run editorial-build && npm test`. The tests compare each manifest with the text's `config.js`.
4. Add a card to `index.html` if the text is to be offered.

## Documentation

- [`CURRENT-DESIGN.md`](CURRENT-DESIGN.md): what InterText is and how a reader experiences it.
- [`PROMPTS.md`](PROMPTS.md): what each model call contains, in what order, and which file supplies each part.
- [`EDITORIAL-ARCHITECTURE.md`](EDITORIAL-ARCHITECTURE.md): spine and fund, packages, storage, the editorial passes, the reading modes.
- [`editorial/README.md`](editorial/README.md): the author editor and editorial commands.
- [`synthetic-reader/README.md`](synthetic-reader/README.md): the simulated-reader harness.
- [`CLAUDE.md`](CLAUDE.md): working rules and the technical map of `digital-plenitude`.
