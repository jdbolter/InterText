const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic();

const ALLOWED_TEXT_IDS = ['uncanny', 'plenitude', 'blood-on-the-wall'];
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

  const { sectionIndex, conversationHistory, textId, dryRun } = req.body;
  const isDryRun = dryRun === true;

  if (!ALLOWED_TEXT_IDS.includes(textId)) {
    return res.status(400).json({ error: 'Unknown text' });
  }

  if (typeof sectionIndex !== 'number' || !Array.isArray(conversationHistory)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const config = getConfig(textId);
  const sections = getSections(textId);
  const idx = Math.max(0, Math.min(Math.floor(sectionIndex), sections.length - 1));
  // A dry run (synthetic-reader's evolve preview — see synthetic-reader/lib/evolveClient.js)
  // never reads or writes KV at all: it always starts from the pristine authored text,
  // regardless of what real readers may have already evolved it into, so that repeated
  // synthetic runs are comparable against the same fixed baseline instead of a moving
  // target. It must never persist anything — see the isDryRun guard near the bottom.
  const evolved = isDryRun ? {} : await readEvolved(textId);
  const currentText = isDryRun ? sections[idx] : (evolved[idx] ?? sections[idx]);

  const conversationTranscript = conversationHistory
    .map(m => `${m.role === 'user' ? 'Reader' : 'Guide'}: ${m.content}`)
    .join('\n\n');

  try {
    const originalWords = sections[idx].split(/\s+/).filter(Boolean).length;
    const wordLimit = Math.round(originalWords * 1.3);
    const systemPrompt = config.synthesisInstructions.replace('{{WORD_LIMIT}}', wordLimit);
    // Budget must cover the full revised section as plain text; this is a rewrite
    // task with no need for extended reasoning, so thinking is disabled rather than
    // left to consume part of a fixed max_tokens budget (Sonnet 5 defaults to
    // adaptive thinking when the param is omitted). A 2x words-to-tokens multiplier
    // measured short in practice (quotes, em-dashes, and contractions push English
    // prose past ~1.3 tokens/word) and let a real response get cut off mid-sentence
    // while still passing the length-only check below — hence the wider margin here
    // and the completeness check on the result.
    const maxTokens = Math.min(8192, Math.round(wordLimit * 4));

    const response = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: maxTokens,
      thinking: { type: 'disabled' },
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Current section text:\n\n${currentText}\n\n---\n\nConversation:\n\n${conversationTranscript}\n\n---\n\nProduce the revised section.`
        }
      ]
    });

    const revised = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim();

    // Guard against ever overwriting a good section with a failed/truncated/refused
    // response — this must never silently persist, since evolved[idx] is treated as
    // authoritative over the original file once set (see the `??` fallback below).
    // Word count alone doesn't catch a response cut off mid-sentence by max_tokens —
    // that can still be longer than the original, so also require a clean ending.
    const revisedWords = revised.split(/\s+/).filter(Boolean).length;
    const endsCleanly = /[.!?]['"’”)]*$/.test(revised);
    if (revisedWords < originalWords || !endsCleanly) {
      console.error(`evolve produced invalid output for ${textId}[${idx}]: ${revisedWords} words vs ${originalWords} original, endsCleanly=${endsCleanly}`);
      return res.status(502).json({ error: 'Synthesis failed, nothing saved' });
    }

    if (!isDryRun) {
      evolved[idx] = revised;
      await writeEvolved(textId, evolved);
    }

    return res.status(200).json({ revised, original: currentText });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'API error' });
  }
};
