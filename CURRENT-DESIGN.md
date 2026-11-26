# InterText: design

InterText is a sustained reading of a whole work in which a text speaks as the work itself. The reader can continue, question, disagree or pursue an example without losing the work's main movement. Contributing readers can change what later readers receive. The aim is a coherent text that becomes more responsive while remaining worth reading as prose, not automatic agreement or perpetual expansion.

## The reader's experience

- **Entry.** Before reading begins the reader chooses one of three paths: *Contribute* (read the evolving edition; the conversation may inform later editions), *Read the current text* (the same edition, nothing saved), or *Read the original* (the untouched authored text). The choice is made once; there is no comparison view during reading.
- **A boxed opening, then the text.** Each section opens with a short boxed passage written for the reader. The text then speaks from what it holds for that section. The reader sees only the box and what has been said in the conversation, so the text introduces anything the reader has not been shown.
- **Messages and Return.** A reader can write a message or press Return with nothing typed. A message gets an answer; Return carries the reading on with the next ideas the text holds. The first Return treats the box as a prologue and begins at the first passage; later Returns resume from where the conversation has reached. When a section's material is exhausted the text signals completion, and a further Return moves to the next section.
- **Sections.** The contents list stays on screen; the reader can move to any section. Each section's conversation is kept with it, and the text holds a short private memory of each section visited, so a long reading keeps its continuity without resending every turn.
- **A single voice.** The text does not announce what came from the original, a fund entry, a reader or the model, and does not refer to its own argument, sections or editorial apparatus. It meets an objection as an essay does and acknowledges a real factual error plainly.

## The texts

Two texts are offered. The landing page opens on *The Digital Plenitude*, the whole book in nine chapters, and beneath it, under "How does a text like this work?", offers the DH2027 paper that describes the system (`intertext-paper`), read in the same form. The paper's six sections are its own five, with the system section divided in two; the paper is its spine, and its fund holds entries drawn from this documentation, so a reader can ask how a reply is made, what the fund is or how a text evolves and be answered from the system's own description. Both texts run the same pipeline, described below for *The Digital Plenitude*.

## The voice of *The Digital Plenitude*

`digital-plenitude/config.js` carries the instructions. The text speaks as the work about the world, in the third person, in the register of a serious spoken discussion between equals. It answers the reader's question first and then widens to the ideas that frame it. Each section has a stated point, and each chapter has one; they steer the reply and are stated only when the reader's message bears on them. A claim is stated at the strength its evidence gives it, with its reach; a reply closes on something of its own, not on a summary or an antithesis; a point the reader makes well is granted in a plain clause.

Every draft goes through a revision pass that rewrites it into this voice. The pass sees the section's point, what the reader has been shown, and what the work holds for the section, and it enforces the word limit (250 words) and the rules above. The server then checks citation and media markers.

- **Citations.** For each section the text may cite only the works on that section's library list. It writes `[[CITE:id|pages]]`; the server checks the id and the pages against the list and the references file and drops anything not listed. The page numbers the notes and shows the references (Chicago author-date). Web sources found by search become numbered notes too. A writer is introduced, then named by surname; some are mentioned by note only; the author's own work is never named.
- **Media.** A reply may show one listed video, image or web page by writing `[[MEDIA:id]]` on its own line. The page plays a video whose embedding was checked, shows an image whose licence was cleared with its credit, and shows anything else as a card that opens a new tab.

## The voice of the paper

`intertext-paper/config.js` adapts the same voice to a text whose subject is InterText itself. The text speaks as the paper, in the third person, about InterText, its readers, authors and models. When the reader's question invites it, a reply may say once that the reader is reading through InterText; it never describes itself or how it was produced. It describes the system as the paper and its fund do, and says that its testing so far has been with synthetic readers.

## The author's style

The system prompts name no author and impose no house style. A text may supply a style sample, a few passages of its author's prose chosen by the author; the revision pass is then told to bring each reply's sentences toward them, in length, rhythm, diction and the way a claim is qualified, and to take no content from them. The paper's InterText uses five passages of the paper. *The Digital Plenitude* uses none for now: its replies already retell the author's prose closely.

## How the work is organized

Each section has two editorial layers, described in `EDITORIAL-ARCHITECTURE.md`:

- a **narrative spine**, the concise route through the section, divided into stable passages; and
- a **fund** of optional clarifications, examples, qualifications, counterarguments, evidence and extensions, each anchored to a passage.

The fund is not a checklist. The text offers an entry only where it helps the reader's question without damaging the movement, and leaving the fund unused is often right. Only accepted entries ever reach readers.

## How readings change the work

The text conducts a reading but makes no permanent decision during it. When a contributing reader finishes, two editorial model passes run: a proposal (revise the spine, add or revise a fund entry, attach a source, or change nothing) and an independent review (fidelity, relevance, duplication, prose, rhythm, sources, and whether each anchor is eligible at that point in the section). Approved changes become a new immutable version of the section; if nothing survives review the section is unchanged. A reader already in a section stays on the version they began with; the next reading receives the new one.

## The author's tools

A local, unauthenticated editor (`npm run editorial-preview`) shows every section of the text, lets the author edit spine prose and every fund field, add entries, set status, sources and threads, and publish an author revision as a new version. A synthetic reading can be run through the editorial passes without publishing (`npm run editorial-propose`) and reviewed in the editor. The editor is excluded from deployment.

## Synthetic readers

`synthetic-reader/` drives the real reading endpoint with an OpenAI model playing a reader (curious, skeptical, collaborative, general, student). The reader sees only what a human sees. Readings are an editorial instrument: transcripts and the readers' private reflections show where an argument is unclear, repetitive, overstated or hard to enter, and where the text's voice or pacing fails. They guide revision of the authored text, the instructions and the section structure; they do not stand in for observing real readers.

## Current limits

- The author editor cannot compare or restore versions, browse the full update history, or export with a button. A command-line export exists (`npm run editorial-kv -- export`).
- A fund entry may carry a `thread` (a stable name and an order); the text does not yet present a thread as a reader-visible path.
- The author editor is local only; there is no authenticated production editor.
