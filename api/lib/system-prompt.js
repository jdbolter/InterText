'use strict';

// 2026-11-14: the order of the system prompt. What stays the same through a section (the
// text's instructions, the passage it holds, its library list) comes first, and the last of
// those blocks is marked for caching, so that every later call in the section reads the
// prefix from the cache; what changes from turn to turn (continuation instructions, images
// and media not yet shown, the writers introduced so far, the fund) comes after it.
//
// Until now the per-turn parts came first and the passage, though marked for caching, sat
// behind them, so the cache missed on nearly every call.

function joinParts(parts) {
  return (Array.isArray(parts) ? parts : [parts])
    .filter(part => typeof part === 'string' && part.trim())
    .join('\n\n');
}

// Returns the `system` array for client.messages.create: the stable blocks, then the per-turn
// text. The cache marker goes on the last stable block.
function systemBlocks({ stable = [], passage = null, library = null, perTurn = [] }) {
  const blocks = [];
  const head = joinParts(stable);
  if (head) blocks.push({ type: 'text', text: head });
  if (typeof passage === 'string' && passage.trim()) blocks.push({ type: 'text', text: passage });
  if (typeof library === 'string' && library.trim()) blocks.push({ type: 'text', text: library });
  if (blocks.length > 0) blocks[blocks.length - 1].cache_control = { type: 'ephemeral' };
  const tail = joinParts(perTurn);
  if (tail) blocks.push({ type: 'text', text: tail });
  return blocks;
}

module.exports = { systemBlocks, joinParts };
