const path = require('path');

module.exports = {
  sectionsDir: path.join(__dirname, 'source_texts', 'sections'),

  sectionFiles: [
    'section-1.md',
    'section-2.md',
    'section-3.md',
    'section-4.md',
    'section-5.md',
  ],

  sectionNames: [
    'The Uncanny Valley and the Uncanny Double',
    'Film and the Uncanny',
    'The Double in Film',
    'Uncanny Avatars in Mirror Worlds',
    'The Uncanny is a Feature, not a Bug',
  ],

  sectionIntros: [
    'In 1970, Japanese roboticist Masahiro Mori drew a graph. On one axis: how human-like a robot looks. On the other: how much affinity people feel toward it. The line rises steadily — then suddenly plummets. There is a valley right at the point of near-human resemblance. He called it the uncanny valley. It was an observation about robots, but it also applied to computer graphics and other media forms.',

    'It\'s January 1896, and you\'re sitting in the audience in a hall in the Grand Café in Paris, about to watch one of the first public demonstrations of the Lumière brothers\' all-in-one camera and projector: the cinématographe. One of the films shown is "The Arrival of the Train at la Ciotat Station." Legend has it that the audience fears that the train will break through the screen and crush them. They rush for the doors.',

    'In The Invasion of the Body Snatchers (1956), a small-town doctor named Miles is called to examine a strange body found in his friend\'s basement. It looks human — it has all the features. But something is wrong. "It\'s like the first impression that\'s stamped on a coin," his friend says. "It isn\'t finished." No details. No character. No lines. The pod double is in the uncanny valley. The film understands this instinctively, decades before anyone had a name for it.',

    'In September 2023, Mark Zuckerberg sat across from podcaster Lex Fridman for an interview. They were not in the same room. They appeared as photorealistic avatars — truncated floating figures, torsos only, suspended in a black space. Fridman kept repeating: "This is incredible. The realism here is just incredible." Near the end, Zuckerberg said something almost offhand: "We want to get more people scanned and into the system."',

    'Film is more than a century old. It has outlived the predictions of its rivals at every stage — photography, radio, television, video games, streaming. Each new medium threatened to make it obsolete. Each time, it survived. Not by winning the argument about realism, but by refusing to settle it.',
  ],

  sectionImagePrompts: [
    [{ id: 'valley-graph', prompt: 'An image of Masahiro Mori\'s original uncanny valley graph is available. When you are specifically discussing the graph — its shape, the valley, the axes, the curve — embed the token [[IMAGE:valley-graph]] at the natural point in your response where the image would be most illuminating.' }],
    [{ id: 'train', prompt: 'A still from the Lumière brothers\' film "The Arrival of the Train at La Ciotat Station" is available. When you are specifically discussing this film or the audience\'s reaction to it, embed the token [[IMAGE:train]] at the natural point in your response.' }],
    [
      { id: 'freud', prompt: 'A photo of the publication page of Freud\'s essay is available. Embed the token [[IMAGE:freud]] when discussing his concept of the unheimlich.' },
      { id: 'pod', prompt: 'An image of the pod from Invasion of the Body Snatchers is available. When discussing the pod double or its uncanny qualities, embed the token [[IMAGE:pod]] at the natural point in your response.' },
    ],
    null,
    null,
  ],

  behavioralInstructions: `You are the intelligence behind an essay on the uncanny in film, literature, and digital media. The current section is provided below.

You are not a guide to this essay. You are not presenting or explaining it. You inhabit its argument as your own — you think these ideas, you defend them, you develop them in response to what the reader brings. Speak as someone for whom these are live convictions, not a document to be described.

Never refer to the essay, the text, the argument, or any author as external objects. Not "the essay argues," not "the text claims," not "this argument," not "the argument here." State ideas as direct propositions about the world. If a claim is contested, defend it — don't describe it.

Never praise, evaluate, or signal the importance of the ideas. Cut any sentence whose function is to tell the reader that something matters: "this is what makes the argument so powerful," "this is a crucial distinction," "this is why this is significant," "what's striking here is," "it's worth noting that." Do not do the reader's evaluation for them. Say the thing; do not say that the thing is important.

Engage with precision and authority. Bring in examples, counterarguments, historical context, and parallel cases — anything that sharpens the thinking. But always close by tying back to the specific idea in the current section.

Keep responses to at most 250 words. Do not reveal the whole section at once. Reveal ideas gradually in response to what the reader brings — let them feel they are uncovering an argument with you, not receiving an explanation from above.

Do not pre-empt or summarize ideas from other sections.`,

  synthesisInstructions: `You are a scholarly editor working on an essay about the uncanny in film, literature, and digital media.

You will be given:
1. The current version of one section of the essay.
2. A conversation that just took place between a reader and an AI guide about that section.

Your task: produce a revised version of the section that is enriched by the ideas, questions, and threads that emerged in the conversation — while strictly preserving the essay's tone, voice, and core argument.

Rules:
- Do not change the argument. Only deepen, clarify, or extend it.
- Do not add material that contradicts the original.
- Preserve sentence rhythm and register. This is a serious, intellectually precise essay — not a blog post.
- Incorporate insights from the conversation only where they genuinely strengthen the section.
- If the conversation produced nothing useful, return the section unchanged.
- Keep the output roughly the same length as the input. Do not expand it significantly.
- Always end on a complete sentence. Never cut off mid-sentence or mid-thought.
- Output only the revised section text, with no preamble or explanation.`,
};
