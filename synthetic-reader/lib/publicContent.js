// Extracts the reader-visible section metadata (numerals, titles, intros) directly
// from a text's public/app.js — the same file the browser loads — rather than from
// its per-text configuration module or its raw source-text folder. That distinction
// matters: the configuration module carries behavioral instructions and the full
// section text the model uses to answer, and the source-text folder holds the raw
// essay; neither is ever shown to a reader as such. app.js's
// SECTION_TITLES/SECTION_INTROS/SECTION_NUMERALS are exactly and only what renders in
// the TOC sidebar and the intro box a human reader sees, so this is the one file the
// synthetic reader is allowed to read from disk.
//
// app.js is written for a browser (it references `document` at the top level) and
// can't simply be `require()`d under Node. Rather than hand-parse the array literals
// with regex — fragile the moment a string inside them contains a stray bracket —
// this runs the *entire* file in a sandboxed vm context with a minimal, permissive
// DOM stub standing in for `document`. Real V8 parses and executes the file, so
// quoting, template literals, and formatting are all handled correctly; we just read
// the resulting globals back out afterward. Only module-load-time code runs (event
// handlers are registered but never fired), so nothing interactive — sending a
// message, navigating sections — actually happens during extraction.
'use strict';

const fs = require('fs');
const vm = require('vm');

const REQUIRED_GLOBALS = ['SECTION_NUMERALS', 'SECTION_TITLES', 'SECTION_INTROS'];

// A permissive stand-in for any DOM element: reading an unknown property returns a
// no-op function (so `.addEventListener(...)`, `.appendChild(...)`, etc. all work
// without complaint), while `classList`/`style`/`dataset` resolve to small mutable
// stand-ins. This is deliberately generic rather than an exhaustive DOM mock — the
// goal is only to let app.js's top-level statements run to completion, not to
// simulate the UI.
function makeStubElement() {
  const store = { classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, dataset: {}, style: {} };
  return new Proxy(store, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === 'then') return undefined; // don't look thenable to any accidental await
      return (..._args) => makeStubElement();
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  });
}

function makeDocumentStub() {
  return {
    getElementById: () => makeStubElement(),
    querySelectorAll: () => [],
    createElement: () => makeStubElement(),
    addEventListener() {},
  };
}

/**
 * Reads {textEntry.appJsPath} and returns the reader-visible section metadata.
 * Throws with a clear message if the file is missing or doesn't define the
 * expected globals — this fails loudly rather than silently returning partial
 * data, since a format change here means the harness may be looking at stale or
 * wrong content for what a reader sees.
 */
function extractPublicSectionData(textEntry) {
  let source;
  try {
    source = fs.readFileSync(textEntry.appJsPath, 'utf8');
  } catch (err) {
    throw new Error(`Could not read ${textEntry.appJsPath} for text "${textEntry.id}": ${err.message}`);
  }

  // Top-level `const NAME = ...` in classic-script vm execution stays scoped to the
  // script and isn't reachable afterward, so rewrite just those declarations to
  // attach to the sandbox's global object instead. Only ever rewrites the four
  // names this module reads back; every other declaration in app.js (history,
  // sectionIndex, helper functions, ...) is left as an ordinary script-scoped
  // binding and never touches the sandbox.
  const EXPOSED = [...REQUIRED_GLOBALS, 'SECTION_IMAGES'];
  const pattern = new RegExp(`^const (${EXPOSED.join('|')}) = `, 'gm');
  const rewritten = source.replace(pattern, 'globalThis.$1 = ');

  const sandbox = { document: makeDocumentStub(), console: { error() {}, log() {}, warn() {} } };
  vm.createContext(sandbox);
  try {
    vm.runInContext(rewritten, sandbox, { filename: textEntry.appJsPath, timeout: 5000 });
  } catch (err) {
    throw new Error(`Failed to load public section data from ${textEntry.appJsPath}: ${err.message}`);
  }

  const missing = REQUIRED_GLOBALS.filter((name) => !Array.isArray(sandbox[name]));
  if (missing.length > 0) {
    throw new Error(
      `${textEntry.appJsPath} did not define expected array(s): ${missing.join(', ')}. ` +
        'The synthetic-reader harness only reads reader-visible data from app.js — if its ' +
        'structure changed, update synthetic-reader/lib/publicContent.js to match.'
    );
  }

  const { SECTION_NUMERALS, SECTION_TITLES, SECTION_INTROS } = sandbox;
  if (SECTION_TITLES.length !== SECTION_INTROS.length || SECTION_TITLES.length !== SECTION_NUMERALS.length) {
    throw new Error(
      `${textEntry.appJsPath}: SECTION_NUMERALS (${SECTION_NUMERALS.length}), SECTION_TITLES ` +
        `(${SECTION_TITLES.length}) and SECTION_INTROS (${SECTION_INTROS.length}) have mismatched lengths.`
    );
  }

  const sections = SECTION_TITLES.map((title, i) => ({
    number: i + 1,
    numeral: SECTION_NUMERALS[i],
    title,
    // Intros are stored as small HTML fragments (a single <p>...</p> with a few
    // entities) for direct innerHTML assignment in the browser. Strip that down to
    // plain text — a reader sees rendered prose, not markup.
    intro: stripHtml(SECTION_INTROS[i]),
  }));

  return { sections };
}

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&mdash;/g, '—')
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&eacute;/g, 'é')
    .replace(/&egrave;/g, 'è')
    .replace(/&amp;/g, '&')
    .trim();
}

module.exports = { extractPublicSectionData };
