#!/usr/bin/env node
// 2026-11-14 (H-021): measures a reading round. Reads the session.json files under one or more
// directories (a round's folder, as the vault's run scripts write it) and prints, per run and in
// all, what the hand-offs have been measuring by hand: how long the replies run, how many notes
// they carry, what the text says about itself, what repeats from reply to reply, how the reader
// fared (its private reflections), whether the revision pass ran, and what the calls cost.
//
//   npm run reading-report -- <dir> [<dir> …] [--limit 250] [--json]
//
// Generated text is only counted here, never quoted (the vault's exemplar wall).
'use strict';

const fs = require('fs');
const path = require('path');
const { countWords, proseOf } = require('../api/lib/words');

const DEFAULT_LIMIT = 250;
// Phrases by which the text would be speaking about itself rather than the world (H-013 found
// "the main line" in 21 of 68 replies). Philadelphia's Main Line is not counted.
const SELF_REFERENCE = [
  /(?<!Philadelphia's |Philadelphia )\bmain line\b(?! (high|society|heiress|families|suburbs|of Philadelphia))(?![^.]*Philadelphia)/i,
  /\bthe (argument|thesis|claim|point) (here|of (this|the) (section|chapter|work|book))\b/i,
  /\b(this|the present) (section|chapter)\b/i,
  /\bthe (work|book|essay|text)'s (argument|claim|thesis|account)\b/i,
  /\bas (the|this) (work|book|essay|text) (argues|claims|says|puts it)\b/i,
];
const LEVELS = { low: 1, medium: 2, high: 3 };
const CONFUSION = { none: 0, mild: 1, significant: 2 };

function findSessions(dirs) {
  const found = [];
  for (const dir of dirs) {
    const stat = fs.statSync(dir);
    if (stat.isFile()) { found.push(dir); continue; }
    walk(dir, found, 0);
  }
  return found.sort();
}

function walk(dir, out, depth) {
  if (depth > 3) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out, depth + 1);
    else if (name === 'session.json') out.push(full);
  }
}

// The reply as the reader read it: the prose before the "Notes:" list the transcript adds.
function replyBody(text) {
  return String(text || '').split(/\n\nNotes:\n/)[0];
}

function noteCount(text) {
  const notes = String(text || '').split(/\n\nNotes:\n/)[1];
  if (!notes) return { all: 0, web: 0 };
  const lines = notes.split('\n').filter(l => /^\[\d+\]/.test(l));
  return { all: lines.length, web: lines.filter(l => /^\[\d+\] \(web\)/.test(l)).length };
}

