# Uncanny Doubles — Scrollytelling Prototype

## Project Goal

A scrollytelling prototype converting an existing essay on the uncanny into a visual, scroll-driven web experience. This is an exploratory prototype — the purpose is to test whether the scrollytelling form (text steps triggering visual changes in a sticky panel) can carry theoretical argument, and whether it can simultaneously *invoke* the uncanny affect it describes.

The prototype feeds into a larger project: an interactive book/essay on AI, the uncanny, and the double, aimed at intellectually serious non-academic readers (not academic specialists).

## Theoretical Context

The essay explores the uncanny through the lens of **the double** — literary and cinematic doubles (Hoffmann, Poe, Dostoevsky, Jekyll/Hyde, Vertigo, etc.) as the conceptual spine.

Key theoretical move: Freud/Mori's uncanny valley was **perception-based** — wrongness visible in the artifact. Generative AI redraws this as an **epistemic** uncanny: not "this image looks wrong" but "all digital images now carry the trace of possible inauthenticity." The locus shifts from artifact to the viewer's knowledge context.

A further distinction that matters for the argument: the traditional literary Doppelgänger is YOUR double — bound to a single consciousness, it knows something about you that undoes you. The AI is an **aggregate/distributed double** — made from human expression, doubling humanity in the aggregate rather than any individual. This is the project's distinctive theoretical contribution, not just another instance of the familiar double category.

## Form Goals

The scrollytelling prototype should not merely illustrate the argument — it should work toward *invoking* the uncanny affect in the reader while the argument unfolds. Form and content should operate in parallel, not decoratively.

Specific strategies discussed:
- Ambiguous imagery (the reader can't be sure what is AI-generated) placed alongside argument about epistemic uncertainty
- Repetition with difference — images or text that recur with small variations, performing repetition compulsion rather than describing it
- Avoiding announcing the uncanny effect — it should arrive without a label

The medium itself is a resource: AI-generated or AI-adjacent imagery is already uncanny in the relevant sense. The design doesn't need to engineer strangeness from scratch.

## Technical Decisions

- **Stack**: HTML + CSS + JavaScript; Scrollama.js (loaded from CDN) for scroll events
- **Layout**: classic two-panel scrollytelling — text steps on the left, sticky visual panel on the right that changes as the reader scrolls
- **Separate files** (not a single bundle):

```
uncanny_doubles/
├── CLAUDE.md
├── index.html
├── css/
│   └── style.css
├── js/
│   └── scroll.js
├── images/
│   └── (source imagery)
└── [source essay — provided by Jay, read before building]
```

- **Local preview**: `python -m http.server` or `npx live-server`
- **Repo**: GitHub at /Users/jaybolter/Documents/GitHub/distant-writing/interactive-books/uncanny_doubles

## Source Text

Jay will provide the source essay in the repo. Read it before beginning any implementation — the scrollytelling structure should emerge from the argument's shape, not be imposed on it.

## Imagery

Not yet decided. Options:
- Public domain images from Wikimedia Commons — suitable for literary doubles, Hoffmann illustrations, early cinema
- Vertigo stills and similar film imagery are fine for a private prototype but rights-restricted for publication
- AI-generated imagery (via any image gen tool) — directly relevant to the argument and rights-free
- SVG or CSS-generated visuals for a more abstract, less literal approach

Imagery decisions should wait until the essay structure is mapped.

## About Jay

Jay David Bolter — media theorist, digital humanist, emeritus at Georgia Tech. Author of *Remediation* (1999, with Richard Grusin) and *Digital Plenitude* (2019). 40+ years of engagement with digital media and culture. This project is part of a larger interactive book initiative.

Writing style for any text output: American English, intellectually serious but not jargon-heavy, confident claims where evidence supports, prose over bullet points.

## What NOT to Do

- Don't build a chatbot or AI interlocutor layer — that's a later phase of the larger project, not this prototype
- Don't make interactivity decorative (images that swap without connection to the argument)
- Don't aim for production polish — the goal is to test the form, not ship a product
- Don't impose a scrollytelling structure before reading the essay; let the argument's shape determine the sections
- Don't add features not discussed here without checking with Jay
