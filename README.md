# InterText

A platform for AI-mediated interactive reading experiences. Each text lives in its own folder with a config file; a shared generic API engine serves all of them.

```
InterText/
├── index.html          — landing page (cards linking to each text)
├── api/
│   ├── chat.js         — generic Vercel serverless function (config-driven by textId)
│   └── evolve.js       — generic Vercel serverless function (config-driven by textId)
├── editorial/          — local spine-and-fund data, schemas, build, tests, and editor
├── CURRENT-DESIGN.md  — present design, proposed changes, and open choices
├── INTERTEXT-DESIGN-NOTES.md — history of the design discussion
├── EDITORIAL-ARCHITECTURE.md — editorial data model and implementation handoff
├── package.json
├── vercel.json
├── uncanny/             — "The Uncanny Double" essay (textId: 'uncanny')
├── plenitude/           — "Plenitude" essay on cultural hierarchy (textId: 'plenitude')
└── blood-on-the-wall/   — counterfactual Cold War history (textId: 'blood-on-the-wall')
    ├── config.js       — all text-specific content
    └── source_texts/
        └── sections/   — section files loaded by the API
```

Model in use: `claude-sonnet-5` for the guide and editorial passes. The synthetic
reader uses OpenAI (default `gpt-5.6-terra`) so guide and reader are separate models.

## The texts

- **uncanny** — conversation about an essay on the uncanny in film, literature, and digital media. Readers converse with an AI guide that reveals the argument section by section. See `uncanny/CLAUDE.md` for setup, run instructions, and the general engine architecture (KV storage, adding a text, etc.) — it's the canonical reference doc for the shared engine.
- **plenitude** — companion essay on the collapse of cultural hierarchy and the rise of media plenitude. See `plenitude/CLAUDE.md`.
- **blood-on-the-wall** — a counterfactual narrative history (JFK assassinated in Berlin, 1963) told by a historian who has never known any other timeline. The guide is instructed never to acknowledge an "other" version of events exists. See `blood-on-the-wall/CLAUDE.md`.

All three share the same conversational pattern: an AI guide voice per section, plus an opt-in "evolve" step where a reader's conversation can rewrite the section for future readers (see `api/evolve.js` and each config's `synthesisInstructions`). Before reading begins, every text offers the same three-way entry choice — contribute (read and possibly shape the evolving edition), read the current evolving edition without contributing, or read the untouched original — and the same blank-Return continuation (an empty Enter keeps reading instead of requiring a question). See `uncanny/CLAUDE.md`, "Entry Consent" and "Reading On," for how these work; they're identical across all three texts.

## Synthetic reader: editorial development and testing

`synthetic-reader/` is a CLI-only harness that drives the real `/api/chat` endpoint
with an OpenAI model role-playing a reader (curious, skeptical, or collaborative),
instead of a human. It never touches the web interface, and the reading
command never calls `/api/evolve` — a separate `synthetic-reader-evolve` command
can preview what a session's real contributions would do to a section, but only in
a dry-run mode that never reads or writes the live database. See
`synthetic-reader/README.md` for setup and usage; quick start:

```bash
npm run synthetic-reader -- --profile curious --section 1 --turns 10
npm run synthetic-reader-evolve -- --session synthetic-reader/output/<run-folder>
```

The current priority is to use repeated synthetic readings as an **editorial
instrument**, especially for *Plenitude*. Transcripts and private reader reflections
can reveal where the argument becomes unclear, repetitive, unconvincing, or difficult
to enter; where pacing or section boundaries fail; and where the relationship between
the text and the reader needs to change. Those observations can guide manual revision
of the authored source, section structure, introductions, and guide behavior, followed
by another controlled round of readings. The dry-run evolution command is one way to
explore a possible revision, not the only or necessarily preferred editorial outcome.

The same harness may later help prepare and refine questions for human user testing,
but synthetic readers are not substitutes for observing what actual readers understand,
feel, and do. See `synthetic-reader/README.md`, "Current use: an editorial loop," and
`INTERTEXT-DESIGN-NOTES.md`, §10.

