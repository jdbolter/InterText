// The structured action a simulated reader chooses each turn, and the JSON Schema
// used to force the OpenAI Responses API to return exactly that shape (Structured
// Outputs, `text.format.type: 'json_schema'`, `strict: true`). Strict mode requires
// every property to be listed in `required`, so fields that only apply to some
// actions (message, target_section, stop_reason) are typed as nullable rather than
// left optional — the model sets them to `null` when they don't apply, and
// `validateAction` below enforces the real per-action requirement afterward.
'use strict';

const ACTIONS = ['message', 'continue', 'navigate', 'finish'];
const LEVELS = ['low', 'medium', 'high'];
const CONFUSION_LEVELS = ['none', 'mild', 'significant'];

const READER_ACTION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ACTIONS,
      description:
        "'message' to send a question/comment/reaction to the guide, 'continue' to press " +
        "Return with no message and keep reading, 'navigate' to jump to a different section " +
        "from the table of contents, or 'finish' to end the reading session now.",
    },
    message: {
      type: ['string', 'null'],
      description: "The text to send. Required (non-null) only when action is 'message'; null otherwise.",
    },
    target_section: {
      type: ['integer', 'null'],
      description:
        "The 1-based section number to jump to. Required (non-null) only when action is 'navigate'; null otherwise.",
    },
    stop_reason: {
      type: ['string', 'null'],
      description:
        "A short, first-person reason for ending the session. Required (non-null) only when action is 'finish'; null otherwise.",
    },
    private_reflection: {
      type: 'object',
      description:
        'Your private reaction to what you just read, for the test log only. This is never shown to the guide or ' +
        'sent back into the conversation — be honest rather than diplomatic.',
      properties: {
        understanding: { type: 'string', enum: LEVELS, description: 'How well you followed the material just now.' },
        confusion: { type: 'string', enum: CONFUSION_LEVELS, description: 'How confused you feel right now.' },
        interest: { type: 'string', enum: LEVELS, description: 'How engaged/interested you feel right now.' },
        note: { type: 'string', description: 'One or two sentences of private reflection explaining the above and/or this turn’s choice.' },
      },
      required: ['understanding', 'confusion', 'interest', 'note'],
      additionalProperties: false,
    },
  },
  required: ['action', 'message', 'target_section', 'stop_reason', 'private_reflection'],
  additionalProperties: false,
};

/**
 * Validates a parsed action object against the real per-action requirements that
 * the JSON Schema alone can't express (e.g. "message must be non-null when action
 * is 'message'"). Returns { ok: true } or { ok: false, error: string }.
 */
function validateAction(action) {
  if (!action || typeof action !== 'object') return { ok: false, error: 'Action is not an object.' };
  if (!ACTIONS.includes(action.action)) {
    return { ok: false, error: `Unknown action "${action.action}". Expected one of: ${ACTIONS.join(', ')}.` };
  }
  if (action.action === 'message' && (typeof action.message !== 'string' || !action.message.trim())) {
    return { ok: false, error: "action is 'message' but message is missing/empty." };
  }
  if (action.action === 'navigate' && !Number.isInteger(action.target_section)) {
    return { ok: false, error: "action is 'navigate' but target_section is not an integer." };
  }
  if (action.action === 'finish' && (typeof action.stop_reason !== 'string' || !action.stop_reason.trim())) {
    return { ok: false, error: "action is 'finish' but stop_reason is missing/empty." };
  }
  const pr = action.private_reflection;
  if (!pr || typeof pr !== 'object') return { ok: false, error: 'private_reflection is missing.' };
  if (!LEVELS.includes(pr.understanding)) return { ok: false, error: 'private_reflection.understanding is invalid.' };
  if (!CONFUSION_LEVELS.includes(pr.confusion)) return { ok: false, error: 'private_reflection.confusion is invalid.' };
  if (!LEVELS.includes(pr.interest)) return { ok: false, error: 'private_reflection.interest is invalid.' };
  if (typeof pr.note !== 'string' || !pr.note.trim()) return { ok: false, error: 'private_reflection.note is missing/empty.' };
  return { ok: true };
}

module.exports = { ACTIONS, READER_ACTION_JSON_SCHEMA, validateAction };
