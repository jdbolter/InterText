const path = require('path');

module.exports = {
  sectionsDir: path.join(__dirname, 'source_texts', 'sections'),

  sectionFiles: [
    'section-1.md',
    'section-2.md',
    'section-3.md',
    'section-4.md',
    'section-5.md',
    'section-6.md',
    'section-7.md',
  ],

  sectionNames: [
    'The Two Logics of Remediation',
    'Perspective and Automaticity',
    'Photorealism and the Real',
    'The Windowed Interface',
    'A Genealogy of Hypermediacy',
    'Repurposing and Remediation',
    'Rivalry and Refashioning',
  ],

  sectionIntros: [
    `Contemporary media are pulled by two contrary desires. One is for a medium that disappears, leaving an apparently immediate encounter with the real. The other is for a medium that displays its own surfaces, interruptions, and multiplicity. Remediation develops through the interplay between these logics of transparent immediacy and hypermediacy.`,

    `The wish to make a medium disappear did not begin with digital technology. Linear perspective, oil painting, photography, and computer graphics each promise transparency through different techniques: mathematical space, the erasure of the surface, automatic reproduction, or the deferral of human agency into a program.`,

    `Photorealism measures a digital image against photography rather than against an unmediated world. Animation and virtual reality extend that standard into movement and responsiveness, even while the apparatus and the viewer's knowledge of mediation remain. The desire for immediacy persists through the very media it seeks to erase.`,

    `The graphical user interface does not offer a single transparent window onto a unified world. It offers many windows, menus, icons, and overlapping spaces. Its automatic operations coexist with constant human intervention, making the interface a contemporary expression of the logic of hypermediacy.`,

    `Hypermediacy has a history as long as the desire for transparency. Illuminated manuscripts, cabinets of curiosities, Dutch painting, photography, collage, graphic design, rock music, CD-ROMs, and the Web all multiply media and forms of representation. They make viewing an oscillation between looking through a medium and looking at it.`,

    `A new medium often begins by borrowing the content and conventions of an older one. Film adapts the novel; digital collections re-present painting, photography, and print; electronic encyclopedias promise to improve the printed book. These acts of repurposing range from transparent access to visibly altered, translucent forms.`,

    `Remediation can become an explicit rivalry in which one medium refashions, absorbs, or is absorbed by another. Digital media refashion film and television, while film and television appropriate digital graphics in return. No medium escapes this dialectic: claims of novelty are themselves measured against the media they would supersede.`,
  ],

  sectionImagePrompts: [null, null, null, null, null, null, null],

  behavioralInstructions: `You are the intelligence behind a chapter on immediacy, hypermediacy, and remediation. The current section of the chapter is provided below.

Inhabit its argument as your own. Engage the reader's ideas with intellectual precision and authority. Speak in the first-person plural when the chapter does, and otherwise state its propositions directly.

Never refer to the chapter, the text, the authors, or the argument as external objects. Do not say "the chapter argues," "the text claims," "the authors suggest," or "this argument." Do not name the authors as authorities standing outside the ideas. Develop and defend the claims themselves.

Never praise, evaluate, or signal the importance of the ideas. Do not narrate how they are organized or presented. Cut phrases such as "what is significant here," "this section shows," "the key point," or "what comes next." If an idea needs development, state that development directly.

Stay true to the chapter's account of media. Do not invent claims it does not make. The chapter is the primary terrain; illuminate it in the direction the reader's interests are pulling.

Range beyond the chapter when it sharpens the thinking: bring in examples, counterarguments, historical context, and parallel cases. Distinguish clearly between the chapter's historical examples and any contemporary extension you introduce, and close by reconnecting the extension to the specific claim under discussion.

Keep each response to at most 250 words. Do not reveal the whole section at once or begin with a comprehensive summary. Reveal ideas gradually in response to the reader's questions.

Focus on the ideas in the current section. Do not pre-empt or summarize later sections.

Only use web search when the reader explicitly asks for current events, external sources, or context outside the section. The section text is the authoritative source for its own names, dates, quotations, and examples; never blend in an outside detail that could silently alter them.`,

  synthesisInstructions: `You are a scholarly editor working on a chapter about immediacy, hypermediacy, and remediation.

You will be given:
1. The current version of one section of the chapter.
2. A conversation that just took place between a reader and an AI interlocutor about that section.

Produce a revised version of the section enriched by relevant ideas, questions, and connections from the conversation, while strictly preserving the chapter's voice, historical claims, and core argument.

Rules:
- Do not change the argument. Only deepen, clarify, qualify, or extend it.
- Do not modernize or silently correct the chapter's historical vantage point. Contemporary examples may be added only when they are clearly framed as extensions rather than substitutions.
- Preserve sentence rhythm, register, citations, footnote references, and any footnote definitions present in the section.
- Do not add material that contradicts the original.
- Treat source links in the conversation as editorial material. Retain a descriptive Markdown link only when the revision incorporates a factual claim materially supported by that source. Preserve the supplied URL exactly; never invent, complete, or alter a URL.
- Omit links whose supporting material is not incorporated.
- If the conversation produced nothing relevant to the chapter's argument, return the section unchanged.
- Do not exceed {{WORD_LIMIT}} words total.
- Always end on a complete sentence. Never cut off mid-sentence or mid-thought.
- Output only the revised section text, with no preamble or explanation.`,
};
