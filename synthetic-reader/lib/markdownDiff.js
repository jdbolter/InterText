'use strict';

// Split on word boundaries while retaining the whitespace before each word. This
// keeps the revised text byte-for-byte intact apart from the added ** markers and
// makes the markers sit next to visible text rather than around spaces.
function tokenize(text) {
  return String(text).match(/\s*(?:[\p{L}\p{N}_]+(?:['’][\p{L}\p{N}_]+)*|[^\s\p{L}\p{N}_])/gu) ||
    (text ? [String(text)] : []);
}

function valueAt(map, key) {
  return map.has(key) ? map.get(key) : Number.NEGATIVE_INFINITY;
}

// Myers' shortest-edit-script algorithm. It handles full essay sections without
// constructing an originalWords × revisedWords matrix.
function diffTokens(originalTokens, revisedTokens) {
  const n = originalTokens.length;
  const m = revisedTokens.length;
  const trace = [];
  let frontier = new Map([[1, 0]]);

  for (let distance = 0; distance <= n + m; distance += 1) {
    trace.push(new Map(frontier));

    for (let diagonal = -distance; diagonal <= distance; diagonal += 2) {
      const moveDown = diagonal === -distance ||
        (diagonal !== distance && valueAt(frontier, diagonal - 1) < valueAt(frontier, diagonal + 1));
      let x = moveDown ? valueAt(frontier, diagonal + 1) : valueAt(frontier, diagonal - 1) + 1;
      if (!Number.isFinite(x)) x = 0;
      let y = x - diagonal;

      while (x < n && y < m && originalTokens[x] === revisedTokens[y]) {
        x += 1;
        y += 1;
      }
      frontier.set(diagonal, x);

      if (x >= n && y >= m) {
        return backtrack(trace, originalTokens, revisedTokens);
      }
    }
  }

  return revisedTokens.map(value => ({ type: 'insert', value }));
}

function backtrack(trace, originalTokens, revisedTokens) {
  let x = originalTokens.length;
  let y = revisedTokens.length;
  const edits = [];

  for (let distance = trace.length - 1; distance >= 0; distance -= 1) {
    const frontier = trace[distance];
    const diagonal = x - y;
    const moveDown = diagonal === -distance ||
      (diagonal !== distance && valueAt(frontier, diagonal - 1) < valueAt(frontier, diagonal + 1));
    const previousDiagonal = moveDown ? diagonal + 1 : diagonal - 1;
    const previousX = distance === 0 ? 0 : valueAt(frontier, previousDiagonal);
    const safePreviousX = Number.isFinite(previousX) ? previousX : 0;
    const previousY = safePreviousX - previousDiagonal;

    while (x > safePreviousX && y > previousY) {
      edits.push({ type: 'equal', value: revisedTokens[y - 1] });
      x -= 1;
      y -= 1;
    }

    if (distance === 0) break;
    if (x === safePreviousX) {
      edits.push({ type: 'insert', value: revisedTokens[y - 1] });
      y -= 1;
    } else {
      edits.push({ type: 'delete', value: originalTokens[x - 1] });
      x -= 1;
    }
  }

  return edits.reverse();
}

function boldSegment(segment) {
  const match = segment.match(/^(\s*)([\s\S]*?)(\s*)$/u);
  if (!match || !match[2]) return segment;
  // A lone punctuation change is hard to emphasize portably in Markdown and is
  // much less useful than the prose additions this comparison is meant to show.
  const firstWordCharacter = match[2].search(/[\p{L}\p{N}]/u);
  if (firstWordCharacter === -1) return segment;
  const punctuationPrefix = match[2].slice(0, firstWordCharacter);
  const addedProse = match[2].slice(firstWordCharacter);
  return `${match[1]}${punctuationPrefix}**${addedProse}**${match[3]}`;
}

function boldInsertedText(text) {
  // Markdown emphasis cannot span a blank line, so bold each inserted paragraph
  // independently while leaving paragraph separators outside the markers.
  return text
    .split(/(\r?\n\s*\r?\n)/u)
    .map(part => /\r?\n\s*\r?\n/u.test(part) ? part : boldSegment(part))
    .join('');
}

/**
 * Returns the revised Markdown with words absent from the original wrapped in
 * Markdown bold markers. Deleted words are naturally absent from the revised
 * copy; the pristine original remains available alongside it for comparison.
 */
function formatAdditionsBold(original, revised) {
  const output = [];
  let inserted = '';

  function flushInserted() {
    if (!inserted) return;
    output.push(boldInsertedText(inserted));
    inserted = '';
  }

  for (const edit of diffTokens(tokenize(original), tokenize(revised))) {
    if (edit.type === 'insert') {
      inserted += edit.value;
    } else {
      flushInserted();
      if (edit.type === 'equal') output.push(edit.value);
    }
  }
  flushInserted();
  return output.join('');
}

module.exports = { formatAdditionsBold };
