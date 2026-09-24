const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const {
  EDITORIAL_DELIVERY_TOOL,
  buildEditorialDeliveryTool,
  extractEditorialDelivery,
  formatPriorSectionSummaries,
  isEditorialEdition,
  prepareEditorialReading,
  prepareVersionedReading,
} = require('./lib/editorial-reading');
const { loadCurrentSection } = require('./lib/editorial-store');
const {
  buildContinuationInstructions,
  continuationUserMessage,
  openingSectionText,
  resolveFirstContinuation,
} = require('./lib/reading-continuation');

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

  const {
    message,
    history,
    sectionIndex = 0,
    shownImages = [],
    textId,
    action,
    sectionHistory = null,
    edition,
    presentedFundEntryIds = [],
    editorialVersionId = null,
    priorSectionSummaries = [],
    firstContinuation: requestedFirstContinuation = false,
  } = req.body;
  const continuing = action === 'continue';
  // A reader who declined to contribute can still ask to see the original rather
  // than the collectively-evolved edition. Either way this session changes nothing.
  const useOriginal = edition === 'original';

  if (!ALLOWED_TEXT_IDS.includes(textId)) {
    return res.status(400).json({ error: 'Unknown text' });
  }

  if (!continuing && (!message || typeof message !== 'string' || !message.trim())) {
    return res.status(400).json({ error: 'Empty message' });
  }

  const config = getConfig(textId);
  const sections = getSections(textId);
  const idx = Math.max(0, Math.min(Math.floor(sectionIndex), sections.length - 1));
  let editorialReading = null;
  let sectionText;
  if (isEditorialEdition(edition)) {
    try {
      editorialReading = prepareEditorialReading({
        textId,
        sectionIndex: idx,
        edition,
        presentedFundEntryIds,
      });
      sectionText = editorialReading.sectionText;
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  } else if (!useOriginal) {
    try {
      const versioned = await loadCurrentSection({
        textId,
        sectionIndex: idx,
        versionId: typeof editorialVersionId === 'string' ? editorialVersionId : null,
      });
      if (versioned) {
        editorialReading = prepareVersionedReading({
          sectionPackage: versioned.sectionPackage,
          presentedFundEntryIds,
        });
        sectionText = editorialReading.sectionText;
      }
    } catch (err) {
      console.error(`Versioned editorial read failed for ${textId}[${idx}]:`, err.message);
      return res.status(409).json({ error: 'The current edition changed or could not be loaded' });
    }
    if (!editorialReading) {
      const evolved = await loadEvolved(textId);
      sectionText = evolved[idx] ?? sections[idx];
    }
  } else {
    sectionText = sections[idx];
  }
  const sectionName = config.sectionNames[idx];

  // Continuation uses this section's exchanges, not the previous chapter's ending.
  // New clients send the current section's history for both questions and
  // continuations. Falling back to the legacy global history keeps older clients
  // compatible without forcing current clients to resend every earlier exchange.
  const context = Array.isArray(sectionHistory) ? sectionHistory : history;
  const firstContinuation = resolveFirstContinuation({
    continuing,
    requestedFirstContinuation,
    context,
  });
  const priorSectionMemory = formatPriorSectionSummaries(priorSectionSummaries, idx);
  const promptedSectionText = firstContinuation ? openingSectionText(sectionText) : sectionText;
  // Keep the opening deterministic: optional material can enter on later turns,
  // once the guide has a real section cursor and has reached the relevant anchor.
  const offeredFundEntryIds = editorialReading && !firstContinuation
    ? editorialReading.offeredFundEntryIds
    : [];
  const editorialFundText = editorialReading && !firstContinuation
    ? editorialReading.fundText
    : null;
  const messages = [
    ...(Array.isArray(context) ? context : []),
    { role: 'user', content: continuing ? continuationUserMessage(firstContinuation) : message.trim() }
  ];
  const continuationInstructions = buildContinuationInstructions({
    continuing,
    firstContinuation,
    editorialReading: Boolean(editorialReading),
  });

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-5',
      // 2048 was too tight: adaptive thinking can consume the whole budget on a hard
      // turn, leaving no tokens for the actual reply and forcing the empty-completion
      // 502 below — confirmed in practice by several consecutive real turns. Response
      // text itself is short (config.behavioralInstructions caps it around 250 words),
      // so this is headroom for thinking, not an invitation to write longer replies.
      max_tokens: 4096,
      // Sonnet 5 runs adaptive thinking by default when this is omitted (Sonnet 4.6 didn't) —
      // pinned explicitly so behavior doesn't shift silently on a future model swap.
      thinking: { type: 'adaptive' },
      system: [
        { type: 'text', text: [
            config.behavioralInstructions,
            continuationInstructions,
            (config.sectionImagePrompts[idx] || [])
              .filter(({ id }) => !shownImages.includes(id))
              .map(({ prompt }) => prompt)
              .join('\n\n') || null,
            `Current section: ${sectionName}`,
            `The reader has just been shown this framing before their first message: "${config.sectionIntros[idx]}"`,
            editorialReading ? editorialReading.instructions : null,
            editorialReading ? editorialReading.memoryInstructions : null,
          ].filter(Boolean).join('\n\n') },
        { type: 'text', text: promptedSectionText, cache_control: { type: 'ephemeral' } },
        ...(editorialReading && priorSectionMemory
          ? [{ type: 'text', text: priorSectionMemory }]
          : []),
        ...(editorialFundText
          ? [{ type: 'text', text: editorialFundText }]
          : []),
      ],
      // Keep the two editorial conditions controlled: neither may acquire new
      // substantive material from web search. Ordinary/evolving readings retain
      // the existing bounded search capability.
      ...(editorialReading
        ? {
            tools: [buildEditorialDeliveryTool(offeredFundEntryIds)],
            tool_choice: {
              type: 'tool',
              name: EDITORIAL_DELIVERY_TOOL,
              disable_parallel_tool_use: true,
            },
          }
        : { tools: [{ type: 'web_search_20260318', name: 'web_search', max_uses: 5 }] }),
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
    let text;
    let editorialResult = null;
    let sectionComplete;
    if (editorialReading) {
      let delivery;
      try {
        delivery = extractEditorialDelivery(response.content, offeredFundEntryIds);
      } catch (err) {
        console.error(`Invalid editorial completion for ${textId}[${idx}]:`, err.message);
        return res.status(502).json({ error: 'Invalid editorial completion' });
      }
      text = delivery.text;
      sectionComplete = continuing && !firstContinuation && delivery.sectionComplete;
      editorialResult = {
        edition,
        packageVersionId: editorialReading.sectionPackage.versionId,
        offeredFundEntryIds,
        usedFundEntryIds: delivery.usedFundEntryIds,
        sectionSummary: delivery.sectionSummary,
        trackingComplete: delivery.trackingComplete,
        trackingMethod: 'required-tool',
      };
    } else {
      text = postBlocks.map(b => b.text).join('');
      sectionComplete = continuing && !firstContinuation && /\[\[SECTION_COMPLETE\]\]/.test(text);
      text = text.replace(/\[\[SECTION_COMPLETE\]\]/g, '').trim();
    }

    // An empty completion (e.g. thinking consuming the whole max_tokens budget on a
    // hard turn) is a failure, not a valid reply — must not return 200 with empty
    // text, since the client only pushes successful turns into `history`, and a
    // silent empty-but-200 response causes that turn to vanish from context.
    if (!text.trim() && !sectionComplete) {
      console.error(`chat produced empty completion for ${textId}[${idx}]`);
      return res.status(502).json({ error: 'Empty completion' });
    }

    if (citations.length > 0) {
      text += '\n\nSources: ' + citations.slice(0, 5).map(c => `[${c.title}](${c.url})`).join(' · ');
    }
    return res.status(200).json({
      response: text,
      ...(continuing ? { sectionComplete } : {}),
      ...(editorialResult ? { editorial: editorialResult } : {}),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'API error' });
  }
};
