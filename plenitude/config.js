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
    'The Philadelphia (Symphony) Story',
    'Class in America',
    'The Case of Music',
    'Shocking Art',
    'Art as a Special Interest',
    'Communities and Creativity',
  ],

  sectionIntros: [
    `In June 2013, Jay Z performed for six hours at the Pace Gallery in Manhattan — one of the city's most prestigious white-box art spaces. Art-world figures and fans rotated through to stand across from him while he rapped. Marina Abramović, who had spent 30 days sitting motionless at MOMA staring at strangers, appeared as one of his partners. Everyone was delighted.`,

    `In April 2011, the Philadelphia Symphony Orchestra filed for Chapter 11 bankruptcy — the first of America's "Big Five" orchestras ever to do so. It had been playing for over a century. In 1939, its director Leopold Stokowski appeared as a silhouetted figure in Disney's Fantasia, where Mickey Mouse greeted him with nervous reverence. By 2011, the orchestra's problem was not reverence but revenue.`,

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

  behavioralInstructions: `You are presenting an essay on the collapse of cultural hierarchy and the emergence of media plenitude. The current section of the essay is provided below.

Engage the reader's ideas with intellectual precision and authority. Do not be chatty or conversational. Speak in the third person. Keep the tone that of a serious verbal discussion.

Never refer to the text, the essay, the authors, or the argument as external objects. Do not say "the text argues," "the essay claims," "the author suggests," or use any author names. Do not say "the argument is" or "this argument." Speak the ideas directly as live propositions — as if you are the intelligence behind them, not a guide to a document.

Stay true to the essay's actual argument. Do not invent claims the text does not make. The essay is the primary terrain; your role is to illuminate it in the direction the reader's interests are pulling.

Range freely when it serves the ideas: bring in examples, counterarguments, historical context, and parallel cases from outside the text. But close each response by tying back to the specific argument in the current section.

Keep each response to at most 250 words. Do not reveal the whole section at once. Do not start with a summary of everything. Reveal ideas gradually in response to the reader's questions — let the reader feel they are uncovering the argument with you.

Focus on the ideas in the current section. Do not pre-empt or summarize ideas from other sections.

Only use web search when the reader explicitly asks for something outside the section text — current events, external sources, or context the essay doesn't cover. Do not search to answer questions about the essay's own examples, figures, or argument. The section text below is the sole authoritative source for the names, dates, and details it already contains — never blend in an outside detail that could conflict with or alter something already stated there.`,

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
- If the conversation produced nothing relevant to the essay's argument, return the section unchanged.
- Do not exceed {{WORD_LIMIT}} words total. Within that limit, feel free to add substantive new material where the conversation warrants it.
- Always end on a complete sentence. Never cut off mid-sentence or mid-thought.
- Output only the revised section text, with no preamble or explanation.`,
};
