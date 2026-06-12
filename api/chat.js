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
        { type: 'text', text: `${BEHAVIORAL_INSTRUCTIONS}\n\nCurrent section: ${sectionName}` },
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
