# uncanny — CLAUDE.md

## What This Is

A web-based prototype for multi-turn conversation about an essay on the uncanny in film, literature, and digital media. The reader types into an input field and receives responses that gradually reveal the essay's argument section by section.

The essay is divided into five sections. The interface shows a persistent TOC sidebar; clicking a section loads that section's text into the model's context. The model only ever sees the currently active section — this prevents it from pre-empting later parts of the argument. Conversation history carries over across section changes.

The text is not fixed. Each reader who engages deeply enough can contribute to a living revision of the section they are reading — and the version that the next reader encounters will have been shaped by those who came before. The essay evolves as a cumulative record of its readers' thinking. This is the central premise of the project: the text is genuinely interactive, changed by the collective experience of everyone who has read it.

## The Design Problem: Constraint and Identity

The central tension in the project is between the essay having a fixed character — a voice, an argument, a force of its own — and being genuinely open to expansion by readers. The analogy is the sonnet: the constraint of the form is what gives it pressure and identity, not what limits it. The question is what the equivalent formal constraint is for a living text.

A few design principles to keep in mind as the project develops:

**The guide must inhabit the argument, not narrate it.** The model's default is the explainer role — standing outside the text and describing it ("the essay argues...", "this is what makes the argument important..."). This is the path of least resistance given its training. The system prompt needs to give it a strong positive identity instead: it is the intelligence behind the argument, not a guide to a document. Prohibitions alone don't work; the model needs a role to inhabit.

**Evolution should be structurally constrained, not just editorially.** Currently the evolve prompt says "deepen and extend without changing the argument" — which is loose. Worth considering whether evolution should be more like musical variation: a new example can be added, an objection sharpened, a connection made explicit, but the core sentence-level argument is frozen. This would preserve the essay's identity across many readers.

**The reader's trace is currently invisible.** When a reader's conversation evolves a section, that contribution dissolves into the text — the next reader can't see where previous readers pushed. Making the shape of change visible (not the conversation, but what shifted) could make the uncanny dimension of the project explicit rather than incidental: the reader encounters a text already marked by minds they'll never meet.

Anthropic prompt caching is used on the active section block. The cache re-warms when the reader switches sections (one cache write per transition). Within a section, subsequent turns hit the cache at ~10% cost.

## File Structure

```
InterText/                 (project root — Vercel serves from here)
├── api/
│   ├── chat.js            (generic Vercel serverless function — loads config by textId)
│   └── evolve.js          (generic Vercel serverless function — loads config by textId)
├── uncanny/               (this text — textId: 'uncanny')
│   ├── config.js          (all text-specific content: sections, names, intros, images, prompts)
│   ├── CLAUDE.md
│   ├── source_texts/
│   │   ├── full-uncanny.md    (complete essay — reference copy, not loaded by the API)
│   │   └── sections/
│   │       ├── section-1.md   (The Uncanny Valley and the Uncanny Double)
│   │       ├── section-2.md   (Film and the Uncanny)
│   │       ├── section-3.md   (The Double in Film)
│   │       ├── section-4.md   (Uncanny Avatars in Mirror Worlds)
│   │       └── section-5.md   (The Uncanny is a Feature, not a Bug)
│   ├── images/            (section images — served at /uncanny/images/)
│   │   ├── uncanny-valley-graph.png   (Section I)
│   │   ├── train.jpeg                 (Section II)
│   │   ├── freud.jpg                  (Section III)
│   │   └── gemini-pod.png             (Section III)
│   └── public/
│       ├── index.html     (markup — includes TOC nav)
│       ├── style.css      (styles)
│       └── app.js         (client-side JS — sends textId: 'uncanny' with every request)
├── evolved_sections.json  (local dev fallback — { uncanny: { 0: '...', 1: '...' } })
├── .env.local             (not committed — holds ANTHROPIC_API_KEY for local dev)
├── package.json
└── vercel.json
```

Note: `api/chat.js` and `api/evolve.js` live at the project root because Vercel requires serverless functions in a top-level `api/` directory. They are generic — they load text-specific config from `uncanny/config.js` (or any other text folder) based on the `textId` sent in the request body.

## Adding a New Text

