'use strict';

// H-004b: an optional second pass that rewrites a text's draft reply into its voice
// before the reader sees it. Ordinary (non-editorial) readings only. A text without
// `revision` in its config is unchanged.

const IMAGE_TOKEN = /\[\[IMAGE:[^\]]+\]\]/g;

function revisionConfig(config) {
  const r = config && config.revision;
  if (!r || typeof r.instructions !== 'string' || !r.instructions.trim()) return null;
  if (typeof r.model !== 'string' || !r.model.trim()) return null;
  return {
    model: r.model.trim(),
    instructions: r.instructions.trim(),
    maxTokens: Number.isInteger(r.maxTokens) && r.maxTokens > 0 ? r.maxTokens : 1500,
  };
}

function buildRevisionMessage({ readerMessage, continuing, draft }) {
  const reader = continuing
    ? '(The reader asked the work to go on.)'
    : String(readerMessage || '').trim();
  return `THE READER'S WORDS\n${reader}\n\nTHE DRAFT REPLY\n${String(draft).trim()}`;
}

function imageTokens(text) {
  return (String(text).match(IMAGE_TOKEN) || []).slice().sort();
}

// A revision is used only if it is non-empty and keeps every image token of the draft.
function checkRevision(draft, revised) {
  const text = typeof revised === 'string' ? revised.trim() : '';
  if (!text) return { ok: false, reason: 'empty revision' };
  if (/\[\[SECTION_COMPLETE\]\]/.test(text)) return { ok: false, reason: 'revision emitted the navigation marker' };
  const before = imageTokens(draft);
  const after = imageTokens(text);
  if (before.length !== after.length || before.some((t, i) => t !== after[i])) {
    return { ok: false, reason: 'revision changed the image tokens' };
  }
  return { ok: true, text };
}

async function reviseReply({ client, config, readerMessage, continuing, draft }) {
  const rc = revisionConfig(config);
  if (!rc || !String(draft || '').trim()) return { text: draft, applied: false, reason: 'not configured' };
  try {
    const response = await client.messages.create({
      model: rc.model,
      max_tokens: rc.maxTokens,
      thinking: { type: 'disabled' },
      system: rc.instructions,
      messages: [{ role: 'user', content: buildRevisionMessage({ readerMessage, continuing, draft }) }],
    });
    const revised = (response.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');
    const check = checkRevision(draft, revised);
    if (!check.ok) return { text: draft, applied: false, reason: check.reason, model: rc.model, usage: response.usage };
    return { text: check.text, applied: true, model: rc.model, usage: response.usage };
  } catch (err) {
    console.error('reply revision failed:', err.message);
    return { text: draft, applied: false, reason: 'revision call failed', model: rc.model };
  }
}

module.exports = {
  buildRevisionMessage,
  checkRevision,
  revisionConfig,
  reviseReply,
};
