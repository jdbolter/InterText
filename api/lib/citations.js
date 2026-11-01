'use strict';

// H-005: citations as footnote markers. The model writes [[CITE:id]] or [[CITE:id|pages]]
// for a work in the section's fund; the API's web-search citations become [[WEB:k]]
// markers. The server checks every marker and returns the notes; the interface numbers
// them through the conversation and shows the full reference on demand.

const fs = require('fs');

const CITE_TOKEN = /\[\[CITE:([a-z0-9-]+)(?:\|([^\]]*))?\]\]/g;
const WEB_TOKEN = /\[\[WEB:(\d+)\]\]/g;

function citationMarkersOn(config) {
  return Boolean(config && config.citationMarkers === true && typeof config.referencesFile === 'string');
}

const referenceCache = new Map();
function loadReferences(config, { readFile = fs.readFileSync } = {}) {
  if (!citationMarkersOn(config)) return {};
  const file = config.referencesFile;
  if (!referenceCache.has(file)) referenceCache.set(file, JSON.parse(String(readFile(file, 'utf8'))));
  return referenceCache.get(file);
}
function clearReferenceCache() { referenceCache.clear(); }

// Fund entries begin with their id in square brackets: "[burger-1984] Bürger, ...".
function fundIds(fundText) {
  const ids = new Set();
  const re = /^\[([a-z0-9-]+)\]\s/gm;
  let m;
  while ((m = re.exec(String(fundText || ''))) !== null) ids.add(m[1]);
  return ids;
}

// "80–81", "80-81", "p. 63", "pp. 122, 130" -> [[80,81]] etc.; null if unreadable.
function parseLocator(locator) {
  const s = String(locator || '').replace(/^\s*pp?\.\s*/i, '').trim();
  if (!s) return null;
  const parts = s.split(/\s*,\s*/);
  const ranges = [];
  for (const part of parts) {
    const m = part.match(/^(\d+)(?:\s*[-–—]\s*(\d+))?$/);
    if (!m) return null;
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    if (b < a) return null;
    ranges.push([a, b]);
  }
  return ranges;
}

function locatorAllowed(locator, pages) {
  const ranges = parseLocator(locator);
  if (!ranges || !Array.isArray(pages) || pages.length === 0) return false;
  return ranges.every(([a, b]) => pages.some(([lo, hi]) => a >= lo && b <= hi));
}

function formatLocator(locator) {
  return parseLocator(locator).map(([a, b]) => (a === b ? `${a}` : `${a}–${b}`)).join(', ');
}

