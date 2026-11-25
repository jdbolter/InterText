// Registry of texts the synthetic-reader harness knows how to drive. Deliberately
// small and hand-maintained (mirrors ALLOWED_TEXT_IDS in api/chat.js / api/evolve.js)
// rather than scanned from the filesystem, so adding a text here is a conscious
// decision, not automatic.
'use strict';

const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..', '..');

const TEXTS = {
  'digital-plenitude': {
    id: 'digital-plenitude',
    displayTitle: 'A conversation about the Digital Plenitude (proofs edition)',
    guideLabel: 'Guide',
    // What the reader and the harness call the voice.
    voiceLabel: 'Text',
    appJsPath: path.join(PROJECT_ROOT, 'digital-plenitude', 'public', 'app.js'),
  },
  // H-001 (project intertext-paper): the DH2027 paper as an InterText.
  'intertext-paper': {
    id: 'intertext-paper',
    displayTitle: 'InterText: An AI-supported system for interactive reading',
    guideLabel: 'Guide',
    voiceLabel: 'Text',
    appJsPath: path.join(PROJECT_ROOT, 'intertext-paper', 'public', 'app.js'),
  },
};

function listTextIds() {
  return Object.keys(TEXTS);
}

function getText(textId) {
  const entry = TEXTS[textId];
  if (!entry) {
    throw new Error(`Unknown text "${textId}". Known texts: ${listTextIds().join(', ')}`);
  }
  return entry;
}

module.exports = { TEXTS, listTextIds, getText };
