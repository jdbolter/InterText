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

// Myers' shortest-edit-script algorithm. It handles a single paragraph's worth of
// tokens without constructing an originalWords × revisedWords matrix. Used both to
// diff a matched pair of paragraphs word-by-word, and (on a coarser token set) to
// score how similar two paragraphs are before deciding whether to match them at
// all — see alignParagraphs below for why that two-step approach exists.
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

// Word-level diff of ONE matched paragraph pair. Never called across paragraph
// boundaries (see formatAdditionsBold), so an inserted run can never need to span
// a blank line — Markdown emphasis can't do that, but paragraphs by construction
// don't contain one internally.
function diffParagraph(originalParagraph, revisedParagraph) {
  if (originalParagraph === revisedParagraph) return revisedParagraph;

  const output = [];
  let inserted = '';
  function flushInserted() {
    if (!inserted) return;
    output.push(boldSegment(inserted));
    inserted = '';
  }

  for (const edit of diffTokens(tokenize(originalParagraph), tokenize(revisedParagraph))) {
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

// Splits text into paragraphs on blank lines, keeping the exact separators so the
// original spacing can be reproduced. Returns parallel arrays: `paragraphs[i]` is
// followed by `separators[i]` (one shorter than `paragraphs`).
function splitParagraphs(text) {
  const parts = String(text).split(/(\r?\n\s*\r?\n)/u);
  const paragraphs = [];
  const separators = [];
  for (let i = 0; i < parts.length; i += 2) {
    paragraphs.push(parts[i]);
    if (i + 1 < parts.length) separators.push(parts[i + 1]);
  }
  return { paragraphs, separators };
}

// Function words are excluded from the similarity score below because they recur
// so densely in ordinary prose that two entirely unrelated paragraphs can share a
// surprisingly long run of them — exactly the kind of accidental overlap that
// caused the original whole-document diff to mismatch. This list only affects
// which two paragraphs get *matched* for word-level diffing; it never affects
// what actually gets bolded.
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'for', 'with', 'as', 'is', 'was',
  'were', 'are', 'be', 'been', 'being', 'that', 'this', 'these', 'those', 'it', 'its', 'at', 'by',
  'from', 'not', 'no', 'so', 'than', 'then', 'there', 'their', 'they', 'he', 'she', 'his', 'her',
  'which', 'who', 'what', 'when', 'where', 'how', 'also', 'into', 'about', 'over', 'after', 'before',
  'more', 'most', 'such', 'if', 'because', 'while', 'both', 'only', 'other', 'some', 'any', 'each',
  'can', 'will', 'would', 'could', 'should', 'may', 'might', 'have', 'has', 'had', 'do', 'does', 'did',
]);

function isSubstantive(token) {
  const trimmed = token.trim();
  return trimmed.length >= 4 && /\p{L}/u.test(trimmed) && !STOPWORDS.has(trimmed.toLowerCase());
}

// How much of the shorter paragraph's substantive vocabulary survives, in order,
// in the other paragraph — 0 (nothing in common) to 1 (fully contained).
function paragraphSimilarity(originalTokens, revisedTokens) {
  const origSub = originalTokens.filter(isSubstantive);
  const revSub = revisedTokens.filter(isSubstantive);
  if (origSub.length === 0 || revSub.length === 0) return 0;
  const equalCount = diffTokens(origSub, revSub).filter(e => e.type === 'equal').length;
  return equalCount / Math.min(origSub.length, revSub.length);
}

// Below this, two paragraphs are treated as unrelated even if they happen to share
// a few words (a title, a name) — chosen conservatively high: a paragraph that's
// merely extended with new sentences keeps ~all of its original substantive
// vocabulary intact (similarity close to 1), while two genuinely different
// paragraphs rarely clear even this bar by accident.
const SIMILARITY_THRESHOLD = 0.5;

/**
 * Aligns revised paragraphs to original paragraphs, preserving reading order,
 * only pairing paragraphs whose similarity clears SIMILARITY_THRESHOLD. This is a
 * weighted, order-preserving alignment (each side can also be skipped — a deleted
 * original paragraph, or a wholly new revised one) — small paragraph counts make
 * an O(n·m) table entirely fine even though word-level diffing needed the O(N·D)
 * algorithm above to avoid the same cost at the word level.
 *
 * Returns an array the length of revisedParagraphs: matchForRevised[j] is the
 * matched index into originalParagraphs, or -1 if paragraph j has no match (i.e.
 * it's new).
 */
function alignParagraphs(originalParagraphs, revisedParagraphs) {
  const n = originalParagraphs.length;
  const m = revisedParagraphs.length;
  const originalTokensList = originalParagraphs.map(tokenize);
  const revisedTokensList = revisedParagraphs.map(tokenize);

  const sim = [];
  for (let i = 0; i < n; i += 1) {
    sim.push(revisedTokensList.map(revTokens => paragraphSimilarity(originalTokensList[i], revTokens)));
  }

  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  const choice = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(null));
  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      let best = dp[i - 1][j];
      let move = 'skip-original';
      if (dp[i][j - 1] > best) {
        best = dp[i][j - 1];
        move = 'skip-revised';
      }
      const s = sim[i - 1][j - 1];
      if (s >= SIMILARITY_THRESHOLD && dp[i - 1][j - 1] + s > best) {
        best = dp[i - 1][j - 1] + s;
        move = 'match';
      }
      dp[i][j] = best;
      choice[i][j] = move;
    }
  }

  const matchForRevised = new Array(m).fill(-1);
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    const move = i > 0 && j > 0 ? choice[i][j] : i > 0 ? 'skip-original' : 'skip-revised';
    if (move === 'match') {
      matchForRevised[j - 1] = i - 1;
      i -= 1;
      j -= 1;
    } else if (move === 'skip-revised') {
      j -= 1;
    } else {
      i -= 1;
    }
  }
  return matchForRevised;
}

/**
 * Returns the revised Markdown with words absent from the original wrapped in
 * Markdown bold markers. Deleted words are naturally absent from the revised
 * copy; the pristine original remains available alongside it for comparison.
 *
 * Diffs paragraph-by-paragraph rather than as one long token stream: a revised
 * paragraph is only ever compared against the original paragraph it's actually a
 * revision of (found via alignParagraphs), never against unrelated paragraphs
 * elsewhere in the section. Without that separation, a short phrase reused far
 * from its original context — a title, a name — could get matched across
 * paragraphs purely because it shortened the total edit distance, splitting
 * highlights in confusing, sometimes visibly broken ways.
 */
function formatAdditionsBold(original, revised) {
  const { paragraphs: originalParagraphs } = splitParagraphs(original);
  const { paragraphs: revisedParagraphs, separators: revisedSeparators } = splitParagraphs(revised);

  const matchForRevised = alignParagraphs(originalParagraphs, revisedParagraphs);

  let result = '';
  revisedParagraphs.forEach((paragraph, j) => {
    const matchedIndex = matchForRevised[j];
    result += matchedIndex === -1 ? boldSegment(paragraph) : diffParagraph(originalParagraphs[matchedIndex], paragraph);
    if (j < revisedSeparators.length) result += revisedSeparators[j];
  });
  return result;
}

module.exports = { formatAdditionsBold };
