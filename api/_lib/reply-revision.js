'use strict';

const { thinkingOff } = require('./text-extras');
const { countWords } = require('./words');

// H-004b: an optional second pass that rewrites a text's draft reply into its voice
// before the reader sees it. Ordinary (non-editorial) readings only. A text without
// `revision` in its config is unchanged.

// Every marker the reader's interface turns into something else: images and citations.
const MARKER_TOKEN = /\[\[(?:IMAGE|CITE|WEB|MEDIA):[^\]]+\]\]/g;

function revisionConfig(config) {
  const r = config && config.revision;
  if (!r || typeof r.instructions !== 'string' || !r.instructions.trim()) return null;
  if (typeof r.model !== 'string' || !r.model.trim()) return null;
  return {
    model: r.model.trim(),
    instructions: r.instructions.trim(),
    maxTokens: Number.isInteger(r.maxTokens) && r.maxTokens > 0 ? r.maxTokens : 1500,
    // 2026-11-14: the length the reply must come down to; the editor is told by how much a
    // draft exceeds it (H-013 found "count them" alone left replies at about 280 words).
    wordLimit: Number.isInteger(r.wordLimit) && r.wordLimit > 0 ? r.wordLimit : 250,
    // Models differ in how thinking is turned off (see thinkingOff in text-extras);
    // claude-sonnet-5-5 requires 'between_tools' (it then does not think before replying).
    thinking: r.thinking && typeof r.thinking.type === 'string' ? { type: r.thinking.type } : thinkingOff(r.model.trim()),
  };
}

// The author's prose as a model of style (intertext-paper H-002). A text may give `styleSample` in its
// config: a few passages of its author's prose, chosen by the author, as a string or an array of strings.
// The revision pass is then told to match their manner, never to borrow their content. Author-neutral:
// each text supplies its own; a text without one is revised exactly as before.
const STYLE_HEADING = "THE AUTHOR'S PROSE, AS A MODEL OF STYLE";
const STYLE_INSTRUCTION = "The passages below were chosen by the work's author as a model of its prose. Revise the reply so that its sentences read as the author's would: match their length and rhythm, their diction and register, and the way they introduce, connect and qualify a claim. Take nothing else from them: no ideas, examples, facts or phrases that the draft does not already hold.";

function styleSampleBlock(config) {
  const raw = config && config.styleSample;
  const passages = (Array.isArray(raw) ? raw : [raw])
    .filter(p => typeof p === 'string' && p.trim())
    .map(p => p.trim());
  if (!passages.length) return null;
  return `${STYLE_HEADING}\n${STYLE_INSTRUCTION}\n\n${passages.join('\n\n')}`;
}

// H-010: the editor also sees what the reader has been shown (the opening box and the text's
// earlier replies), what the work holds for this section (for reference: the reader has not read
// it), and the main line of the argument here. Each part is optional; without them the message
// is exactly the H-004b one.
function buildRevisionMessage({ readerMessage, continuing, draft, shown = null, sectionText = null, mainLine = null, wordLimit = null }) {
  const reader = continuing
    ? '(The reader asked the work to go on.)'
    : String(readerMessage || '').trim();
  const parts = [];
  if (mainLine && String(mainLine).trim()) parts.push(`THE ARGUMENT HERE, IN BRIEF\n${String(mainLine).trim()}`);
  if (shown && String(shown).trim()) parts.push(`WHAT THE READER HAS BEEN SHOWN SO FAR\n${String(shown).trim()}`);
  if (sectionText && String(sectionText).trim()) {
    parts.push(`WHAT THE WORK HOLDS FOR THIS SECTION (for reference; the reader has not read it)\n${String(sectionText).trim()}`);
  }
  parts.push(`THE READER'S WORDS\n${reader}`);
  parts.push(`${draftHeading(draft, wordLimit)}\n${String(draft).trim()}`);
  return parts.join('\n\n');
}

// A draft over the limit is handed over with its count and the excess, so that the editor
// knows how much to cut; a draft within the limit is handed over as before.
function draftHeading(draft, wordLimit) {
  const n = countWords(draft);
  if (!Number.isInteger(wordLimit) || wordLimit <= 0 || n <= wordLimit) return 'THE DRAFT REPLY';
  return `THE DRAFT REPLY (${n} words, ${n - wordLimit} over the limit of ${wordLimit}: return at most ${wordLimit} words)`;
}

// What the reader has seen: the opening box, then each of the text's earlier replies.
function shownToReader({ intro, history }) {
  const replies = (Array.isArray(history) ? history : [])
    .filter(m => m && m.role === 'assistant' && typeof m.content === 'string' && m.content.trim())
    .map(m => m.content.trim());
  const parts = [];
  if (intro && String(intro).trim()) parts.push(`[The opening box]\n${String(intro).trim()}`);
  replies.forEach((r, i) => parts.push(`[The text's reply ${i + 1}]\n${r}`));
  return parts.join('\n\n');
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

async function reviseReply({ client, config, readerMessage, continuing, draft, shown = null, sectionText = null, mainLine = null }) {
  const rc = revisionConfig(config);
  if (!rc || !String(draft || '').trim()) return { text: draft, applied: false, reason: 'not configured' };
  try {
    // What the work holds for the section is the same on every turn of it, so it goes in the
    // system prompt behind the instructions and is cached there (2026-11-14); the rest of the
    // message changes with every reply.
    const passage = sectionText && String(sectionText).trim()
      ? `WHAT THE WORK HOLDS FOR THIS SECTION (for reference; the reader has not read it)\n${String(sectionText).trim()}`
      : null;
    // The author's style sample is the same for the whole text, so it sits with the instructions,
    // before the cached passage.
    const style = styleSampleBlock(config);
    const stable = [{ type: 'text', text: rc.instructions }];
    if (style) stable.push({ type: 'text', text: style });
    const response = await client.messages.create({
      model: rc.model,
      max_tokens: rc.maxTokens,
      thinking: rc.thinking,
      system: passage
        ? [...stable, { type: 'text', text: passage, cache_control: { type: 'ephemeral' } }]
        : (style ? stable : rc.instructions),
      messages: [{ role: 'user', content: buildRevisionMessage({ readerMessage, continuing, draft, shown, mainLine, wordLimit: rc.wordLimit }) }],
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
  draftHeading,
  revisionConfig,
  reviseReply,
  styleSampleBlock,
  shownToReader,
};
