'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { formatAdditionsBold } = require('../lib/markdownDiff');

test('bolds a word inserted into an otherwise unchanged sentence', () => {
  assert.equal(
    formatAdditionsBold('The text keeps moving.', 'The text keeps steadily moving.'),
    'The text keeps **steadily** moving.'
  );
});

test('bolds a newly added paragraph while preserving its Markdown spacing', () => {
  assert.equal(
    formatAdditionsBold('## Title\n\nFirst paragraph.', '## Title\n\nFirst paragraph.\n\nA new thought.'),
    '## Title\n\nFirst paragraph.\n\n**A new thought.**'
  );
});

test('does not mark unchanged text', () => {
  const text = '## Title\n\nNothing changed.';
  assert.equal(formatAdditionsBold(text, text), text);
});

test('represents replacements as bold revised words', () => {
  assert.equal(
    formatAdditionsBold('The old conclusion.', 'The different conclusion.'),
    'The **different** conclusion.'
  );
});

test('a short phrase reused inside an unrelated new paragraph is not matched against its other occurrence', () => {
  // Regression test using real text that reproduced the bug: a whole-document
  // word diff decided it was "cheaper" to match the quoted title "Picasso Baby"
  // in this new third paragraph against its other occurrence back in paragraph
  // one, splitting the phrase across two bold spans — `Picasso Baby**" **makes` —
  // with the closing quote mark stranded, unmarked, between them. Confirmed
  // against the prior implementation: this exact input tripped it; smaller
  // invented examples did not reliably reproduce it, so this uses the real
  // Plenitude section 1 text and a real evolution of it (see
  // INTERTEXT-DESIGN-NOTES.md §13 and the earlier session that surfaced this).
  const original = [
    '## The Great Divide',
    '',
    'In 2013, the rapper Jay Z released a video called "Picasso Baby: A Performance Art Film." The video documents a performance in an unusual venue, a "white-box" hall of the New York Pace Gallery. As he raps, Jay Z playfully confronts one by one a series of fans and "art-world types," as the New York Times article describes them (Trebay 2013). Jay Z got the idea from a work by the performance artist, Marina Abramovic, who had in 2010 staged a 30-day event at the MOMA, in which she sat motionless and stared at one seated individual after other. Abramovic herself appears as one of Jay Z\'s partners. Director Mark Romanek\'s video portrays the joyful atmosphere of an event in which well-known art figures as well as the fans are delighted to be taking part. Jay Z begins: "I just want a Picasso in my casa, no, my castle." His lyrics make reference to other twentieth-century artists (Rothko, Warhol, Basquiat, Francis Bacon), but there seems to be no particular rationale for his choices. Jay Z feels no weight of the elite artistic tradition of the twentieth century. His list includes those who functioned comfortably within the elite community and those who were challenging the status of art itself. At the end he intones: "...I\'m the modern day Pablo Picasso baby."',
    '',
    'The video includes a brief introductory interview in which Jay Z explains that he is bringing art and rap as popular culture back together. Despite the rather hostile tone of some of the lyrics, the point of the video is that Jay Z transcends the artificial barriers that separated high art from the life of everyday people, which rap is about. An artist Mickalene Thomas suggests a political dimension to this performance: "For a young black man in America to be on his level of success and rapping about art, and not what he\'s wearing, is the coolest thing..." Jay Z was indeed raised in a housing project in Brooklyn by his mother after being abandoned by his father and had early encounters with guns and drugs. And the video certainly intends to suggest his acceptance by the New York art community. The artist Marilyn Minter says that "Jay-Z speaks to the times we live in."',
  ].join('\n');

  const newParagraph =
    'One might ask whether this amounts only to borrowed prestige, or whether the encounter tests the boundary it crosses. The distinction turns on whether the event changes the terms of admission or is simply performed within them. A genuine test would produce friction — controversy over standards, perhaps rejection — and would keep making its argument after the cameras stopped, the way Duchamp\'s urinal, unremarkable in 1917, went on bending the criteria of sculpture around its presence for decades afterward. "Picasso Baby" makes no comparable claim on future practice; its content is arrival itself, not a case for what art should become. This does not mean infiltration by practice rather than argument is impossible — genres do sometimes change by repetition and extension rather than by explicit theorizing. But that kind of migration requires uptake: other artists and institutions treating rap performance, direct audience confrontation, hip-hop\'s mode of braggadocio-as-genre, as material worth curating on its own terms, not as a single afternoon remembered for who attended. Nothing in the video\'s own framing, which insists throughout on delight rather than friction, gives much signal that this is underway.';

  const revised = [
    '## The Great Divide',
    '',
    'In 2013, the rapper Jay Z released a video called "Picasso Baby: A Performance Art Film." The video documents a performance in an unusual venue, a "white-box" hall of the New York Pace Gallery. As he raps, Jay Z playfully confronts one by one a series of fans and "art-world types," as the New York Times article describes them (Trebay 2013). Jay Z got the idea from a work by the performance artist, Marina Abramovic, who had in 2010 staged a 30-day event at the MOMA, in which she sat motionless and stared at one seated individual after other. Abramovic herself appears as one of Jay Z\'s partners. Director Mark Romanek\'s video portrays the joyful atmosphere of an event in which well-known art figures as well as the fans are delighted to be taking part. Jay Z begins: "I just want a Picasso in my casa, no, my castle." His lyrics make reference to other twentieth-century artists (Rothko, Warhol, Basquiat, Francis Bacon), but there seems to be no particular rationale for his choices, no argument about what distinguishes an artist who worked comfortably within the elite community from one who challenged the status of art itself. They function as equivalent signifiers of arrival rather than positions in a case being made. At the end he intones: "...I\'m the modern day Pablo Picasso baby" — a claim about status, about having crossed a threshold, not a claim that proposes any new criterion for what art should include.',
    '',
    'The video includes a brief introductory interview in which Jay Z explains that he is bringing art and rap as popular culture back together. Despite the rather hostile tone of some of the lyrics, the point of the video is that Jay Z transcends the artificial barriers that separated high art from the life of everyday people, which rap is about. An artist Mickalene Thomas suggests a political dimension to this performance: "For a young black man in America to be on his level of success and rapping about art, and not what he\'s wearing, is the coolest thing..." Jay Z was indeed raised in a housing project in Brooklyn by his mother after being abandoned by his father and had early encounters with guns and drugs. And the video certainly intends to suggest his acceptance by the New York art community. The artist Marilyn Minter says that "Jay-Z speaks to the times we live in" — a remark that treats the event as a symptom worth noting rather than a challenge that unsettles anyone\'s criteria of judgment. Thomas\'s comment comes closer to registering something more than validation-seeking, since it locates meaning in who gets to occupy the space rather than in what the space is for; but even that reading concedes the space\'s authority rather than dismantling it, arguing for inclusion on existing terms of prestige rather than for different terms altogether.',
    '',
    newParagraph,
  ].join('\n');

  const highlighted = formatAdditionsBold(original, revised);

  // Round-trip integrity always holds regardless of highlighting quality.
  assert.equal(highlighted.replace(/\*\*/g, ''), revised);
  // The quoted phrase must not be split across two bold spans, in either direction.
  assert.doesNotMatch(highlighted, /Picasso Baby\*\*"/);
  assert.doesNotMatch(highlighted, /"\*\*Picasso/);
  // The wholly new fourth paragraph must appear as one clean, fully-bolded
  // insertion — not diffed word-by-word against an unrelated earlier paragraph.
  const paragraphs = highlighted.split(/\n\n/u);
  assert.equal(paragraphs[3], `**${newParagraph}**`);
});