The skeptical and collaborative profiles may selectively search the public web for
evidence and sources; the curious nonspecialist remains grounded only in what a reader
sees and already knows. Research access is bounded and intended to test consequential
claims, not to reward citation-heavy responses.

## Editorial workspace: spine and fund

The newer editorial architecture separates a section's **narrative spine** from a
**fund** of optional clarifications, examples, qualifications, counterarguments,
evidence, and extensions. This preserves useful material accumulated through readings
without requiring every detail to enter the continuous essay or every reader's path.

A universal local schema, validated build, and read-only workspace are implemented
under `editorial/`. All three works and all 16 current sections are registered; the
first complete example is *Plenitude*, Section 5, with ten spine passages and four
candidate fund entries extracted from a collaborative synthetic session.

The guide and synthetic-reader harness can consume that package in two
explicit, nonpublishing experiment modes: `editorial-spine` and `editorial-fund`.
The latter offers candidate entries selectively and records which ones the guide
reports actually using. Neither mode reads or writes the live evolved-text database.
The first matched collaborative pair is complete and preserved with the Section 5
package; it used two of four candidates and showed both useful refinement and a risk
of prolonged, repetitive qualification. A skeptical fund/spine comparison is also
preserved; both conditions exposed the same central evidentiary weakness, while the
spine-only reader finished sooner. Curious pairs remain.

```bash
npm install
npm test
npm run editorial-preview
```

Open `http://127.0.0.1:4173`. No API keys, Vercel login, or database connection are
needed to view the bundled seed. When KV variables are present, the workspace displays
the shared live head. It remains read-only.

For the packaged Section 5, the ordinary current-edition reader now loads that live
head and only its accepted fund entries. A contributing save runs separate proposal
and review passes, publishes any approved operations as an immutable child version,
and atomically advances the head. A reader already in the section stays pinned to its
starting version; the next reading receives the new one. Unpackaged sections continue
to use the original whole-section evolution path.

Start with `CURRENT-DESIGN.md` for the present design and proposed changes. Read
`EDITORIAL-ARCHITECTURE.md` for the full data model, database proposal, verified
implementation boundary, and next experiment; read `editorial/README.md` for exact
handoff and content-authoring instructions. `INTERTEXT-DESIGN-NOTES.md` preserves the
history of the design discussion.

## Adding a new text

See the "Adding a New Text" section in `uncanny/CLAUDE.md` for the step-by-step pattern.

## Future work

**Generate alternate-history texts from timeline JSON instead of hand-written source markdown.** `blood-on-the-wall` is the first of what could be a category of counterfactual-history texts. Its section text is currently hand-written markdown, same as uncanny/plenitude. But these histories are actually generated by a separate repo, **Monte Carlo Fiction**, which produces JSON timeline files (structured event data) and then renders them into prose.

Idea: skip hand-authoring a canonical markdown section per text, and instead drop the JSON timeline file into this app directly, with the model doing the JSON → prose rendering. Two things to work out before implementing:

- **Rendering should happen once, not per chat turn.** Render each section from its JSON slice a single time (a "compile" step, essentially reusing the pattern `api/evolve.js` already implements) and cache that output as the canonical `sections[idx]` text. Everything downstream — word limits, the evolve length guard, the historian persona in `chat.js` — then keeps working unchanged, because it still just sees prose.
- **Section boundaries need to be decided.** The JSON timeline is presumably a flat list of events with no built-in notion of "4 sections for the reader UI." Needs either manual date-range groupings in `config.js`, or a boundary marker added to the Monte Carlo Fiction timeline format itself. (Confirmed with Jay: this chunking step would need to happen regardless of the rendering approach.)

This would make the JSON the single source of truth for a given alternate history (shared with Monte Carlo Fiction) rather than a hand-copied duplicate, and could make the per-reader "evolve" step more interesting — rewrites could in principle fold back into structured timeline data rather than just prose.
