# liquid — CLAUDE.md

## What This Is

A web-based prototype for multi-turn conversation about an essay on the uncanny in film, literature, and digital media. The reader types into an input field and receives responses that gradually reveal the essay's argument section by section.

The essay is divided into five sections. The interface shows a persistent TOC sidebar; clicking a section loads that section's text into the model's context. The model only ever sees the currently active section — this prevents it from pre-empting later parts of the argument. Conversation history carries over across section changes.

Anthropic prompt caching is used on the active section block. The cache re-warms when the reader switches sections (one cache write per transition). Within a section, subsequent turns hit the cache at ~10% cost.

## File Structure

```
uncanny_doubles/           (project root — Vercel serves from here)
├── api/
│   └── chat.js            (Vercel serverless function — handles API calls)
├── liquid/
│   ├── CLAUDE.md
│   ├── source_texts/
│   │   ├── full-uncanny.md    (complete essay — reference copy, not loaded by the API)
│   │   └── sections/
│   │       ├── section-1.md   (The Uncanny Valley and the Uncanny Double)
│   │       ├── section-2.md   (Film and the Uncanny)
│   │       ├── section-3.md   (The Double in Film)
│   │       ├── section-4.md   (Uncanny Avatars in Mirror Worlds)
│   │       └── section-5.md   (The Uncanny is a Feature, not a Bug)
│   ├── images/            (section images — served at /liquid/images/)
│   │   ├── uncanny-valley-graph.png   (Section I)
│   │   ├── train.jpeg                 (Section II)
│   │   └── freud.jpg                  (available, not yet assigned)
│   └── public/
│       ├── index.html     (markup — includes TOC nav)
│       ├── style.css      (styles)
│       └── app.js         (client-side JS — history, sectionIndex, TOC handlers)
├── .env.local             (not committed — holds ANTHROPIC_API_KEY for local dev)
├── package.json
└── vercel.json
```

Note: `api/chat.js` lives at the project root rather than inside `liquid/` because Vercel requires serverless functions to be in a top-level `api/` directory.

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
# open http://localhost:3000/liquid/public/index.html
```

## Deploy to Vercel

1. Push the repo to GitHub
2. Go to vercel.com → New Project → import the repo
3. Root Directory should be the repo root (not `liquid`)
4. Add `ANTHROPIC_API_KEY` as an environment variable in Vercel's dashboard
5. Deploy — auto-deploys on every push after that

## Technical Stack

- **Serverless function**: Node.js (`api/chat.js`) via Vercel
- **Frontend**: HTML, CSS, vanilla JS (no framework)
- **Model**: `claude-sonnet-4-6`
- **Section management**: `sectionIndex` (0–4) is tracked client-side and sent with every request; the API loads only that section's file
- **Caching**: ephemeral prompt cache on the active section block — invalidates on section change, warm within a section
- **History**: full conversation history stored in the browser, sent with each request; persists across section switches

## The Five Sections

| # | Title | File | Image |
|---|-------|------|-------|
| I | The Uncanny Valley and the Uncanny Double | `section-1.md` | `uncanny-valley-graph.png` |
| II | Film and the Uncanny | `section-2.md` | `train.jpeg` |
| III | The Double in Film | `section-3.md` | — |
| IV | Uncanny Avatars in Mirror Worlds | `section-4.md` | — |
| V | The Uncanny is a Feature, not a Bug | `section-5.md` | — |

Section 1 includes the abstract. The References section is excluded from all section files.

## Layout

Two-column grid: left column (`1fr`, no max-width cap on the layout) for the reading content, right column (`25rem`) for the TOC and input panel. The layout fills the full viewport width — no `max-width` on `#layout` — so the left column always fills `viewport − 25rem`. Content within the left column is centered with `align-items: center` and `max-width: 65ch`, giving equal left and right margins that both grow as the window widens.

Right column: TOC (top, hidden on mobile), input panel (bottom, separated by a border). The right column is `position: sticky` so it stays in view while the left column scrolls.

## Section Images

