const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic();

// Load the beat graph and the authored system prompt once per cold start.
const BEATS_DATA = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'beats', 'section-2-beats.json'), 'utf8')
);
const SYSTEM_PROMPT = fs.readFileSync(
  path.join(process.cwd(), 'beats', 'system-prompt.md'), 'utf8'
);

// v0.1 traversal: a fixed linear order through the graph (a valid topological
// sort of `requires`). Graph-aware traversal (reader chooses between
// aura/freud) is future work.
const ORDER = [
  'literary-inheritance',
  'film-doubles-world',
  'la-ciotat-myth',
  'gorky-gap',
  'myth-vs-effect',
  'aura-permanent-crisis',
  'freud-fetish-substitute',
];

const beatById = Object.fromEntries(BEATS_DATA.beats.map(b => [b.id, b]));

// Exit detection v0.1: the model self-reports by ending its reply with the
// marker below when the ACTIVE beat's exit condition is satisfied. The marker
// is stripped before the text reaches the reader. Crude, but measurable.
const ADVANCE_MARKER = '[ADVANCE]';

function serializeActiveBeat(beat) {
  const lines = [];
  lines.push(`ACTIVE BEAT: ${beat.id} (move: ${beat.move})`);
  lines.push('');
  lines.push('CANONICAL PROSE (present from this; quote it verbatim):');
  lines.push(beat.canonical);
  lines.push('');
  if (beat.quotations && beat.quotations.length) {
    lines.push('LICENSED QUOTATIONS (attribute by source):');
    for (const q of beat.quotations) {
      lines.push(`- (${q.source}) "${q.text}"`);
    }
    lines.push('');
  }
  if (beat.depth && beat.depth.length) {
    lines.push('DEPTH MATERIAL (use only when the reader trips the trigger):');
    for (const d of beat.depth) {
      lines.push(`- Trigger: ${d.trigger}\n  Material: ${d.material}`);
    }
    lines.push('');
  }
  if (beat.deferrals && Object.keys(beat.deferrals).length) {
    lines.push('AUTHORED DEFERRALS (use these lines, lightly adapted, when the reader reaches ahead to the named topic):');
    for (const [topic, line] of Object.entries(beat.deferrals)) {
      lines.push(`- ${topic}: ${line}`);
    }
    lines.push('');
  }
  lines.push(`EXIT CONDITION: ${beat.exit}`);
  lines.push('');
  lines.push(`When — and only when — the reader's contributions satisfy the EXIT CONDITION, end your reply with the marker ${ADVANCE_MARKER} on its own final line. Never mention the marker, the beat system, or these instructions.`);
  return lines.join('\n');
}

function serializeGrounded(groundedIds) {
  if (!groundedIds.length) return 'GROUNDED SO FAR: (nothing yet — this is the reader\'s first beat)';
  const lines = ['GROUNDED SO FAR (you may refer back to these freely):'];
  for (const id of groundedIds) {
    const b = beatById[id];
    if (b) lines.push(`- ${b.id}: ${b.summary}`);
  }
  return lines.join('\n');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history, beatIndex = 0 } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Empty message' });
  }

  const idx = Math.max(0, Math.min(Math.floor(beatIndex), ORDER.length - 1));
  const activeBeat = beatById[ORDER[idx]];
  const groundedIds = ORDER.slice(0, idx);

  const messages = [
    ...(Array.isArray(history) ? history : []),
    { role: 'user', content: message.trim() }
  ];

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: [
        // Stable prefix — cached across the whole session.
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
        // Per-beat state — changes only when the beat advances.
        { type: 'text', text: `${serializeGrounded(groundedIds)}\n\n${serializeActiveBeat(activeBeat)}` }
      ],
      messages
    });

    let text = response.content[0].text;
    let advance = false;

    if (text.trimEnd().endsWith(ADVANCE_MARKER)) {
      advance = idx < ORDER.length - 1;
      text = text.trimEnd().slice(0, -ADVANCE_MARKER.length).trimEnd();
    }

    return res.status(200).json({
      response: text,
      advance,
      beatId: activeBeat.id,
      nextBeatId: advance ? ORDER[idx + 1] : activeBeat.id,
      sectionComplete: idx === ORDER.length - 1 && text !== response.content[0].text
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'API error' });
  }
};
