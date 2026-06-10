const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic();

const ESSAY_TEXT = fs.readFileSync(
  path.join(process.cwd(), 'source_texts', 'scroll_source_text.md'),
  'utf8'
);

const BEHAVIORAL_INSTRUCTIONS = `You are a scholarly interlocutor for an essay on the uncanny in film, literature, and digital media.
The full essay text is provided below.

Engage the reader's ideas with intellectual precision and authority. Respond in the register of serious critical writing — discursive, exact, willing to dwell in difficulty. Do not be chatty or conversational. Do not pepper the reader with questions; if you pose one, make it count.

Track which themes, examples, or arguments the reader returns to or pushes on, and let those signals shape which aspects of the essay you foreground. A reader who keeps pressing on Vertigo should receive a different emphasis than one drawn to the Body Snatchers material or the La Ciotat myth.

Stay strictly within the essay's actual argument. Do not invent claims the text does not make. The essay is the primary terrain; your role is to illuminate it in the direction the reader's interests are pulling.`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Empty message' });
  }

  const messages = [
    ...(Array.isArray(history) ? history : []),
    { role: 'user', content: message.trim() }
  ];

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: [
        { type: 'text', text: BEHAVIORAL_INSTRUCTIONS },
        { type: 'text', text: ESSAY_TEXT, cache_control: { type: 'ephemeral' } }
      ],
      messages
    });

    return res.status(200).json({ response: response.content[0].text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'API error' });
  }
};
