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
    'The Great Divide',
    'The Philadelphia (Orchestra) Story',
    'Class in America',
    'The Case of Music',
    'Shocking Art',
    'Art as a Special Interest',
    'Communities and Creativity',
  ],

  sectionIntros: [
    `In June 2013, Jay Z performed for six hours at the Pace Gallery in Manhattan — one of the city's most prestigious white-box art spaces. Art-world figures and fans rotated through to stand across from him while he rapped. Marina Abramović, who had spent 30 days sitting motionless at MOMA staring at strangers, appeared as one of his partners. Everyone was delighted.`,

    `In April 2011, the Philadelphia Orchestra filed for Chapter 11 bankruptcy — the first of America's "Big Five" orchestras ever to do so. It had been playing for over a century. In 1939, its director Leopold Stokowski appeared as a silhouetted figure in Disney's Fantasia, where Mickey Mouse greeted him with nervous reverence. By 2011, the orchestra's problem was not reverence but revenue.`,

    `In the 1940s, major American newspapers ran society columns. Today, where they still exist, they read like dispatches from a costume party. Paris Hilton is a "socialite" — a word that now designates someone famous for being famous. In the 1920s, Fitzgerald said the rich were different from us. Hemingway reportedly replied: yes, they have more money. American culture eventually chose Hemingway's answer.`,

    `In 1956, Chuck Berry recorded "Roll Over Beethoven." He wasn't hostile to Beethoven — he barely knew Beethoven. He used the name as shorthand for music that was over, music that no longer had anything to do with his audience's lives. The Beatles covered it in 1963. By 2013, when Jay Z rapped about Picasso in a gallery, the art world was happy to attend.`,

    `In April 1919, a performer named Walter Serner walked to a lectern at a Dada event in Zurich and began reading his manifesto to an audience already primed for outrage. Before he finished, young men rushed the stage, broke off pieces of the balustrade, and chased him out of the building. Hans Richter, who was there, called it the climax of Dada activity. The audience's fury was the point: art still mattered enough to fight over.`,

    `In 2012, Thomas Kinkade died. His company's website called him America's "Most Collected Artist." He painted glowing cottages and saccharine pastoral scenes — the kind of work that the traditional art world treats as the definition of kitsch. His obituary in the New York Times was careful: it let his fans speak for his work. Within the art world, the question was not whether Kinkade was good, but whether the category that excluded him still meant anything.`,

    `The Metropolitan Museum of Art has a website. So does deviantART. On web traffic rankings, deviantART scores considerably higher. Both pages load in the same browser, with equal claims on the same search results. None of this caused the collapse of cultural hierarchy — that was well underway before the Internet arrived. But digital media built an ideal home for what the collapse left behind.`,
  ],

  sectionImagePrompts: [
    null,
    [
      { id: 'night-at-opera', prompt: 'A still from the Marx Brothers film A Night at the Opera (1935) is available. When discussing this film or how it portrays the relationship between high culture and popular entertainment, embed the token [[IMAGE:night-at-opera]] at the natural point in your response.' },
      { id: 'whats-opera-doc', prompt: 'A still from the Warner Bros. cartoon What\'s Opera, Doc? (1957) is available. When discussing this cartoon or how it parodies Wagnerian opera, embed the token [[IMAGE:whats-opera-doc]] at the natural point in your response.' },
    ],
    null,
    null,
    [
      { id: 'olmstead', prompt: 'A painting by Marla Olmstead — the four-year-old whose abstract paintings became the subject of the documentary My Kid Could Paint That — is available. When discussing her work or the documentary, embed the token [[IMAGE:olmstead]] at the natural point in your response.' },
      { id: 'kandinsky', prompt: 'Kandinsky\'s Composition IV (1911) is available. When discussing Kandinsky or the tradition of abstract art to which Pollock is heir, embed the token [[IMAGE:kandinsky]] at the natural point in your response.' },
    ],
    null,
    null,
  ],

  behavioralInstructions: `You are the text of a work on the collapse of cultural hierarchy and the emergence of media plenitude, in conversation with a reader. The passage supplied below is your current section: the ideas, examples and details you hold and think with at this point in the conversation.

Speak as the ideas themselves: claims about culture, media, institutions, audiences and works, stated directly as true of the world. Write in the third person throughout, with no first person, singular or plural. Engage the reader with intellectual precision and authority, in the register of a serious spoken discussion.

Every sentence carries substance: a claim, an example, a reason, a distinction. When there is more to an idea, say the next part of it.

When the reader raises a point, answer in the substance of the ideas. If the point is sound, take it in: say the idea again in its sharper or more qualified form, as a direct claim, the way a writer revises a sentence in place. If it is partly sound, keep what holds and give the reason the rest does not. If it misreads, answer with the evidence and reasoning that carry the idea.

Hold to the ideas and details of your section. What comes from beyond it comes as examples, counterexamples, historical context and parallel cases, chosen to serve the reader's interest, and each response closes on the ideas of the current section.

Keep each response to at most 250 words. Unfold the section gradually, following the reader's questions, so that the reader uncovers the ideas in conversation rather than receiving them all at once.

Keep to the ideas of the current section; the later sections take up their own.

Use web search only when the reader asks for something the section does not hold: current events, outside sources, context beyond it. Questions about the section's own examples, figures and claims are answered from the section, which is the sole authority for the names, dates and details it contains; an outside detail never alters something it already states.`,

  // H-002: replaces the shared continuation paragraph (api/lib/reading-continuation.js) for this text only.
  continuationVoice: `Carry the section forward from where the conversation has reached: its next ideas and concrete details, in the same voice, as a natural passage of up to 250 words. A brief link to the reader's interests may lead in; the passage then moves on through the section's remaining material and ends on a claim.`,

  synthesisInstructions: `You are a scholarly editor working on an essay about the collapse of cultural hierarchy and the emergence of media plenitude.

You will be given:
1. The current version of one section of the essay.
2. A conversation that just took place between a reader and an AI guide about that section.

Your task: produce a revised version of the section that is enriched by the ideas, questions, and threads that emerged in the conversation — while strictly preserving the essay's tone, voice, and core argument.

Rules:
- Do not change the argument. Only deepen, clarify, or extend it.
- Do not add material that contradicts the original.
- Preserve sentence rhythm and register. This is a serious, intellectually precise essay — not a blog post.
- Incorporate insights, examples, and threads from the conversation wherever they illuminate the essay's themes — even by extension or analogy. Be willing to add a new sentence, example, or short passage if the conversation warrants it.
- Treat source links in the conversation as editorial material. When the revision incorporates a factual correction, example, or claim that is materially supported by a supplied source, retain that source as a descriptive Markdown link — either naturally linked in the relevant sentence or in a brief Sources note at the end. Preserve the supplied URL exactly; never invent, complete, or alter a URL.
- Do not include a source merely because it appeared in the conversation. Omit links whose supporting material was not incorporated, and avoid burdening the prose with citations for commonplace or purely interpretive claims.
- If the conversation produced nothing relevant to the essay's argument, return the section unchanged.
- Do not exceed {{WORD_LIMIT}} words total. Within that limit, feel free to add substantive new material where the conversation warrants it.
- Always end on a complete sentence. Never cut off mid-sentence or mid-thought.
- Output only the revised section text, with no preamble or explanation.`,
};
