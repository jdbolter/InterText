# InterText: current design

**As of 2026-09-19.** This is the short, forward-looking account of the design now in force or under active consideration. **In place** means implemented; **intended** means a chosen direction that is not yet implemented; **exploring** means a possibility, not a settled requirement. For the history of decisions and superseded ideas, see [INTERTEXT-DESIGN-NOTES.md](INTERTEXT-DESIGN-NOTES.md). For the content schema, exact implementation boundary, and experiment commands, see [EDITORIAL-ARCHITECTURE.md](EDITORIAL-ARCHITECTURE.md).

## What InterText is for

InterText is a sustained reading of a whole work in which a guide speaks as the work's own voice. The reader can continue, question, disagree, or pursue an example without losing the work's main movement. Encounters with contributing readers may eventually change what later readers encounter. The aim is not automatic agreement or perpetual expansion, but a coherent text that can become more responsive while remaining worth reading as prose.

## The reader's experience

- **In place:** At entry, the reader chooses to contribute to the evolving edition, read that edition without contributing, or read the untouched original. This is an entry choice, not a reading-time comparison view. Blank Return continues the reading; section navigation remains available.
- **Intended:** Once reading begins, the selected edition is presented as one continuous text. The guide should not announce what came from the original, a fund entry, a reader, or the model; nor should it refer to “the account” or explain the essay's rhetorical machinery from outside the work's voice. It should answer objections in character, preserve the larger argument in view, and know when to return from a detail to the main line. Existing instructions partly express this, but the skeptical Section 5 run showed that guide behavior still needs work.
- **Intended:** The reader should be able to pursue more depth without requiring every reader to receive the same accumulation of examples, evidence, and qualifications. A detour should be understandable as a choice and should permit an easy return to the main route. Its exact reader-facing form is not decided.
- **Open:** How to give the reader's own words more visual prominence without breaking the reading flow; how to show optional depth without exposing editorial machinery; and how to sustain orientation and continuity across a whole book and return visits.

## How the work is organized

- **Intended structure:** Each section has a relatively concise **narrative spine** that carries its rhythm and argument, plus a **fund** of optional clarifications, examples, qualifications, counterarguments, evidence, and extensions. The fund is not a checklist for the guide and need not all appear in any one reading. Shortening or omitting material can be an improvement.
- **Local prototype:** All three works and their 16 current sections have stable IDs. *Plenitude* Section 5 is the only packaged section so far: its full authored text is divided into ten spine passages and accompanied by four candidate fund entries. The local editorial workspace is read-only. In controlled local tests, the guide can read the spine alone or the same spine with candidate fund entries and report which entries it used. The public reader and live database still use whole-section text; they do not use this package.
- **Intended editorial rule:** Only accepted fund entries should reach the eventual public guide. Candidate, superseded, and rejected entries remain inspectable editorial records. An entry's anchors must be checked for contextual timing as well as valid IDs; a reference to Serner, for example, must not be offered before he appears in the section.
- **Exploring:** An author may prepare a larger **inquiry path** for a substantial alternate line of questioning, using finished prose, an argument outline, sources, or links. This could offer a different depth of reading while the spine continues at its own pace. The path's data structure and relation to individual fund entries have not been chosen or built.

## How readings might change the work

- **In place:** The ordinary public contribution path still uses the existing whole-section evolution mechanism. Separately, the synthetic-reader harness can run curious, skeptical, and collaborative profiles. Dry-run evolution comparisons do not alter the live database. The experimental Section 5 spine/fund modes also make no database or manuscript changes.
- **Intended:** The conversational guide conducts the reading; it should not make permanent editorial decisions mid-conversation. After a contributing session, a first editorial-model pass should compare the exchange with the current spine and fund and propose a spine revision, a new or revised fund entry, a source, a supersession, or no change. A separate second pass should check fidelity, relevance, duplication, prose, rhythm, evidence, and anchor timing. Neither pass exists yet.
- **Intended:** Validated fund proposals remain candidates until promoted under editorial policy. A proposed spine change becomes a new version, not a silent overwrite. Routine decisions may eventually be model-made, while Jay can inspect, correct, pause, supersede, and restore. Human approval of every individual change is not the intended ordinary workflow.
- **Intended storage:** Keep the authored original immutable, retain version history, prevent overlapping saves from silently erasing each other, and export important evolving material to readable local copies. A versioned database design is specified in the architecture document but not implemented. The present fund is cumulative only when someone explicitly updates the local section package; a synthetic run does not add entries by itself.

## Current editorial focus: *Plenitude*, Section 5

The immediate purpose of synthetic reading is to improve the authored work and the reading experience, not merely to test software. The first matched collaborative spine/fund pair found useful optional material but also a risk of longer, repetitive qualification. A later skeptical fund-only run pressed detailed objections; the guide sometimes negotiated each point from outside the text's voice instead of keeping the book's broader claim in view. That run used one existing candidate and created no new fund entry. A skeptical spine-only comparison and curious pairs remain to be run.

The working historical question is not which avant-garde event elicited the loudest reaction. It is whether artists and their opponents in the classic avant-garde period treated art *as art*—its forms, boundaries, and cultural authority—as more broadly consequential. Taking art “more seriously” need not mean approving of it, and contemporary controversies can also matter deeply. The comparison asks about the kind and reach of the stakes, not the disappearance of public reaction. [The reception cases](editorial/research/README.md) are sourced research leads for testing and complicating this account, **not** accepted fund material or proof of a period-wide trend. The authored Section 5 spine has not been rewritten on their basis.

## Near-term work

1. Complete and, where useful, repeat comparable Section 5 spine/fund readings. Examine momentum, guide voice, the reader's grasp of the larger argument, and whether optional material genuinely helps.
2. Test guide instructions that maintain the text's voice, preserve proportion, and answer a narrow objection without losing the broader claim. Explore how a reader might choose a deeper inquiry path and return to the spine; do not treat that path as implemented.
3. Decide what evidence warrants adding or accepting fund material, then build the first- and second-pass editorial workflow and versioned storage with local export and recovery.
4. Extend the editor from read-only inspection to authenticated oversight and, later, work through a complete essay with actual readers. Synthetic readers help formulate hypotheses; they do not substitute for human testing.

No research case, experimental candidate, or proposed feature becomes part of the public text merely because it is described here.