Each section can have an optional image that appears below the boxed intro text when a section loads. Images are defined in the `SECTION_IMAGES` array in `app.js` — set an entry to `null` if no image. Images are stored in `liquid/images/` and referenced with the relative path `../images/filename` from `liquid/public/`.

To add an image for a section: drop the file in `liquid/images/` and fill in the corresponding `null` in `SECTION_IMAGES` with `{ src: '../images/filename', alt: 'description' }`.

Images are styled with `.section-image` in `style.css` — currently `width: 75%; height: auto`.

## Input Area

The right column input panel has:
- `#reader-history`: scrollable log of the reader's past messages (italic, muted)
- `#reader-instruction`: "Type your questions or comments below."
- `#message-input`: auto-resizing textarea (grows to 8rem max), submitted on Enter (Shift+Enter for newline)
- A blinking `_` cursor (CSS `::before` on `#input-area`) that disappears on focus, indicating where to click

## TOC Sidebar

Roman numerals I–V with short section titles. Active section is dark (`#444`), inactive is very muted (`#c0bdb6`). Clicking a section updates `sectionIndex` immediately — the next message sent will use the new section. Hidden on viewports narrower than 960px.

## System Prompt (current version)

The system block sent to the API has two parts: (1) `BEHAVIORAL_INSTRUCTIONS` + the current section name + the section's intro text, and (2) the full section text with `cache_control: ephemeral`. Edit `BEHAVIORAL_INSTRUCTIONS` in `api/chat.js` to change behavior.

```
You are presenting an essay on the uncanny in film, literature, and digital media. The current section of the essay is provided below.

Engage the reader's ideas with intellectual precision and authority. Do not be chatty or conversational. Speak in the third person. Keep the tone that of a serious verbal discussion. Do not talk about the essay. Do not say "the essay argues" or "the essay says" or "the argument is". Refer to the ideas directly, not the essay or the argument itself. Do NOT comment on the argument. Do not say "this is where the argument gets interesting" etc. Just present the ideas in a clear and engaging way.

Stay true to the essay's actual argument. Do not invent claims the text does not make. The essay is the primary terrain; your role is to illuminate it in the direction the reader's interests are pulling. You can bring in outside information and ideas to help illuminate the argument, as long as they are relevant and accurate.

Keep each response to at most 200 words. Do not reveal the whole section at once. Do not start with a summary of everything. Reveal ideas gradually in response to the reader's questions — let the reader feel they are uncovering the argument with you.

Focus on the ideas in the current section. Do not pre-empt or summarize ideas from other sections.
```

## What Success Looks Like

The reader should feel like they are uncovering the argument — not receiving a lecture. Within each section, the model responds to what the reader actually asks rather than summarizing the whole section. Moving to a new section (via the TOC) loads fresh material while keeping the thread of the conversation intact.

## Future Work — Model Latitude

The model is currently tightly tethered: it draws on outside material only to "illuminate the argument," but the 200-word cap and section-focus instructions leave it little room to range. The question is how to let it explore more freely — bringing in examples, counterarguments, historical context — without drifting away from the essay's actual claims.

**Option 1 — Loosen the system prompt**
Revise to explicitly license exploration: examples, analogies, parallel cases, counterarguments the model then resolves. Costs nothing. Risk: the model's knowledge of specific texts or dates may be imprecise.

**Option 2 — Explicit departure-and-return instruction**
Add a rule like: *"You may bring in examples, counterarguments, historical context, or parallel cases from outside the text — but close each response by tying back to the current section's specific argument."* Costs nothing; more deliberate than Option 1.

**Option 3 — Trust the section boundary as the structural tether**
The architecture already prevents large-scale drift: the model only sees one section at a time. The section boundary *is* the get-back-on-track mechanism — meaning we can afford to be more permissive in the prompt.

**Option 4 — Web search via tool use**
Define a `web_search` tool (Brave Search or Exa API) that the model can call before responding. Responses become more evidential and current. Tradeoffs: added latency, cost, and implementation work in `api/chat.js`.

**Recommended starting point**: Options 2 + 3 combined. Add web search (Option 4) only if the prompt revision doesn't produce enough richness.
