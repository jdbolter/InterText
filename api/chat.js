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

async function loadEvolved(textId) {
  if (process.env.KV_REST_API_URL) {
    try {
      const { Redis } = require('@upstash/redis');
      const redis = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
      return (await redis.get(`evolved:${textId}`)) || {};
    } catch (err) {
      console.error('KV read failed:', err.message);
      return {};
    }
  }
  try {
    const all = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'evolved_sections.json'), 'utf8'));
    return all[textId] || {};
  } catch {
    return {};
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history, sectionIndex = 0, shownImages = [], textId } = req.body;

  if (!ALLOWED_TEXT_IDS.includes(textId)) {
    return res.status(400).json({ error: 'Unknown text' });
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Empty message' });
  }

  const config = getConfig(textId);
  const sections = getSections(textId);
  const idx = Math.max(0, Math.min(Math.floor(sectionIndex), sections.length - 1));
  const evolved = await loadEvolved(textId);
  const sectionText = evolved[idx] ?? sections[idx];
  const sectionName = config.sectionNames[idx];

  const messages = [
    ...(Array.isArray(history) ? history : []),
    { role: 'user', content: message.trim() }
  ];

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: [
        { type: 'text', text: [
            config.behavioralInstructions,
            (config.sectionImagePrompts[idx] || [])
              .filter(({ id }) => !shownImages.includes(id))
              .map(({ prompt }) => prompt)
              .join('\n\n') || null,
            `Current section: ${sectionName}`,
            `The reader has just been shown this framing before their first message: "${config.sectionIntros[idx]}"`,
          ].filter(Boolean).join('\n\n') },
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
