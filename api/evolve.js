const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic();

const ALLOWED_TEXT_IDS = ['uncanny'];
const configCache = {};
const sectionCache = {};

function getConfig(textId) {
  if (!configCache[textId]) {
    configCache[textId] = require(path.join(process.cwd(), textId, 'config.js'));
  }
  return configCache[textId];
}

function getSections(textId) {
  if (!sectionCache[textId]) {
    const config = getConfig(textId);
    sectionCache[textId] = config.sectionFiles.map(file =>
      fs.readFileSync(path.join(config.sectionsDir, file), 'utf8')
    );
  }
  return sectionCache[textId];
}

const EVOLVED_PATH = path.join(process.cwd(), 'evolved_sections.json');

function getRedis() {
  const { Redis } = require('@upstash/redis');
  return new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
}

async function readEvolved(textId) {
  if (process.env.KV_REST_API_URL) {
    try {
      return (await getRedis().get(`evolved:${textId}`)) || {};
    } catch (err) {
      console.error('KV read failed:', err.message);
      return {};
    }
  }
  try {
    const all = JSON.parse(fs.readFileSync(EVOLVED_PATH, 'utf8'));
    return all[textId] || {};
  } catch {
    return {};
  }
}

async function writeEvolved(textId, data) {
  if (process.env.KV_REST_API_URL) {
    await getRedis().set(`evolved:${textId}`, data);
    return;
  }
  try {
    let all = {};
    try { all = JSON.parse(fs.readFileSync(EVOLVED_PATH, 'utf8')); } catch {}
    all[textId] = data;
    fs.writeFileSync(EVOLVED_PATH, JSON.stringify(all, null, 2));
  } catch (err) {
    console.error('writeEvolved failed:', err.message);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sectionIndex, conversationHistory, textId } = req.body;

  if (!ALLOWED_TEXT_IDS.includes(textId)) {
    return res.status(400).json({ error: 'Unknown text' });
  }

  if (typeof sectionIndex !== 'number' || !Array.isArray(conversationHistory)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const config = getConfig(textId);
  const sections = getSections(textId);
  const idx = Math.max(0, Math.min(Math.floor(sectionIndex), sections.length - 1));
  const evolved = await readEvolved(textId);
  const currentText = evolved[idx] ?? sections[idx];

  const conversationTranscript = conversationHistory
    .map(m => `${m.role === 'user' ? 'Reader' : 'Guide'}: ${m.content}`)
    .join('\n\n');

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: config.synthesisInstructions,
      messages: [
        {
          role: 'user',
          content: `Current section text:\n\n${currentText}\n\n---\n\nConversation:\n\n${conversationTranscript}\n\n---\n\nProduce the revised section.`
        }
      ]
    });

    const revised = response.content[0].text.trim();
    evolved[idx] = revised;
    await writeEvolved(textId, evolved);

    return res.status(200).json({ revised });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'API error' });
  }
};
