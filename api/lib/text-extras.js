'use strict';

// H-003: optional per-text extras for ordinary (non-editorial) readings.
// A text whose config omits these fields behaves exactly as before.

const fs = require('fs');
const path = require('path');

const DEFAULT_SECTION_LABEL = 'Current section';
const DEFAULT_TEXT_MODEL = 'claude-sonnet-5';

// H-004a: the model that writes a text's replies; a text without `model` keeps the shared default.
function textModel(config) {
  return config && typeof config.model === 'string' && config.model.trim()
    ? config.model.trim()
    : DEFAULT_TEXT_MODEL;
}

function sectionLabelLine(config, sectionName) {
  const label = config && typeof config.sectionLabel === 'string' && config.sectionLabel.trim()
    ? config.sectionLabel.trim()
    : DEFAULT_SECTION_LABEL;
  return `${label}: ${sectionName}`;
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
  DEFAULT_TEXT_MODEL,
  clearFundCache,
  loadSectionFund,
  sectionLabelLine,
  textModel,
};
