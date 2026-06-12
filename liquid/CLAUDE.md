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
├── source_texts/
│   ├── full-uncanny.md    (complete essay — reference copy, not loaded by the API)
│   └── sections/
│       ├── section-1.md   (The Uncanny Valley and the Uncanny Double)
│       ├── section-2.md   (Film and the Uncanny)
│       ├── section-3.md   (The Double in Film)
│       ├── section-4.md   (Uncanny Avatars in Mirror Worlds)
│       └── section-5.md   (The Uncanny is a Feature, not a Bug)
├── liquid/
│   ├── CLAUDE.md
│   └── public/
│       ├── index.html     (markup — includes TOC nav)
│       ├── style.css      (styles)
│       └── app.js         (client-side JS — history, sectionIndex, TOC handlers)
├── .env.local             (not committed — holds ANTHROPIC_API_KEY for local dev)
├── package.json
└── vercel.json
```

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

| # | Title | File |
|---|-------|------|
| I | The Uncanny Valley and the Uncanny Double | `section-1.md` |
| II | Film and the Uncanny | `section-2.md` |
| III | The Double in Film | `section-3.md` |
| IV | Uncanny Avatars in Mirror Worlds | `section-4.md` |
| V | The Uncanny is a Feature, not a Bug | `section-5.md` |

Section 1 includes the abstract. The References section is excluded from all section files.

## TOC Sidebar

Fixed to the left edge of the viewport, vertically centered. Hidden on viewports narrower than 960px (no room outside the 65ch reading column). Roman numerals I–V with short section titles; active section is dark (`#444`), inactive is very muted (`#c0bdb6`). Clicking a section updates `sectionIndex` in `app.js` immediately — the next message sent will use the new section.

## System Prompt (current version)

```
You are presenting an essay on the uncanny in film, literature, and digital media.
The current section of the essay is provided below.

Engage the reader's ideas with intellectual precision and authority. Do not be
chatty or conversational. Speak in the third person. Keep the tone that of a
serious verbal discussion. Do not talk about the essay. Do not say "the essay
argues" or "the essay says" or "the argument is". Refer to the ideas directly,
not the essay or the argument itself. Do NOT comment on the argument. Just
present the ideas in a clear and engaging way.

Stay true to the essay's actual argument. Do not invent claims the text does
not make. You can bring in outside information and ideas to help illuminate the
argument, as long as they are relevant and accurate.

Keep each response to at most 200 words. Do not reveal the whole section at
once. Reveal ideas gradually in response to the reader's questions. Focus on
the ideas in the current section. Do not pre-empt or summarize ideas from
other sections.

Current section: [injected dynamically]
```

## What Success Looks Like

The reader should feel like they are uncovering the argument — not receiving a lecture. Within each section, the model responds to what the reader actually asks rather than summarizing the whole section. Moving to a new section (via the TOC) loads fresh material while keeping the thread of the conversation intact.
