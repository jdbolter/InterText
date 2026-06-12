# beats — a beat-structured probe (v0.1)

A demonstration of the beat-structure alternative to liquid's section-chunking, built on the same essay. One section only: "Film and the Uncanny."

```
beats/
├── README.md              (this file)
├── section-2-beats.json   (the argument graph: 7 beats with canonical prose,
│                           quotations, depth material, deferrals, exits, exhibits)
├── system-prompt.md       (persona, quotation-first rule, deferral protocol,
│                           banned moves, 4 exemplar exchanges)
├── sample-transcript.md   (hand-written annotated demonstration of intended behavior)
└── public/
    └── index.html         (minimal chat page for testing)

../api/beats-chat.js       (serverless endpoint — composes per-beat context,
                            handles advance detection; liquid untouched)
```

## Run it

Same setup as liquid: `ANTHROPIC_API_KEY` in `.env.local` at the repo root, no new npm dependencies, then:

```bash
vercel dev
# open http://localhost:3000/beats/public/index.html
```

The chip under the title shows the active beat (debugging aid — remove for any real reader test). A `· · ·` divider marks each advance. Advance detection is the model self-reporting the exit condition via a hidden marker (`[ADVANCE]`), stripped server-side — see "deliberately unresolved" below. Traversal in v0.1 is the fixed linear order; the aura/freud branch is not yet reader-choosable.

## How this differs from liquid

liquid injects a whole section as context and trusts a loose prompt. Here the unit is the **beat** — one argumentative move — and the structure is a controller, not content:

- The model's context per turn = system prompt + ACTIVE beat (full) + GROUNDED beat summaries. LOCKED beats are absent from context, so the model cannot leak them.
- The model presents *from* the beat's canonical prose and quotations (quotation-first), never from the JSON structure itself.
- Beats have preconditions (`requires`), so the section is a small dependency graph rather than a line — `aura-permanent-crisis` and `freud-fetish-substitute` both hang off `myth-vs-effect` and can be taken in either order or (one of them) skipped.
- Deferrals are authored per beat, so reaching ahead gets a written answer in voice, not an improvised one.
- Exhibits (images, the desaturated Lumière still, the persistent Mori curve) are attached to beats and triggered by argument state — the scrolly idea with the scroll replaced by the argument.

## What is deliberately unresolved

- **Exit detection.** Who decides a beat's `exit` condition is met? Options: the model self-reports in a hidden control token; a second cheap classifier pass; or simply N substantive turns. v0.1 punts — the sample transcript assumes a competent judge.
- **Persona.** The prompt uses the book-as-speaker. Swappable; the rest of the design does not depend on it.
- **Prompt caching.** The per-beat context churn is higher than liquid's per-section churn; beats are small, so the cost question needs measuring, not guessing.

## How to evaluate

Run the reader script from `sample-transcript.md` against the liquid prototype and against a build of this design. Compare: (1) does the argument's order survive a reader demanding the punchline; (2) paraphrase-sentences vs. quoted-sentences per turn; (3) any unplanned moment of hesitation. Drafts of canonical prose are trimmed from `source_texts/full-uncanny.md` and need JDB's revision, as do the four exemplar exchanges, which currently define the voice.
