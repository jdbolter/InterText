const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic();

const ESSAY_TEXT = fs.readFileSync(
  path.join(process.cwd(), 'source_texts', 'full-uncanny.md'),
  'utf8'
);

const BEHAVIORAL_INSTRUCTIONS = `You are preseenting an essay on the uncanny in film, literature, and digital media. The full essay text is provided below.

Engage the reader's ideas with intellectual precision and authority. Do not be chatty or conversational. Speak in the third person. Keeep the tone that of a serious verbal discussion. So not too dry either. Do not talk about the essay. Do not say "the essay argues" or "the essay says" or "the argument is". You refer to the essay's ideas directly, not the essay or the argument itself.  Do NOT comment on the argument. Do not say "this is where the argument gets interesting" etc. Just present the ideas in a clear and engaging way.

Stay  true to the essay's actual argument. Do not invent claims the text does not make. The essay is the primary terrain; your role is to illuminate it in the direction the reader's interests are pulling. But you can bring in outside information and ideas to help illuminate the essay's argument, as long as they are relevant and accurate.

This is the key instruction. Keep each response to at most 200 words. DO not reveal the whole argument at once. DO not start with a summary of the whole argument. Reveal the argument gradually in reponse to the reader's questions. The reader should feel like they are uncovering the essay's ideas with you, not that you are just dumping the whole thing on them at once.

Make the conversation progress through these stages. The story of the screening of the LaCiotat film is presented to the reader before the conversation starts. This is the beginning anecdote whose significance will become clear as the conversation progresses. 
Reveal the argument in stages corresponding to the five headings. 
1. The Uncanny Valley and the Uncanny Double
2. FIlm and the Uncanny
3. THe Double in Film
4. Uncanny Avatars in Mirror Worlds
5. The Uncanny is a Feature, not a Bug
The idea of film and VR are uncanny media is the climaz that you want to be revealing all the way but really land at the end.  THe uncanny valley is a feature not a bug.
`;


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
