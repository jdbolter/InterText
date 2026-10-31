// H-005 / H-007: citation notes, shared by every InterText page. The server sends [[CITE:id|pages]]
// and [[WEB:k]] markers with the notes they stand for; markers are numbered through the whole
// conversation, open the full reference in place, and gather in the References list (an element
// #references with #references-list and #references-count, when the page has one). A page whose
// replies carry no notes is unaffected: its paragraphs render exactly as before.
(function () {
// H-005: citation markers. The server sends [[CITE:id|pages]] and [[WEB:k]] markers with
// the notes they stand for; markers are numbered through the whole conversation, open the
// full reference in place, and gather in the References list.
const MARKER_SPLIT = /(\[\[(?:CITE|WEB):[^\]]+\]\])/;
const allNotes = [];

function noteFor(token, notes) {
  const cite = token.match(/^\[\[CITE:([a-z0-9-]+)(?:\|([^\]]*))?\]\]$/);
  if (cite) {
    const ref = notes && notes.library && notes.library[cite[1]];
    if (!ref) return null;
    return { kind: 'library', short: ref.short, locator: cite[2] || '', full: ref.full };
  }
  const web = token.match(/^\[\[WEB:(\d+)\]\]$/);
  if (web) {
    const src = notes && Array.isArray(notes.web) && notes.web.find(w => w.k === Number(web[1]));
    if (!src) return null;
    let site = '';
    try { site = new URL(src.url).hostname.replace(/^www\./, ''); } catch (e) {}
    return { kind: 'web', title: src.title, url: src.url, site };
  }
  return null;
}

function fillNote(el, note) {
  el.textContent = '';
  const num = document.createElement('span');
  num.className = 'note-num';
  num.textContent = note.n + '.';
  el.appendChild(num);
  if (note.kind === 'library') {
    const cite = document.createElement('span');
    cite.className = 'note-short';
    cite.textContent = note.locator ? `${note.short}, ${note.locator}.` : `${note.short}.`;
    el.appendChild(cite);
    const full = document.createElement('span');
    full.className = 'note-full';
    full.innerHTML = note.full; // trusted: from the text's own references file
    el.appendChild(full);
  } else {
    const tag = document.createElement('span');
    tag.className = 'note-web';
    tag.textContent = 'web';
    el.appendChild(tag);
    const a = document.createElement('a');
    a.href = note.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = note.title;
    el.appendChild(a);
    if (note.site) el.appendChild(document.createTextNode(` (${note.site})`));
  }
}

function addToReferenceList(note) {
  const list = document.getElementById('references-list');
  const count = document.getElementById('references-count');
  if (!list) return;
  const li = document.createElement('li');
  li.className = 'reference-item' + (note.kind === 'web' ? ' reference-web' : '');
  li.id = 'ref-' + note.n;
  fillNote(li, note);
  list.appendChild(li);
  if (count) count.textContent = String(allNotes.length);
  const panel = document.getElementById('references');
  if (panel) panel.hidden = false;
}

function renderParagraph(p, para, notes, renderText) {
  para.split(MARKER_SPLIT).forEach(piece => {
    if (!MARKER_SPLIT.test(piece)) {
      if (piece) renderText(p, piece);
      return;
    }
    const note = noteFor(piece, notes);
    if (!note) return;
    note.n = allNotes.length + 1;
    allNotes.push(note);
    addToReferenceList(note);
    const sup = document.createElement('sup');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'note-marker' + (note.kind === 'web' ? ' note-marker-web' : '');
    btn.textContent = String(note.n);
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', `Note ${note.n}`);
    btn.addEventListener('click', () => {
      const id = 'note-card-' + note.n;
      const open = document.getElementById(id);
      if (open) { open.remove(); btn.setAttribute('aria-expanded', 'false'); return; }
      const card = document.createElement('div');
      card.className = 'note-card' + (note.kind === 'web' ? ' note-card-web' : '');
      card.id = id;
      fillNote(card, note);
      p.after(card);
      btn.setAttribute('aria-expanded', 'true');
    });
    sup.appendChild(btn);
    p.appendChild(sup);
  });
}

// What a reader's contribution becomes for synthesis: markers as plain author-date.
function plainReply(text, notes) {
  return String(text)
    .replace(/\[\[CITE:([a-z0-9-]+)(?:\|([^\]]*))?\]\]/g, (_, id, loc) => {
      const ref = notes && notes.library && notes.library[id];
      return ref ? ` (${ref.short}${loc ? ', ' + loc : ''})` : '';
    })
    .replace(/\[\[WEB:\d+\]\]/g, '');
}


window.CitationNotes = { renderParagraph, plainReply };
})();
