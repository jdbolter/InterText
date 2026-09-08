// Registry of texts the synthetic-reader harness knows how to drive. Deliberately
// small and hand-maintained (mirrors ALLOWED_TEXT_IDS in api/chat.js / api/evolve.js)
// rather than scanned from the filesystem, so adding a text here is a conscious
// decision, not automatic.
'use strict';

const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..', '..');

const TEXTS = {
  plenitude: {
    id: 'plenitude',
    displayTitle: 'A conversation about the Digital Plenitude',
    guideLabel: 'Guide',
    appJsPath: path.join(PROJECT_ROOT, 'plenitude', 'public', 'app.js'),
  },
  uncanny: {
    id: 'uncanny',
    displayTitle: 'A conversation about the uncanny',
    guideLabel: 'Guide',
    appJsPath: path.join(PROJECT_ROOT, 'uncanny', 'public', 'app.js'),
  },
  'blood-on-the-wall': {
    id: 'blood-on-the-wall',
    displayTitle: 'Blood on the Wall',
    guideLabel: 'Historian',
    appJsPath: path.join(PROJECT_ROOT, 'blood-on-the-wall', 'public', 'app.js'),
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