function wordsOf(text) {
  return proseOf(text).toLowerCase().replace(/[^\p{L}\p{N}'’\s]/gu, ' ').split(/\s+/).filter(Boolean);
}

// Runs of `n` words that appear in more than one reply of a session: what the text repeats.
function repeatedRuns(replies, n = 7) {
  const seen = new Map();
  replies.forEach((reply, i) => {
    const words = wordsOf(reply);
    const own = new Set();
    for (let k = 0; k + n <= words.length; k += 1) own.add(words.slice(k, k + n).join(' '));
    for (const run of own) {
      if (!seen.has(run)) seen.set(run, new Set());
      seen.get(run).add(i);
    }
  });
  let repeated = 0;
  for (const where of seen.values()) if (where.size > 1) repeated += 1;
  return repeated;
}

// A closing sentence that an earlier reply also closed on.
function repeatedClosings(replies) {
  const closings = replies.map(r => {
    const sentences = proseOf(r).trim().split(/(?<=[.!?])\s+/);
    return wordsOf(sentences[sentences.length - 1] || '').join(' ');
  }).filter(Boolean);
  const counts = new Map();
  closings.forEach(c => counts.set(c, (counts.get(c) || 0) + 1));
  let repeated = 0;
  for (const c of counts.values()) if (c > 1) repeated += c - 1;
  return repeated;
}

function selfReferences(text) {
  return SELF_REFERENCE.some(re => re.test(proseOf(text)));
}

function mean(xs) { return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0; }
function median(xs) {
  if (!xs.length) return 0;
  const s = xs.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function usageOf(turn) {
  const r = turn.revision && turn.revision.usage ? turn.revision.usage : {};
  const sum = { input: 0, cacheWrite: 0, cacheRead: 0, output: 0, thinking: 0 };
  for (const u of [r.reply, r.revision]) {
    if (!u) continue;
    sum.input += u.input_tokens || 0;
    sum.cacheWrite += u.cache_creation_input_tokens || 0;
    sum.cacheRead += u.cache_read_input_tokens || 0;
    sum.output += u.output_tokens || 0;
    sum.thinking += (u.output_tokens_details && u.output_tokens_details.thinking_tokens) || 0;
  }
  return sum;
}

function measureSession(session, { limit = DEFAULT_LIMIT } = {}) {
  const meta = session.meta || {};
  const turns = Array.isArray(session.turns) ? session.turns : [];
  const replies = turns.filter(t => typeof t.guideResponse === 'string' && t.guideResponse.trim());
  const bodies = replies.map(t => replyBody(t.guideResponse));
  const words = bodies.map(countWords);
  const toMessages = replies.filter(t => t.action === 'message');
  const returns = replies.filter(t => t.action === 'continue');
  const notes = replies.map(t => noteCount(t.guideResponse));
  const actions = {};
  turns.forEach(t => { actions[t.action] = (actions[t.action] || 0) + 1; });
  const reflections = turns.map(t => t.privateReflection).filter(Boolean);
  const revised = replies.filter(t => t.revision && t.revision.applied === true);
  const draftWords = replies.filter(t => t.revision && typeof t.revision.draft === 'string').map(t => countWords(t.revision.draft));
  const usage = { input: 0, cacheWrite: 0, cacheRead: 0, output: 0, thinking: 0 };
  replies.forEach(t => { const u = usageOf(t); for (const k of Object.keys(usage)) usage[k] += u[k]; });
  const cacheable = usage.input + usage.cacheWrite + usage.cacheRead;
  const sections = new Set(turns.map(t => t.sectionNumber));
  return {
    run: `${meta.profileId || '?'} · section ${(meta.startSectionIndex || 0) + 1}`,
    profile: meta.profileId || null,
    section: (meta.startSectionIndex || 0) + 1,
    edition: meta.edition || null,
    stopReason: session.stopReason || null,
    turns: turns.length,
    actions,
    sectionsRead: sections.size,
    replies: replies.length,
    toMessages: toMessages.length,
    returns: returns.length,
    words: { mean: Math.round(mean(words)), median: median(words), max: Math.max(0, ...words), over: words.filter(w => w > limit).length, limit },
    notes: {
      perReply: Number(mean(notes.map(n => n.all)).toFixed(2)),
      max: Math.max(0, ...notes.map(n => n.all)),
      web: notes.reduce((a, n) => a + n.web, 0),
      first: notes.length ? notes[0].all : 0,
      none: notes.filter(n => n.all === 0).length,
    },
    selfReference: bodies.filter(selfReferences).length,
    repeatedRuns: repeatedRuns(bodies),
    repeatedClosings: repeatedClosings(bodies),
    reflection: {
      understanding: Number(mean(reflections.map(r => LEVELS[r.understanding] || 0)).toFixed(2)),
      interest: Number(mean(reflections.map(r => LEVELS[r.interest] || 0)).toFixed(2)),
      confusion: Number(mean(reflections.map(r => CONFUSION[r.confusion] || 0)).toFixed(2)),
      confused: reflections.filter(r => r.confusion === 'significant').length,
    },
    revision: {
      applied: revised.length,
      of: replies.filter(t => t.revision).length,
      draftWords: draftWords.length ? Math.round(mean(draftWords)) : null,
      reasons: replies.filter(t => t.revision && !t.revision.applied).map(t => t.revision.reason || 'unknown'),
    },
    usage: { ...usage, cacheShare: cacheable ? Number((usage.cacheRead / cacheable).toFixed(2)) : null },
    media: replies.filter(t => /\[A media item appears here|\[An image appears here/.test(t.guideResponse)).length,
  };
}

function totals(runs) {
  const n = runs.length || 1;
  const w = (f) => Math.round(runs.reduce((a, r) => a + f(r) * r.replies, 0) / Math.max(1, runs.reduce((a, r) => a + r.replies, 0)));
  const sum = (f) => runs.reduce((a, r) => a + f(r), 0);
  const avg = (f) => Number((runs.reduce((a, r) => a + f(r), 0) / n).toFixed(2));
  const usage = { input: sum(r => r.usage.input), cacheWrite: sum(r => r.usage.cacheWrite), cacheRead: sum(r => r.usage.cacheRead), output: sum(r => r.usage.output), thinking: sum(r => r.usage.thinking) };
  const cacheable = usage.input + usage.cacheWrite + usage.cacheRead;
  return {
    run: 'all',
    runs: runs.length,
    turns: sum(r => r.turns),
    replies: sum(r => r.replies),
    toMessages: sum(r => r.toMessages),
    returns: sum(r => r.returns),
    words: { mean: w(r => r.words.mean), over: sum(r => r.words.over), max: Math.max(0, ...runs.map(r => r.words.max)), limit: runs[0] ? runs[0].words.limit : DEFAULT_LIMIT },
    notes: { perReply: Number((sum(r => r.notes.perReply * r.replies) / Math.max(1, sum(r => r.replies))).toFixed(2)), web: sum(r => r.notes.web), none: sum(r => r.notes.none) },
    selfReference: sum(r => r.selfReference),
    repeatedRuns: sum(r => r.repeatedRuns),
    repeatedClosings: sum(r => r.repeatedClosings),
    reflection: { understanding: avg(r => r.reflection.understanding), interest: avg(r => r.reflection.interest), confusion: avg(r => r.reflection.confusion), confused: sum(r => r.reflection.confused) },
    revision: { applied: sum(r => r.revision.applied), of: sum(r => r.revision.of) },
    usage: { ...usage, cacheShare: cacheable ? Number((usage.cacheRead / cacheable).toFixed(2)) : null },
    media: sum(r => r.media),
    finished: runs.filter(r => r.stopReason === 'reader_finished').length,
    errors: runs.filter(r => r.stopReason === 'error').length,
  };
}

function pad(s, n) { s = String(s); return s.length >= n ? s : s + ' '.repeat(n - s.length); }

function formatTable(runs, all) {
  const cols = [
    ['run', r => r.run, 26],
    ['replies', r => `${r.replies} (${r.toMessages}m/${r.returns}r)`, 14],
    ['words', r => `${r.words.mean} avg, ${r.words.over} over ${r.words.limit}`, 22],
    ['notes/reply', r => `${r.notes.perReply}${r.notes.web ? ` (${r.notes.web} web)` : ''}`, 14],
    ['self-ref', r => r.selfReference, 9],
    ['repeats', r => `${r.repeatedRuns} runs, ${r.repeatedClosings} closings`, 20],
    ['reader u/i/c', r => `${r.reflection.understanding}/${r.reflection.interest}/${r.reflection.confusion}`, 14],
    ['revised', r => `${r.revision.applied}/${r.revision.of}`, 8],
    ['cache', r => r.usage.cacheShare === null ? '–' : `${Math.round(r.usage.cacheShare * 100)}%`, 6],
  ];
  const lines = [cols.map(([h, , w]) => pad(h, w)).join(' ')];
  lines.push(cols.map(([, , w]) => '-'.repeat(w)).join(' '));
  for (const r of [...runs, all]) lines.push(cols.map(([, f, w]) => pad(f(r), w)).join(' '));
  const notes = [
    '',
    `replies: n (m = replies to the reader's messages, r = Return turns). words: the prose a reader sees, notes left out.`,
    `self-ref: replies in which the text speaks of its own argument, section or main line. repeats: seven-word runs shared`,
    `by two or more replies of a run, and closing sentences used more than once. reader u/i/c: the reader's private`,
    `understanding and interest (1 low to 3 high) and confusion (0 none to 2 significant). cache: the share of the calls'`,
    `input tokens read from the cache.`,
    `${all.finished} of ${all.runs} runs ended by the reader's choice; ${all.errors} stopped on an error. Tokens: ${all.usage.input + all.usage.cacheWrite + all.usage.cacheRead} in (${all.usage.cacheRead} cached), ${all.usage.output} out (${all.usage.thinking} thinking).`,
  ];
  const reasons = runs.flatMap(r => r.revision.reasons.map(reason => `${r.run}: ${reason}`));
  if (reasons.length) notes.push(`Revisions not applied: ${reasons.join('; ')}.`);
  return lines.concat(notes).join('\n');
}

function report(dirs, { limit = DEFAULT_LIMIT } = {}) {
  const files = findSessions(dirs);
  const runs = files.map(f => measureSession(JSON.parse(fs.readFileSync(f, 'utf8')), { limit }));
  return { files, runs, all: totals(runs) };
}

function main(argv) {
  const dirs = [];
  let limit = DEFAULT_LIMIT;
  let json = false;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--limit') { limit = Number(argv[i + 1]); i += 1; continue; }
    if (argv[i] === '--json') { json = true; continue; }
    dirs.push(argv[i]);
  }
  if (dirs.length === 0) {
    process.stdout.write('Usage: npm run reading-report -- <dir> [<dir> …] [--limit 250] [--json]\n');
    process.exitCode = 1;
    return;
  }
  const out = report(dirs, { limit });
  if (out.runs.length === 0) {
    process.stdout.write('No session.json found under the given directories.\n');
    process.exitCode = 1;
    return;
  }
  process.stdout.write(json ? `${JSON.stringify(out, null, 2)}\n` : `${formatTable(out.runs, out.all)}\n`);
}

if (require.main === module) main(process.argv.slice(2));

module.exports = { measureSession, totals, formatTable, report, repeatedRuns, repeatedClosings, selfReferences, noteCount, replyBody, SELF_REFERENCE };