// Keep a marker only for a work in this section's fund; keep its pages only if they fall
// within the pages the fund entry gives. Returns the checked text and the works cited.
function checkCitations(text, { allowedIds, references }) {
  const library = {};
  const checked = String(text).replace(CITE_TOKEN, (_, id, locator) => {
    const ref = references[id];
    if (!ref || !allowedIds.has(id)) return '';
    library[id] = { short: ref.short, full: ref.full };
    if (locator && locatorAllowed(locator, ref.pages)) return `[[CITE:${id}|${formatLocator(locator)}]]`;
    return `[[CITE:${id}]]`;
  });
  const tidy = checked
    .replace(/[ \t]+(\[\[(?:CITE|WEB):)/g, '$1') // a marker sits against its word
    .replace(/[ \t]+([.,;:])/g, '$1'); // and a dropped marker leaves no gap before punctuation
  return { text: tidy, library };
}

// The API ties each web source to the stretch of text it supports. Put a marker at the
// end of each such stretch; the same source keeps one number within the reply.
function markWebCitations(textBlocks) {
  const web = [];
  const index = new Map();
  let text = '';
  for (const block of textBlocks) {
    text += block.text || '';
    const ks = [];
    for (const c of block.citations || []) {
      if (!c || !c.url) continue;
      if (!index.has(c.url)) {
        index.set(c.url, web.length + 1);
        web.push({ k: web.length + 1, url: c.url, title: c.title || c.url });
      }
      const k = index.get(c.url);
      if (!ks.includes(k)) ks.push(k);
    }
    if (ks.length) text = text.replace(/\s+$/, '') + ks.map(k => `[[WEB:${k}]]`).join('');
  }
  return { text, web };
}

// Web markers are numbered within one reply, so they mean nothing in later turns.
function stripWebTokens(text) {
  return String(text).replace(WEB_TOKEN, '');
}

// With markers on, a source list the model writes into the reply itself is redundant.
function dropWrittenSourceList(text) {
  return String(text).replace(/\n+\s*(?:\*\*)?Sources:(?:\*\*)?[^\n]*(?:\n(?!\n)[^\n]*)*\s*$/u, '').trim();
}

function webUsed(text, web) {
  const used = new Set();
  let m;
  WEB_TOKEN.lastIndex = 0;
  while ((m = WEB_TOKEN.exec(text)) !== null) used.add(Number(m[1]));
  return web.filter(w => used.has(w.k));
}

// H-007: for synthesis, markers become the book's own author-date style; web markers, whose
// numbers mean nothing outside their reply, are dropped (the browser sends web sources as links).
function plainCitations(text, references) {
  return String(text)
    .replace(CITE_TOKEN, (_, id, locator) => {
      const ref = references && references[id];
      return ref ? ` (${ref.short}${locator ? ', ' + locator : ''})` : '';
    })
    .replace(WEB_TOKEN, '');
}

// H-008: how each listed work is mentioned (Jay, 2026-11-01). A reference may carry
//   mention: 'introduce' (with intro, e.g. "the German literary theorist Peter Bürger", and name, "Bürger"),
//   mention: 'note'  (the point in the text's own sentence, the author unnamed, the note carrying the source),
//   mention: 'own'   (the author's own later work: its ideas stated as the work's own, never named).
// Before each reply the fund is marked, entry by entry, with what to do in this conversation, so the
// model never has to remember whom it has already introduced.
function introducedIds(messages, references) {
  const done = new Set();
  const said = (Array.isArray(messages) ? messages : [])
    .filter(m => m && m.role === 'assistant' && typeof m.content === 'string')
    .map(m => m.content)
    .join('\n');
  for (const [id, ref] of Object.entries(references || {})) {
    if (ref.mention !== 'introduce') continue;
    if (said.includes(`[[CITE:${id}`) || (ref.name && said.includes(ref.name))) done.add(id);
  }
  return done;
}

function mentionNote(ref, introduced) {
  if (!ref || !ref.mention) return '';
  if (ref.mention === 'own') {
    return '(The work\'s own later thinking: state its ideas as your own, never naming the author or the work, and add the marker.) ';
  }
  if (ref.mention === 'note') {
    return '(Cite by note only: state the point in your own sentence, add the marker, and leave the author unnamed.) ';
  }
  if (ref.mention === 'introduce' && ref.intro && ref.name) {
    return introduced
      ? `(Already introduced in this conversation: simply "${ref.name}".) `
      : `(Not yet introduced: on first mention, "${ref.intro}"; afterwards simply "${ref.name}".) `;
  }
  return '';
}

function annotateFund(fundText, references, introduced) {
  if (!fundText) return fundText;
  return String(fundText).replace(/^\[([a-z0-9-]+)\] /gm, (whole, id) =>
    `${whole}${mentionNote(references && references[id], introduced && introduced.has(id))}`);
}

module.exports = {
  CITE_TOKEN,
  WEB_TOKEN,
  annotateFund,
  introducedIds,
  checkCitations,
  citationMarkersOn,
  clearReferenceCache,
  dropWrittenSourceList,
  formatLocator,
  fundIds,
  loadReferences,
  locatorAllowed,
  markWebCitations,
  parseLocator,
  plainCitations,
  stripWebTokens,
  webUsed,
};
