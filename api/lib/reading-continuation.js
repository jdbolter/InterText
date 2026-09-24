'use strict';

const STANDARD_CONTINUE_MESSAGE = 'Continue reading from where we have reached in this section.';
const OPENING_CONTINUE_MESSAGE = 'Continue directly from the boxed opening into the beginning of this section.';

function resolveFirstContinuation({ continuing, requestedFirstContinuation, context }) {
  return continuing === true &&
    requestedFirstContinuation === true &&
    Array.isArray(context) &&
    context.length === 0;
}

function buildContinuationInstructions({ continuing, firstContinuation, editorialReading }) {
  if (!continuing) return null;

  const openingBoundary = firstContinuation
    ? `This is the first continuation after the boxed opening. The box is a prologue, not part of the section-reading transcript, and the opening boundary is BEFORE the first supplied passage. Its details may overlap with or anticipate material anywhere in the section; that does not mean those passages have already been covered. Only the opening passage is supplied on this turn. Begin there and connect its unpresented claims directly to the box's final thought. Stay within that opening material. It is fine to stop partway through it; do not compress or omit material merely to finish it. Avoid needless verbatim repetition of facts already stated in the box, but do not skip any substantive claim, example, distinction, or transition.`
    : `Use the exchanges below as the reading cursor. Resume substantive material not yet covered rather than repeating the opening or continuing a digression indefinitely.`;

  const completionSignal = firstContinuation
    ? `This opening turn cannot complete the section. Set sectionComplete to false if using the private delivery tool, and never emit [[SECTION_COMPLETE]].`
    : editorialReading
    ? `When ALL the packaged section's substantive material and useful elaboration have been covered, set sectionComplete to true in the required private delivery tool. If they were already covered, return an empty response with sectionComplete true. Otherwise set it to false. Do not move into the next section yourself or invent additional material merely to keep going.`
    : `When ALL the section's substantive material and useful elaboration have been covered, append [[SECTION_COMPLETE]] on a line by itself after the final passage. If they were already covered, return only [[SECTION_COMPLETE]]. Otherwise do not emit this marker. Do not move into the next section yourself or invent additional material merely to keep going. This is an internal navigation signal, never prose for the reader.`;

  return `The reader pressed Enter to continue reading. ${openingBoundary}

Present the current text directly, with its voice and concrete details; do not summarize the entire section, describe your process, announce that you are continuing, ask a question, or say what the essay or author argues. A natural passage of up to 250 words is enough for this turn. Brief elaboration may connect the passage to the reader's interests, but return to the section's remaining material.

${completionSignal}`;
}

function openingSectionText(sectionText) {
  const text = typeof sectionText === 'string' ? sectionText.trim() : '';
  if (!text) return text;

  const marker = '<!-- intertext:passage ';
  const firstMarker = text.indexOf(marker);
  const secondMarker = firstMarker >= 0 ? text.indexOf(marker, firstMarker + marker.length) : -1;
  if (secondMarker >= 0) return text.slice(0, secondMarker).trim();

  const blocks = text.split(/\n\s*\n/u);
  const firstBody = blocks.find(block => !/^#{1,6}\s/u.test(block.trim()));
  return (firstBody || blocks[0] || '').trim();
}

function continuationUserMessage(firstContinuation) {
  return firstContinuation ? OPENING_CONTINUE_MESSAGE : STANDARD_CONTINUE_MESSAGE;
}

module.exports = {
  buildContinuationInstructions,
  continuationUserMessage,
  openingSectionText,
  resolveFirstContinuation,
};
