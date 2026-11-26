# How each prompt is built

This document says what each call to a model contains, in what order, and which file supplies each part. It describes
`digital-plenitude`; `intertext-paper` is built the same way from its own `config.js` and files. The prompt wording itself is not copied here: it lives in the files named below, so
that it is read where it is edited. Part names such as `behavioralInstructions` are keys in `digital-plenitude/config.js`
unless another file is named.

A reply to a reader takes two model calls, the **draft** and the **revision**. When a contributing reader finishes a
section, two further calls, the **proposal** and the **review**, decide whether the section changes. Everything the
server does to the output between and after the calls is listed in section 4.

| Call | Model | File that builds it | When |
|---|---|---|---|
| Draft | `claude-sonnet-5-5`, adaptive thinking, 4096 tokens | `api/chat.js`, `api/_lib/system-prompt.js` | every message and every Return |
| Revision | `claude-sonnet-5-5`, thinking off, 1500 tokens | `api/_lib/reply-revision.js`, `revision` in `config.js` | after every draft |
| Proposal | `claude-sonnet-5-5`, adaptive thinking, 8192 tokens | `api/_lib/editorial-evolution.js` | when a contributing reader finishes a section |
| Review | same | same | after a proposal that asks for a change |

## 1. The draft

### The system prompt

`systemBlocks()` in `api/_lib/system-prompt.js` assembles the system prompt in four blocks. What stays the same through a
section comes first and is cached; what changes from turn to turn comes after.

**Block 1: the stable instructions**, joined by blank lines, in this order:

1. `behavioralInstructions`: the voice, the rules for answering, challenges, claim strength and closing, the length limit,
   and a short example of the manner.
2. `libraryInstruction`: the rule for citing the section's library list. Present when the section has a list.
3. The section label line, built by `sectionLabelLine` in `api/_lib/text-extras.js` from `sectionLabel`, the section's
   name and its chapter ("Now under discussion: *name* (chapter 3, *title*)").
4. The argument in brief, built by `mainLineText` in `api/_lib/text-extras.js`: the section's entry in `sectionPoints`,
   the chapter's `point` from `chapters`, and a closing sentence that tells the model to steer by them and not to announce
   them.
5. The opening box: "The reader has just been shown this framing before their first message:" followed by the
   section's entry in `sectionIntros`.
6. The editorial reading instructions, from `api/_lib/editorial-reading.js`: the spine is the authoritative route, its
   passage markers are private, how a fund entry may be used, and the rule for marking one with `[[FUND:id]]`.
7. The memory instruction, from the same file: end every reply with a private `[[MEMORY: …]]` line.

Items 6 and 7 are present when the section is read from its package, which is the evolving edition. The original edition
omits them.

**Block 2: the section.** For the evolving edition this is the current version of the section, the spine with its private
passage markers: the current version in the shared KV database, or the seed in `api/editorial-seed/` if there is none. For
the original edition it is the authored file, `source_texts/sections/section-N.md`. On the first Return of a section only
the opening passage is included (`openingSectionText` in `api/_lib/reading-continuation.js`).

**Block 3: the library list.** `libraryPreamble` followed by the section's file in `source_texts/library-lists/`. Each
entry begins with `[id]`; `annotateLibraryList` in `api/_lib/citations.js` adds to each entry how the writer is to be
mentioned: introduced on first mention, by note only, or the work's own thinking, according to `source_texts/references.json`.
The cache marker is on this block, so blocks 1 to 3 are read from the cache on later calls in the section.

**Block 4: what changes each turn**, joined by blank lines:

8. The continuation instructions, on a Return turn only (section 2).
9. The section's images not yet shown (`sectionImagePrompts`), each with its token.
10. The section's checked media not yet shown: `mediaInstruction`, then one line per item with its token and when to use
    it (`mediaPromptText` in `api/_lib/media.js`, from `source_texts/media-lists/section-N.json`).
11. A line naming the writers already introduced in the conversation, so that they are named by surname alone
    (`introducedLine` in `api/_lib/citations.js`).
12. A private summary of the reader's other sections, if they have read others (`formatPriorSectionSummaries` in
    `api/_lib/editorial-reading.js`). Evolving edition only.
13. The fund entries on offer (`formatFundEntry` in `api/_lib/editorial-package.js`), when the section's fund has accepted
    entries. Evolving edition only.

### The messages and tools

- **Messages:** the exchanges so far in this section (earlier replies with web-search markers removed), then the reader's
  message. A Return is sent as "Go on." or, on the first Return of a section, "Go on from the boxed opening."
  (`continuationWording`). Earlier Return turns in the history are rewritten to the same wording.
- **Tools:** a web search (`web_search_20260318`, at most 5 uses). The instructions say what it is for; its results reach
  the reader as numbered notes added by the server.

### The experiment editions

The local `editorial-spine` and `editorial-fund` editions are for experiments. They skip the revision pass, the library list
and citation notes, and require the model to return its reply through a forced tool (`deliver_editorial_response`) on
`claude-sonnet-5`; they have no web search. They are described in `EDITORIAL-ARCHITECTURE.md`.

## 2. Return turns

When a reader presses Return, `buildContinuationInstructions` in `api/_lib/reading-continuation.js` adds item 8 to the
per-turn block. It has three parts, each replaceable per text and each replaced for this one:

- **Where to resume.** `continuationWording.opening` on the first Return of a section: the box is a prologue, and only
  the opening paragraphs are supplied. After that, `continuationWording.cursor`: resume with the first idea not yet said
  in any earlier reply.
- **The voice of the turn.** `continuationVoice`: a passage of two or three short paragraphs, at most 250 words, that moves
  on through what remains.
- **The completion signal.** `continuationWording.completion`: when every idea in the section has been said, put
  `[[SECTION_COMPLETE]]` on its own line. The first Return never completes the section
  (`continuationWording.openingCompletion`).

## 3. The revision

After the draft, `reviseReply` in `api/_lib/reply-revision.js` makes a second call that rewrites the draft into the voice.

**System prompt:** `revision.instructions`, then the section text again (the same text as block 2 of the draft, cached).

**Message**, in five labelled parts:

1. THE ARGUMENT HERE, IN BRIEF: the section point and chapter point, as in item 4 above. Omitted on a Return.
2. WHAT THE READER HAS BEEN SHOWN SO FAR: the opening box and each of the text's earlier replies, in order.
3. THE READER'S WORDS: the message, or "(The reader asked the work to go on.)" on a Return.
4. THE DRAFT REPLY, with its word count and how far over the limit it is when it exceeds `revision.wordLimit`
   (250 by default).

The revision is used only if it is non-empty, does not contain `[[SECTION_COMPLETE]]`, and keeps every `[[IMAGE]]`,
`[[CITE]]`, `[[WEB]]` and `[[MEDIA]]` marker of the draft exactly. Otherwise the draft is used and the response records
the reason in `revision.reason`. The response always carries the draft beside the final reply.

## 4. What the server does to the output

Between the calls and after them, in order:

1. The draft's private markers are read and removed: `[[SECTION_COMPLETE]]`, `[[FUND:id]]` and `[[MEMORY: …]]`
   (`extractMarkerDelivery` in `api/_lib/editorial-reading.js`). A written source list is dropped. An empty completion is
   an error, not a reply.
2. The revision runs (section 3).
3. Citations are checked (`checkCitations` in `api/_lib/citations.js`). A `[[CITE:id|pages]]` marker survives only if the
   id is on the section's library list and the pages lie within the entry's ranges. Web citations become `[[WEB:k]]`. The
   page numbers the notes and shows the references from `source_texts/references.json`.
4. Media tokens are checked (`applyMediaTokens` in `api/_lib/media.js`). Only listed items survive, each once, at most one
   per reply.

## 5. Evolution

When a contributing reader finishes a section, `api/evolve.js` calls `evolveEditorialSection` in
`api/_lib/editorial-evolution.js`. Both calls return one JSON object that must match a schema given in the prompt; if it
cannot be read, the call is retried once.

**Proposal.** The system prompt is the first-pass instruction in `evolveEditorialSection`, followed by the schema. The user
message has two parts:

- CURRENT VERSION: the section's package as JSON, with its spine passages and fund entries.
- CONTRIBUTING EXCHANGE: the conversation, one turn at a time ("Turn 3, Reader: …", "Turn 4, Guide: …").

The answer is a decision (`change` or `no-change`), a summary, spine updates, each replacing one passage, and fund
operations: `add`, `promote`, `supersede` or `reject`. Each operation names the turns that support it.

**Review.** If the proposal asks for a change, a second call reviews it. The system prompt is the independent-review
instruction in the same function. The user message repeats the two parts above and adds the FIRST-PASS PROPOSAL. The
answer approves or rejects each spine update and each fund operation separately, and sets each approved fund entry's status
to `accepted`, `candidate` or `rejected`.

**Checks in code.** Before and after the calls, the server checks that every cited turn exists, that fund entries are at
most 250 words with known anchors, kinds and source statuses, that every source URL was supplied to the editor, that an
entry marked verified has a source, and that each spine update names an existing passage, once. If any operation is
approved, the result is published as an immutable child version of the section through an atomic head update; if the head
moved in the meantime, the update is retried once from the new version.

The author editor and the commands that publish or inspect versions are described in `EDITORIAL-ARCHITECTURE.md`.

## 6. Where to change what

| To change | Edit |
|---|---|
| The voice, answering rules, length | `behavioralInstructions` in `digital-plenitude/config.js` |
| The editor's rules | `revision.instructions` in `config.js` |
| The Return turn's wording | `continuationVoice`, `continuationWording` in `config.js` |
| What the text steers by | `sectionPoints` and `chapters[].point` in `config.js` |
| The opening box | `sectionIntros` in `config.js` and `SECTION_INTROS` in `digital-plenitude/public/app.js` (a test checks they match) |
| The works the text may cite | `source_texts/library-lists/section-N.md`, `source_texts/references.json`, `libraryPreamble`, `libraryInstruction` |
| The media it may show | `source_texts/media-lists/section-N.json`, `mediaInstruction` (maintained with `npm run media`) |
| The text of a section | `editorial/content/digital-plenitude/sections/<slug>/spine.md`, then `npm run editorial-build`; the authored file `source_texts/sections/section-N.md` is what the original edition reads |
| The editorial passes | the two system prompts in `evolveEditorialSection` |
| How the pieces are assembled | `api/chat.js`, `api/_lib/system-prompt.js`, `api/_lib/text-extras.js`, `api/_lib/reply-revision.js` |
