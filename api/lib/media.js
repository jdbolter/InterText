// H-018: media lists. Each section of a work may have a list of videos, images and
// web pages that a reply can embed with [[MEDIA:id]]. The list is checked by
// scripts/media.js (embedding allowed, licence, link alive); the reply may use only
// what the section's list holds, and the page decides how each item is shown.
const fs = require('fs');
const path = require('path');

const MEDIA_TOKEN = /\[\[MEDIA:([^\]]+)\]\]/g;
const KINDS = ['video', 'image', 'link'];
const cache = new Map();

function mediaListPath(config, sectionIndex) {
  if (!config || typeof config.mediaListsDir !== 'string') return null;
  return path.join(config.mediaListsDir, `section-${sectionIndex + 1}.json`);
}

// The items a section offers. A missing or unreadable list offers nothing.
function loadMediaList(config, sectionIndex) {
  const file = mediaListPath(config, sectionIndex);
  if (!file) return [];
  if (cache.has(file)) return cache.get(file);
  let items = [];
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    items = (Array.isArray(parsed) ? parsed : parsed.items || []).filter(usable);
  } catch (err) {
    if (err.code !== 'ENOENT') console.error(`media list ${file}: ${err.message}`);
  }
  cache.set(file, items);
  return items;
}

// An item is offered only when it has what the page needs and its last check passed.
function usable(item) {
  return Boolean(item && typeof item.id === 'string' && item.id.trim()
    && KINDS.includes(item.kind) && typeof item.url === 'string' && /^https:\/\//.test(item.url)
    && typeof item.title === 'string' && item.status !== 'missing' && item.status !== 'dead');
}

// What the page is given: enough to show the item, nothing of the prompt.
function publicItem(item) {
  const out = { id: item.id, kind: item.kind, url: item.url, title: item.title };
  for (const key of ['source', 'credit', 'date']) if (typeof item[key] === 'string') out[key] = item[key];
  if (item.embed && typeof item.embed === 'object') out.embed = item.embed;
  if (item.licence && typeof item.licence === 'object') out.licence = item.licence;
  if (typeof item.status === 'string') out.status = item.status;
  return out;
}

function describe(item) {
  const what = item.kind === 'video' ? 'a video' : item.kind === 'image' ? 'an image' : 'a web page';
  const date = typeof item.date === 'string' && item.date.trim() ? ` (${item.date.trim()})` : '';
  const when = typeof item.when === 'string' ? item.when.trim() : '';
  return `- [[MEDIA:${item.id}]]: ${what}, ${item.title}${date}.${when ? ` Use it ${when.replace(/[.\s]+$/, '')}.` : ''}`;
}

// The prompt lines for a section: the items not yet shown in this reading.
function mediaPromptText(config, sectionIndex, shownMedia = []) {
  const shown = new Set(Array.isArray(shownMedia) ? shownMedia : []);
  const items = loadMediaList(config, sectionIndex).filter(item => !shown.has(item.id));
  if (items.length === 0) return null;
  const intro = typeof config.mediaInstruction === 'string' ? config.mediaInstruction : DEFAULT_INSTRUCTION;
  return `${intro}\n${items.map(describe).join('\n')}`;
}

const DEFAULT_INSTRUCTION = 'The page can show the reader the following items from the web. When one belongs with what this reply discusses, put its token on a line of its own between paragraphs, and let the prose say what the reader is looking at. One item at most in a reply.';

// Keep only tokens for items on the section's list, each once, at most `limit` per
// reply; return the items used so the page can show them.
function applyMediaTokens(text, config, sectionIndex, { limit = 1 } = {}) {
  const items = new Map(loadMediaList(config, sectionIndex).map(item => [item.id, item]));
  const used = {};
  let count = 0;
  const out = String(text).replace(MEDIA_TOKEN, (token, rawId) => {
    const id = rawId.trim();
    const item = items.get(id);
    if (!item || used[id] || count >= limit) return '';
    used[id] = publicItem(item);
    count += 1;
    return `\n\n[[MEDIA:${id}]]\n\n`;
  }).replace(/[ \t]*\n[ \t]*/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return { text: out, media: count > 0 ? used : null };
}

module.exports = { MEDIA_TOKEN, KINDS, applyMediaTokens, loadMediaList, mediaListPath, mediaPromptText, publicItem, usable, _cache: cache };
