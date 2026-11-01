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

function sectionLabelLine(config, sectionName) {
  const label = config && typeof config.sectionLabel === 'string' && config.sectionLabel.trim()
    ? config.sectionLabel.trim()
    : DEFAULT_SECTION_LABEL;
  return `${label}: ${sectionName}`;
}

// H-009: the main line of the argument at this point (a section statement, and one for the
// chapter), handed to the model before every reply so that it can steer back to it.
function mainLineStatement(config, sectionIndex) {
  if (!config) return null;
  const point = Array.isArray(config.sectionPoints) && typeof config.sectionPoints[sectionIndex] === 'string'
    ? config.sectionPoints[sectionIndex].trim() : '';
  const chapter = typeof config.chapterPoint === 'string' ? config.chapterPoint.trim() : '';
  if (!point && !chapter) return null;
  return [
    point ? `The main line at this point: ${point}` : null,
    chapter ? `The chapter as a whole: ${chapter}` : null,
  ].filter(Boolean).join('\n');
}

// H-010: the main line is named plainly in the opening paragraph of a reply to the reader, right
// after the direct answer (Jay: the point should be announced, not buried at the end).
function mainLineText(config, sectionIndex) {
  const statement = mainLineStatement(config, sectionIndex);
  if (!statement) return null;
  return `${statement}\nWhen you answer a message from the reader, name this main line plainly, in so many words, in your opening paragraph, right after the direct answer, and let the rest of the reply bear on it; do not leave the reader to infer it.`;
}

const fundCache = new Map();

// Returns the system-prompt text for a section's fund of citable works, or null.
// Editorial readings carry their own fund mechanism and never receive this block.
function loadSectionFund(config, sectionIndex, { editorial = false, readFile = fs.readFileSync } = {}) {
  if (editorial || !config || !Array.isArray(config.sectionFunds)) return null;
  const file = config.sectionFunds[sectionIndex];
  if (typeof file !== 'string' || !file.trim() || typeof config.fundsDir !== 'string') return null;
  const fullPath = path.join(config.fundsDir, file);
  if (!fundCache.has(fullPath)) {
    fundCache.set(fullPath, String(readFile(fullPath, 'utf8')).trim());
  }
  const body = fundCache.get(fullPath);
  if (!body) return null;
  const preamble = typeof config.fundPreamble === 'string' ? config.fundPreamble.trim() : '';
  return preamble ? `${preamble}\n\n${body}` : body;
}

function clearFundCache() {
  fundCache.clear();
}

module.exports = {
  DEFAULT_SECTION_LABEL,
  DEFAULT_EDITORIAL_MODEL,
  DEFAULT_TEXT_MODEL,
  THINKING_OFF,
  clearFundCache,
  editorialModel,
  loadSectionFund,
  mainLineStatement,
  mainLineText,
  sectionLabelLine,
  textModel,
  thinkingOff,
};
