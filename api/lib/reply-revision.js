'use strict';

// H-004b: an optional second pass that rewrites a text's draft reply into its voice
// before the reader sees it. Ordinary (non-editorial) readings only. A text without
// `revision` in its config is unchanged.

// Every marker the reader's interface turns into something else: images and citations.
const MARKER_TOKEN = /\[\[(?:IMAGE|CITE|WEB):[^\]]+\]\]/g;

function revisionConfig(config) {
  const r = config && config.revision;
  if (!r || typeof r.instructions !== 'string' || !r.instructions.trim()) return null;
  if (typeof r.model !== 'string' || !r.model.trim()) return null;
  return {
    model: r.model.trim(),
    instructions: r.instructions.trim(),
    maxTokens: Number.isInteger(r.maxTokens) && r.maxTokens > 0 ? r.maxTokens : 1500,
    // Models differ in how thinking is turned off: claude-sonnet-5 takes 'disabled',
    // claude-sonnet-5-5 requires 'between_tools' (it then does not think before replying).
    thinking: r.thinking && typeof r.thinking.type === 'string' ? { type: r.thinking.type } : { type: 'disabled' },
  };
}

function buildRevisionMessage({ readerMessage, continuing, draft }) {
  const reader = continuing
    ? '(The reader asked the work to go on.)'
    : String(readerMessage || '').trim();
  return `THE READER'S WORDS\n${reader}\n\nTHE DRAFT REPLY\n${String(draft).trim()}`;
}

function markerTokens(text) {
  return (String(text).match(MARKER_TOKEN) || []).slice().sort();
}

// A revision is used only if it is non-empty and keeps every marker of the draft (images, citations).
function checkRevision(draft, revised) {
  const text = typeof revised === 'string' ? revised.trim() : '';
  if (!text) return { ok: false, reason: 'empty revision' };
  if (/\[\[SECTION_COMPLETE\]\]/.test(text)) return { ok: false, reason: 'revision emitted the navigation marker' };
  const before = markerTokens(draft);
  const after = markerTokens(text);
  if (before.length !== after.length || before.some((t, i) => t !== after[i])) {
    return { ok: false, reason: 'revision changed the markers' };
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
      thinking: rc.thinking,
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
    const detail = [err.status, err.message].filter(Boolean).join(' ').slice(0, 300);
    console.error('reply revision failed:', detail);
    return { text: draft, applied: false, reason: `revision call failed: ${detail}`, model: rc.model };
  }
}

module.exports = {
  buildRevisionMessage,
  checkRevision,
  revisionConfig,
  reviseReply,
};
