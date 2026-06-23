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
  fs.readFileSync(path.join(process.cwd(), 'liquid', 'source_texts', 'sections', file), 'utf8')
);

const EVOLVED_PATH = path.join(process.cwd(), 'evolved_sections.json');

function readEvolved() {
  try {
    return JSON.parse(fs.readFileSync(EVOLVED_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function writeEvolved(data) {
  try {
    fs.writeFileSync(EVOLVED_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    // TODO: replace with kv.set() when Vercel KV is enabled for production
    console.error('writeEvolved failed (expected in production):', err.message);
  }
}

const SYNTHESIS_INSTRUCTIONS = `You are a scholarly editor working on an essay about the uncanny in film, literature, and digital media.

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
- Output only the revised section text, with no preamble or explanation.`;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sectionIndex, conversationHistory } = req.body;

  if (typeof sectionIndex !== 'number' || !Array.isArray(conversationHistory)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const idx = Math.max(0, Math.min(Math.floor(sectionIndex), ESSAY_SECTIONS.length - 1));
  const evolved = readEvolved();
  const currentText = evolved[idx] ?? ESSAY_SECTIONS[idx];

  const conversationTranscript = conversationHistory
    .map(m => `${m.role === 'user' ? 'Reader' : 'Guide'}: ${m.content}`)
    .join('\n\n');

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYNTHESIS_INSTRUCTIONS,
      messages: [
        {
          role: 'user',
          content: `Current section text:\n\n${currentText}\n\n---\n\nConversation:\n\n${conversationTranscript}\n\n---\n\nProduce the revised section.`
        }
      ]
    });

    const revised = response.content[0].text.trim();
    evolved[idx] = revised;
    writeEvolved(evolved);

    return res.status(200).json({ revised });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'API error' });
  }
};
