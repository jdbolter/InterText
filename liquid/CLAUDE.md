# liquid — CLAUDE.md

## What This Is

A web-based prototype for multi-turn conversation about an essay on the uncanny in film, literature, and digital media. The reader types into an input field and receives responses that gradually reveal the essay's argument section by section.

The essay is divided into five sections. The interface shows a persistent TOC sidebar; clicking a section loads that section's text into the model's context. The model only ever sees the currently active section — this prevents it from pre-empting later parts of the argument. Conversation history carries over across section changes.

The text is not fixed. Each reader who engages deeply enough can contribute to a living revision of the section they are reading — and the version that the next reader encounters will have been shaped by those who came before. The essay evolves as a cumulative record of its readers' thinking. This is the central premise of the project: the text is genuinely interactive, changed by the collective experience of everyone who has read it.

Anthropic prompt caching is used on the active section block. The cache re-warms when the reader switches sections (one cache write per transition). Within a section, subsequent turns hit the cache at ~10% cost.

## File Structure

```
uncanny_doubles/           (project root — Vercel serves from here)
├── api/
│   ├── chat.js            (Vercel serverless function — handles chat API calls)
│   └── evolve.js          (Vercel serverless function — handles section evolution)
├── evolved_sections.json  (persistent reader-contributed section revisions)
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
│   │   ├── freud.jpg                  (Section III)
│   │   └── gemini-pod.png             (Section III)
│   └── public/
│       ├── index.html     (markup — includes TOC nav)
│       ├── style.css      (styles)
│       └── app.js         (client-side JS — history, sectionIndex, TOC handlers, evolve trigger)
├── .env.local             (not committed — holds ANTHROPIC_API_KEY for local dev)
├── package.json
└── vercel.json
```

Note: `api/chat.js` and `api/evolve.js` live at the project root rather than inside `liquid/` because Vercel requires serverless functions to be in a top-level `api/` directory.

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

- **Serverless functions**: Node.js (`api/chat.js`, `api/evolve.js`) via Vercel
- **Frontend**: HTML, CSS, vanilla JS (no framework)
- **Model**: `claude-sonnet-4-6`
- **Section management**: `sectionIndex` (0–4) is tracked client-side and sent with every request; the API loads only that section's file
- **Caching**: ephemeral prompt cache on the active section block — invalidates on section change, warm within a section
- **History**: full conversation history stored in the browser, sent with each request; persists across section switches
- **Evolved sections**: `evolved_sections.json` stores reader-contributed revisions; `api/chat.js` prefers the evolved text over the original when one exists

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

Two-column grid: left column (`1fr`, no max-width cap on the layout) for the reading content, right column (`25rem`) for the TOC and input panel. The layout fills the full viewport width — no `max-width` on `#layout` — so the left column always fills `viewport − 25rem`. Content within the left column is centered with `align-items: center` and `max-width: 65ch`, giving equal left and right margins that both grow as the window widens.

Right column: TOC (top, hidden on mobile), input panel (bottom, separated by a border). The right column is `position: sticky` so it stays in view while the left column scrolls.

## Section Images

Each section can have multiple optional images that appear inline in guide responses via token substitution. Images are defined in the `SECTION_IMAGES` array in `app.js` — set an entry to `null` if no images for that section. Images are stored in `liquid/images/` and referenced with the relative path `../images/filename` from `liquid/public/`.

The corresponding image availability prompts are defined in `SECTION_IMAGE_PROMPTS` in `api/chat.js`. Each entry specifies an `id` and the instruction telling the model when and how to embed the `[[IMAGE:id]]` token. Once an image has been shown, its id is added to the `shownImages` set (client-side) and sent with each subsequent request so the model is told only about images it hasn't shown yet.

To add an image for a section: drop the file in `liquid/images/`, add an entry to `SECTION_IMAGES` in `app.js`, and add a matching entry to `SECTION_IMAGE_PROMPTS` in `api/chat.js`.

Images are styled with `.response-image` in `style.css`.

## Input Area

The right column input panel has:
- `#reader-history`: scrollable log of the reader's past messages (italic, muted)
- `#reader-instruction`: "Type your questions or comments below."
- `#message-input`: auto-resizing textarea (grows to 8rem max), submitted on Enter (Shift+Enter for newline)
- A blinking `_` cursor (CSS `::before` on `#input-area`) that disappears on focus, indicating where to click