1. Create a new folder at the project root (e.g. `mytext/`)
2. Add `mytext/config.js` — copy `uncanny/config.js` and replace all content with the new text's data
3. Add `mytext/source_texts/sections/` with the section `.md` files
4. Add `mytext/public/` with `index.html`, `style.css`, `app.js` — update `app.js` to send `textId: 'mytext'`
5. Add `'mytext'` to `ALLOWED_TEXT_IDS` in both `api/chat.js` and `api/evolve.js`

## KV Storage (Evolved Sections)

Evolved sections are stored per text:
- **Redis (production)**: one key per text — `evolved:uncanny`, `evolved:mytext`, etc. Each key holds `{ 0: '...', 1: '...' }` (section index → evolved text). You can view, delete, or reset any text's data independently in the Upstash dashboard.
- **Local dev fallback**: `evolved_sections.json` at project root — `{ "uncanny": { "0": "..." }, "mytext": { ... } }`.

To reset evolved data for a text: delete its key in Upstash (`evolved:uncanny`), or flush the whole database. The original section files are always the fallback — no data loss.

## Prerequisites

```bash
npm install -g vercel
npm install
```

Add your API key to `.env.local` at the project root:
```
ANTHROPIC_API_KEY=your_key_here
```

## Run Locally

```bash
vercel dev
# open http://localhost:3000/uncanny/public/index.html
```

## Deploy to Vercel

1. Push the repo to GitHub
2. Go to vercel.com → New Project → import the repo
3. Root Directory should be the repo root (not `uncanny`)
4. Add `ANTHROPIC_API_KEY` as an environment variable in Vercel's dashboard
5. Deploy — auto-deploys on every push after that

## Technical Stack

- **Serverless functions**: Node.js (`api/chat.js`, `api/evolve.js`) via Vercel — generic, config-driven
- **Frontend**: HTML, CSS, vanilla JS (no framework)
- **Model**: `claude-sonnet-4-6`
- **Text config**: `uncanny/config.js` — all text-specific data lives here
- **Section management**: `sectionIndex` (0–4) tracked client-side, sent with every request; API loads only the active section's file
- **Caching**: ephemeral prompt cache on the active section block — invalidates on section change, warm within a section
- **History**: full conversation history stored in the browser, sent with each request; persists across section switches
- **Evolved sections**: KV key `evolved:uncanny` stores reader-contributed revisions; `api/chat.js` prefers evolved text over original when one exists

## The Five Sections

| # | Title | File | Images |
|---|-------|------|--------|
| I | The Uncanny Valley and the Uncanny Double | `section-1.md` | `uncanny-valley-graph.png` |
| II | Film and the Uncanny | `section-2.md` | `train.jpeg` |
| III | The Double in Film | `section-3.md` | `freud.jpg`, `gemini-pod.png` |
| IV | Uncanny Avatars in Mirror Worlds | `section-4.md` | — |
| V | The Uncanny is a Feature, not a Bug | `section-5.md` | — |

Section 1 includes the abstract. The References section is excluded from all section files.

## Layout

Two-column grid: left column (`1fr`) for reading content, right column (`25rem`) for TOC and input panel. No `max-width` on `#layout` — left column fills `viewport − 25rem`. Content centered within with `max-width: 65ch`.

Right column: TOC (top, hidden on mobile), input panel (bottom, separated by border). Right column is `position: sticky`.

## Section Images

Images are defined in `config.js` under `sectionImagePrompts` (API side) and in `SECTION_IMAGES` in `public/app.js` (client side). Images live in `uncanny/images/` and are referenced as `../images/filename` from `uncanny/public/`.

To add an image: drop the file in `uncanny/images/`, add an entry to `SECTION_IMAGES` in `app.js`, and add a matching entry to `sectionImagePrompts` in `config.js`.

## Behavioral Instructions

Edit `behavioralInstructions` in `uncanny/config.js` to change how the guide responds. Edit `synthesisInstructions` to change how the evolve endpoint rewrites sections.

## Evolved Sections

After a rich conversation, the reader can trigger evolution by clicking "Finish" (if they opted in at the start). This calls `api/evolve.js`, which:
1. Loads the current section text (evolved version if one exists, otherwise original)
2. Passes it to `claude-sonnet-4-6` along with the full conversation transcript
3. The model acts as a scholarly editor, revising the section per `synthesisInstructions`
4. The revised text is written back to KV under `evolved:uncanny`

Evolution is cumulative — each call works from the current evolved state, not the original.
