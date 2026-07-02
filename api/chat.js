const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic();

const ALLOWED_TEXT_IDS = ['uncanny', 'plenitude'];
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
      model: 'claude-sonnet-5',
      max_tokens: 2048,
      // Sonnet 5 runs adaptive thinking by default when this is omitted (Sonnet 4.6 didn't) —
      // pinned explicitly so behavior doesn't shift silently on a future model swap.
      thinking: { type: 'adaptive' },
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
      tools: [{ type: 'web_search_20260318', name: 'web_search', max_uses: 5 }],
      messages
    });

    const lastNonTextIdx = response.content.reduce((acc, b, i) => b.type !== 'text' ? i : acc, -1);
    const postBlocks = response.content.filter((b, i) => b.type === 'text' && i > lastNonTextIdx);
    const seen = new Set();
    const citations = [];
    response.content.forEach(b => {
      if (b.type === 'web_search_tool_result') {
        (b.content || []).forEach(r => {
          if (r.url && !seen.has(r.url)) {
            seen.add(r.url);
            citations.push({ title: r.title || r.url, url: r.url });
          }
        });
      }
    });
    let text = postBlocks.map(b => b.text).join('');
    if (citations.length > 0) {
      text += '\n\nSources: ' + citations.slice(0, 5).map(c => `[${c.title}](${c.url})`).join(' · ');
    }
    return res.status(200).json({ response: text });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'API error' });
  }
};