Typing `@@@` and pressing Enter triggers the evolve flow instead of a normal chat turn (see Evolved Sections below).

## TOC Sidebar

Roman numerals I–V with short section titles. Active section is dark (`#444`), inactive is very muted (`#c0bdb6`). Clicking a section updates `sectionIndex` immediately — the next message sent will use the new section. Hidden on viewports narrower than 960px.

## System Prompt (current version)

The system block sent to the API has two parts: (1) `BEHAVIORAL_INSTRUCTIONS` + active image availability prompts + the current section name + the section's intro text, and (2) the full section text with `cache_control: ephemeral`. Edit `BEHAVIORAL_INSTRUCTIONS` in `api/chat.js` to change behavior.

```
You are presenting an essay on the uncanny in film, literature, and digital media. The current section of the essay is provided below.

Engage the reader's ideas with intellectual precision and authority. Do not be chatty or conversational. Speak in the third person. Keep the tone that of a serious verbal discussion.

Never refer to the text, the essay, the authors, or the argument as external objects. Do not say "the text argues," "the essay claims," "the author suggests," or use any author names. Do not say "the argument is" or "this argument." Speak the ideas directly as live propositions — as if you are the intelligence behind them, not a guide to a document.

Stay true to the essay's actual argument. Do not invent claims the text does not make. The essay is the primary terrain; your role is to illuminate it in the direction the reader's interests are pulling.

Range freely when it serves the ideas: bring in examples, counterarguments, historical context, and parallel cases from outside the text. But close each response by tying back to the specific argument in the current section.

Keep each response to at most 250 words. Do not reveal the whole section at once. Do not start with a summary of everything. Reveal ideas gradually in response to the reader's questions — let the reader feel they are uncovering the argument with you.

Focus on the ideas in the current section. Do not pre-empt or summarize ideas from other sections.
```

Key changes from the original: the 200-word cap is now 250 words; the instruction to avoid referencing "the essay" or author names is now explicit; the latitude for outside examples is broader, with a mandatory close-and-return-to-the-section requirement.

## Evolved Sections

This is the feature that makes the project genuinely different from a static interactive essay. The text itself is not fixed — it accumulates the thinking of everyone who reads it. Each conversation a reader has with the guide is a potential contribution to the essay. If a reader's questions open up the argument, surface a new connection, or push back in a way the text didn't anticipate, that friction can be written back into the section — and the next reader will find a text that has already been deepened by someone else's engagement. The essay is changed by the collective experience of its readers.

After a conversation with the guide, typing `@@@` and pressing Enter triggers a call to `api/evolve.js`.

The evolve endpoint:
1. Loads the current section text (evolved version if one exists, otherwise the original)
2. Passes it to `claude-sonnet-4-6` along with the full conversation transcript
3. The model acts as a scholarly editor: it revises the section to incorporate insights from the conversation while strictly preserving the essay's tone, voice, and argument
4. The revised text is written back to `evolved_sections.json` under the section's index key

`api/chat.js` reads `evolved_sections.json` on every request and uses the evolved text in place of the original when one exists. Every subsequent reader — and every future guide response — draws on the version the previous reader helped write. Evolution is cumulative: each `@@@` call works from whatever the current evolved state is, not from the original.

The `evolved_sections.json` file at the project root is the persistence layer for all evolved text. In production (Vercel), `fs.writeFileSync` will fail silently (serverless functions have a read-only filesystem); the TODO in both files flags this as the place to swap in Vercel KV or another key-value store.

### Synthesis Instructions (`api/evolve.js`)

The scholarly-editor prompt instructs the model to:
- Deepen, clarify, or extend the argument — not change it
- Preserve sentence rhythm and register
- Incorporate conversation insights only where they genuinely strengthen the section
- Return the section unchanged if the conversation produced nothing useful
- Keep the revised section roughly the same length as the input
- Output only the revised text, no preamble

## What Success Looks Like

The reader should feel like they are uncovering the argument — not receiving a lecture. Within each section, the model responds to what the reader actually asks rather than summarizing the whole section. Moving to a new section (via the TOC) loads fresh material while keeping the thread of the conversation intact.

After a rich conversation, triggering `@@@` should deepen the section in ways the reader recognizes as their own contribution — and in ways a future reader will encounter without knowing where they came from. The ideal is a text that bears the traces of many minds, that has been quietly sharpened and extended by readers who never met each other, whose thinking nonetheless accumulates in the essay itself.
