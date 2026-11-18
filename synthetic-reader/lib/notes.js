'use strict';

// H-005: what a reader sees of the text's citation markers. In the interface a marker is a
// numbered note that opens the full reference; here it becomes "[n]" in the reply and a
// "Notes" list under it, numbered through the whole session as the interface numbers them.

const MARKER = /\[\[(CITE|WEB):([^\]|]+)(?:\|([^\]]*))?\]\]/g;

function plainReference(html) {
  return String(html).replace(/<[^>]+>/g, '');
}

function noteText(kind, key, locator, notes) {
  if (kind === 'CITE') {
    const ref = notes && notes.library && notes.library[key];
    if (!ref) return null;
    return `${ref.short}${locator ? ', ' + locator : ''}. ${plainReference(ref.full)}`;
  }
  const src = notes && Array.isArray(notes.web) && notes.web.find(w => w.k === Number(key));
  if (!src) return null;
  return `(web) ${src.title}. ${src.url}`;
}

function renderWithNotes(text, notes, counter) {
  const listed = [];
  const body = String(text).replace(MARKER, (_, kind, key, locator) => {
    const note = noteText(kind, key, locator, notes);
    if (!note) return '';
    counter.n += 1;
    listed.push(`[${counter.n}] ${note}`);
    return `[${counter.n}]`;
  });
  return listed.length ? `${body}\n\nNotes:\n${listed.join('\n')}` : body;
}

// A draft is never shown to the reader, so its markers are written out in place.
function renderDraftMarkers(text, notes) {
  return String(text).replace(MARKER, (_, kind, key, locator) => {
    if (kind === 'CITE') {
      const ref = notes && notes.library && notes.library[key];
      return ref ? ` (${ref.short}${locator ? ', ' + locator : ''})` : ` (${key})`;
    }
    return ` [web ${key}]`;
  });
}

module.exports = { renderDraftMarkers, renderWithNotes };
