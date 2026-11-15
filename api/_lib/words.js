'use strict';

// Counting words the way the text's own limit means them: the prose a reader sees, with the
// page's markers ([[CITE:…]], [[WEB:…]], [[IMAGE:…]], [[MEDIA:…]], [[FUND:…]], [[MEMORY: …]])
// and private signals left out.
const MARKER = /\[\[[A-Z_]+(?::[^\]]*)?\]\]/g;

function proseOf(text) {
  return String(text || '').replace(MARKER, ' ');
}

function countWords(text) {
  const words = proseOf(text).trim().split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w));
  return words.length;
}

module.exports = { countWords, proseOf };
