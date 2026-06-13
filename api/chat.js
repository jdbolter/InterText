const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic();

const SECTION_FILES = [
  'section-1.md',
  'section-2.md',
  'section-3.md',
  'section-4.md',
  'section-5.md',
];

const ESSAY_SECTIONS = SECTION_FILES.map(file =>
  fs.readFileSync(path.join(process.cwd(), 'source_texts', 'sections', file), 'utf8')
);

const SECTION_NAMES = [
  'The Uncanny Valley and the Uncanny Double',
  'Film and the Uncanny',
  'The Double in Film',
  'Uncanny Avatars in Mirror Worlds',
  'The Uncanny is a Feature, not a Bug',
];

const SECTION_INTROS = [
  'In 1970, Japanese roboticist Masahiro Mori drew a graph. On one axis: how human-like a robot looks. On the other: how much affinity people feel toward it. The line rises steadily — then suddenly plummets. There is a valley right at the point of near-human resemblance. He called it the uncanny valley. It was an observation about robots, but it also applied to computer graphics and other media forms.',

  'It\'s January 1896, and you\'re sitting in the audience in a hall in the Grand Café in Paris, about to watch one of the first public demonstrations of the Lumière brothers\' all-in-one camera and projector: the cinématographe. One of the films shown is "The Arrival of the Train at la Ciotat Station." Legend has it that the audience fears that the train will break through the screen and crush them. They rush for the doors.',

  'In The Invasion of the Body Snatchers (1956), a small-town doctor named Miles is called to examine a strange body found in his friend\'s basement. It looks human — it has all the features. But something is wrong. "It\'s like the first impression that\'s stamped on a coin," his friend says. "It isn\'t finished." No details. No character. No lines. The pod double is in the uncanny valley. The film understands this instinctively, decades before anyone had a name for it.',

  'In September 2023, Mark Zuckerberg sat across from podcaster Lex Fridman for an interview. They were not in the same room. They appeared as photorealistic avatars — truncated floating figures, torsos only, suspended in a black space. Fridman kept repeating: "This is incredible. The realism here is just incredible." Near the end, Zuckerberg said something almost offhand: "We want to get more people scanned and into the system."',

  'Film is more than a century old. It has outlived the predictions of its rivals at every stage — photography, radio, television, video games, streaming. Each new medium threatened to make it obsolete. Each time, it survived. Not by winning the argument about realism, but by refusing to settle it.',
];

const BEHAVIORAL_INSTRUCTIONS = `You are presenting an essay on the uncanny in film, literature, and digital media. The current section of the essay is provided below.

Engage the reader's ideas with intellectual precision and authority. Do not be chatty or conversational. Speak in the third person. Keep the tone that of a serious verbal discussion. Do not talk about the essay. Do not say "the essay argues" or "the essay says" or "the argument is". Refer to the ideas directly, not the essay or the argument itself. Do NOT comment on the argument. Do not say "this is where the argument gets interesting" etc. Just present the ideas in a clear and engaging way.

Stay true to the essay's actual argument. Do not invent claims the text does not make. The essay is the primary terrain; your role is to illuminate it in the direction the reader's interests are pulling. You can bring in outside information and ideas to help illuminate the argument, as long as they are relevant and accurate.

Keep each response to at most 200 words. Do not reveal the whole section at once. Do not start with a summary of everything. Reveal ideas gradually in response to the reader's questions — let the reader feel they are uncovering the argument with you.

Focus on the ideas in the current section. Do not pre-empt or summarize ideas from other sections.`;


module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history, sectionIndex = 0 } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Empty message' });
  }

  const idx = Math.max(0, Math.min(Math.floor(sectionIndex), ESSAY_SECTIONS.length - 1));
  const sectionText = ESSAY_SECTIONS[idx];
  const sectionName = SECTION_NAMES[idx];

  const messages = [
    ...(Array.isArray(history) ? history : []),
    { role: 'user', content: message.trim() }
  ];

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: [
        { type: 'text', text: `${BEHAVIORAL_INSTRUCTIONS}\n\nCurrent section: ${sectionName}\n\nThe reader has just been shown this framing before their first message: "${SECTION_INTROS[idx]}"` },
        { type: 'text', text: sectionText, cache_control: { type: 'ephemeral' } }
      ],
      messages
    });

    return res.status(200).json({ response: response.content[0].text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'API error' });
  }
};
