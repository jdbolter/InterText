'use strict';

// H-003: optional per-text extras for ordinary (non-editorial) readings.
// A text whose config omits these fields behaves exactly as before.

const fs = require('fs');
const path = require('path');

const DEFAULT_SECTION_LABEL = 'Current section';
// H-007: every text now defaults to claude-sonnet-5-5 (H-004a introduced the per-text setting).
const DEFAULT_TEXT_MODEL = 'claude-sonnet-5-5';

// The model that writes a text's replies and evolves its sections; a text without `model`
// uses the shared default.
function textModel(config) {
  return config && typeof config.model === 'string' && config.model.trim()
    ? config.model.trim()
    : DEFAULT_TEXT_MODEL;
}

// The editorial path forces a tool call (tool_choice 'tool'), which claude-sonnet-5-5 does not
// support ("tool_choice: type \"tool\" and \"any\" are not supported for this model", npm run
// check-models, 2026-11-01). Editorial readings and editorial evolution therefore stay on
// claude-sonnet-5; a text may set config.editorialModel to a model that supports forced tools.
const DEFAULT_EDITORIAL_MODEL = 'claude-sonnet-5';
function editorialModel(config) {
  return config && typeof config.editorialModel === 'string' && config.editorialModel.trim()
    ? config.editorialModel.trim()
    : DEFAULT_EDITORIAL_MODEL;
}

// Models differ in how thinking is turned off. claude-sonnet-5 takes { type: 'disabled' };
// claude-sonnet-5-5 rejects that and takes { type: 'between_tools' } (it then does not
// think before replying). Found on 2026-10-30, when every H-004b revision call failed.
const THINKING_OFF = { 'claude-sonnet-5-5': 'between_tools' };
function thinkingOff(model) {
  return { type: THINKING_OFF[model] || 'disabled' };
}

// H-014: a text whose config lists `chapters` ({ number, title, firstSection, point }, in order)
// is one work in several chapters; each section belongs to the last chapter starting at or before it.
function chapterFor(config, sectionIndex) {
  if (!config || !Array.isArray(config.chapters) || !Number.isInteger(sectionIndex)) return null;
  let found = null;
  for (const chapter of config.chapters) {
    if (chapter && Number.isInteger(chapter.firstSection) && chapter.firstSection <= sectionIndex) found = chapter;
  }
  return found;
}

function sectionLabelLine(config, sectionName, sectionIndex) {
  const label = config && typeof config.sectionLabel === 'string' && config.sectionLabel.trim()
    ? config.sectionLabel.trim()
    : DEFAULT_SECTION_LABEL;
  const chapter = chapterFor(config, sectionIndex);
  if (!chapter) return `${label}: ${sectionName}`;
  // A chapter with a label (the Conclusion) is named by the label alone.
  return chapter.label
    ? `${label}: ${sectionName} (${chapter.label})`
    : `${label}: ${sectionName} (chapter ${chapter.number}, ${chapter.title})`;
}

// H-009: the main line of the argument at this point (a section statement, and one for the
// chapter), handed to the model before every reply so that it can steer back to it.
function mainLineStatement(config, sectionIndex) {
  if (!config) return null;
  const point = Array.isArray(config.sectionPoints) && typeof config.sectionPoints[sectionIndex] === 'string'
    ? config.sectionPoints[sectionIndex].trim() : '';
  // H-014: with chapters, the chapter's own point; otherwise the single chapterPoint.
  const inChapter = chapterFor(config, sectionIndex);
  const chapter = inChapter
    ? (typeof inChapter.point === 'string' ? inChapter.point.trim() : '')
    : (typeof config.chapterPoint === 'string' ? config.chapterPoint.trim() : '');
  if (!point && !chapter) return null;
  const chapterLabel = !inChapter ? 'The chapter as a whole'
    : inChapter.label ? `The ${inChapter.label} as a whole`
      : `Chapter ${inChapter.number}, ${inChapter.title}, as a whole`;
  return [
    point ? `The argument here, in brief: ${point}` : null,
    chapter ? `${chapterLabel}: ${chapter}` : null,
  ].filter(Boolean).join('\n');
}

// H-010: the main line is named plainly in the opening paragraph of a reply to the reader, right
// after the direct answer (Jay: the point should be announced, not buried at the end).
function mainLineText(config, sectionIndex) {
  const statement = mainLineStatement(config, sectionIndex);
  if (!statement) return null;
  return `${statement}\nWhen you answer a message from the reader, state this point in your opening paragraph, right after the direct answer, as a claim about culture and media in words fresh to this reply, and let the rest of the reply bear on it. The statement above is for you to steer by: the reply says the point itself, and never calls it a main line, a thesis or an argument.`;
}

const libraryListCache = new Map();

// Returns the system-prompt text for a section's fund of citable works, or null.
// Editorial readings carry their own fund mechanism and never receive this block.
function loadLibraryList(config, sectionIndex, { editorial = false, readFile = fs.readFileSync } = {}) {
  if (editorial || !config || !Array.isArray(config.libraryLists)) return null;
  const file = config.libraryLists[sectionIndex];
  if (typeof file !== 'string' || !file.trim() || typeof config.libraryListsDir !== 'string') return null;
  const fullPath = path.join(config.libraryListsDir, file);
  if (!libraryListCache.has(fullPath)) {
    libraryListCache.set(fullPath, String(readFile(fullPath, 'utf8')).trim());
  }
  const body = libraryListCache.get(fullPath);
  if (!body) return null;
  const preamble = typeof config.libraryPreamble === 'string' ? config.libraryPreamble.trim() : '';
  return preamble ? `${preamble}\n\n${body}` : body;
}

function clearLibraryListCache() {
  libraryListCache.clear();
}

module.exports = {
  DEFAULT_SECTION_LABEL,
  DEFAULT_EDITORIAL_MODEL,
  DEFAULT_TEXT_MODEL,
  THINKING_OFF,
  chapterFor,
  clearLibraryListCache,
  editorialModel,
  loadLibraryList,
  mainLineStatement,
  mainLineText,
  sectionLabelLine,
  textModel,
  thinkingOff,
};
