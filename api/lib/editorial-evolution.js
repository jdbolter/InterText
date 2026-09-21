'use strict';

const crypto = require('crypto');
const {
  FUND_KINDS,
  SOURCE_STATUSES,
  validateRuntimePackage,
} = require('./editorial-package');

const EDITORIAL_PROPOSAL_TOOL = 'propose_editorial_update';
const EDITORIAL_REVIEW_TOOL = 'review_editorial_update';
const OPERATION_TYPES = new Set(['add', 'promote', 'supersede', 'reject']);

const SOURCE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'url'],
  properties: {
    title: { type: 'string', minLength: 1 },
    url: { type: 'string', pattern: '^https?://' },
  },
};

const ENTRY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'title', 'anchors', 'kind', 'markdown', 'useWhen', 'sourceStatus', 'sources'],
  properties: {
    id: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
    title: { type: 'string', minLength: 1 },
    anchors: {
      type: 'array', minItems: 1, uniqueItems: true,
      items: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
    },
    kind: { type: 'string', enum: [...FUND_KINDS] },
    markdown: { type: 'string', minLength: 1 },
    useWhen: { type: 'string', minLength: 1 },
    thread: {
      anyOf: [
        { type: 'null' },
        {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'order'],
          properties: {
            id: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
            order: { type: 'integer', minimum: 1 },
          },
        },
      ],
    },
    sourceStatus: { type: 'string', enum: [...SOURCE_STATUSES] },
    sources: { type: 'array', items: SOURCE_SCHEMA },
  },
};

function proposalTool() {
  return {
    name: EDITORIAL_PROPOSAL_TOOL,
    description: 'Propose a proportionate editorial update to the current spine and fund, or explicitly propose no change.',
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['decision', 'changeSummary', 'spineUpdates', 'fundOperations'],
      properties: {
        decision: { type: 'string', enum: ['change', 'no-change'] },
        changeSummary: { type: 'string' },
        spineUpdates: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['passageId', 'markdown', 'rationale', 'conversationTurns'],
            properties: {
              passageId: { type: 'string' },
              markdown: { type: 'string', minLength: 1 },
              rationale: { type: 'string', minLength: 1 },
              conversationTurns: {
                type: 'array', uniqueItems: true,
                items: { type: 'integer', minimum: 1 },
              },
            },
          },
        },
        fundOperations: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['operation', 'targetEntryId', 'entry', 'rationale', 'conversationTurns'],
            properties: {
              operation: {
                type: 'string',
                enum: [...OPERATION_TYPES],
                description: 'Use add for a new entry, promote or reject for status-only changes, and supersede to retire an entry with an optional replacement.',
              },
              targetEntryId: {
                type: ['string', 'null'],
                description: 'Must be null for add and an existing entry ID for every other operation.',
              },
              entry: {
                anyOf: [ENTRY_SCHEMA, { type: 'null' }],
                description: 'Required for add, optional as a new-ID replacement for supersede, and null for promote or reject.',
              },
              rationale: { type: 'string', minLength: 1 },
              conversationTurns: {
                type: 'array', uniqueItems: true,
                items: { type: 'integer', minimum: 1 },
              },
            },
          },
        },
      },
    },
  };
}

function reviewTool(proposal) {
  return {
    name: EDITORIAL_REVIEW_TOOL,
    description: 'Independently approve or reject every proposed spine and fund operation and set safe publication status.',
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['decision', 'summary', 'spineReviews', 'fundReviews'],
      properties: {
        decision: { type: 'string', enum: ['approve', 'reject', 'no-change'] },
        summary: { type: 'string', minLength: 1 },
        spineReviews: {
          type: 'array',
          minItems: proposal.spineUpdates.length,
          maxItems: proposal.spineUpdates.length,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['passageId', 'approved', 'reason'],
            properties: {
              passageId: { type: 'string' },
              approved: { type: 'boolean' },
              reason: { type: 'string', minLength: 1 },
            },
          },
        },
        fundReviews: {
          type: 'array',
          minItems: proposal.fundOperations.length,
          maxItems: proposal.fundOperations.length,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['operationIndex', 'approved', 'publishStatus', 'reason'],
            properties: {
              operationIndex: { type: 'integer', minimum: 0 },
              approved: { type: 'boolean' },
              publishStatus: { type: 'string', enum: ['accepted', 'candidate', 'rejected'] },
              reason: { type: 'string', minLength: 1 },
            },
          },
        },
      },
    },
  };
}

function extractToolInput(content, toolName) {
  const calls = (Array.isArray(content) ? content : [])
    .filter(block => block && block.type === 'tool_use' && block.name === toolName);
  if (calls.length !== 1) throw new Error(`Expected exactly one ${toolName} tool call, received ${calls.length}`);
  if (!calls[0].input || typeof calls[0].input !== 'object' || Array.isArray(calls[0].input)) {
    throw new Error(`${toolName} input must be an object`);
  }
  return calls[0].input;
}

function wordCount(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}

function normalizeConversation(conversationHistory) {
  if (!Array.isArray(conversationHistory)) throw new Error('conversationHistory must be an array');
  return conversationHistory.map((message, index) => {
    if (!message || !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string') {
      throw new Error(`conversationHistory[${index}] is invalid`);
    }
    return { role: message.role, content: message.content };
  });
}

function conversationTranscript(conversation) {
  return conversation
    .map((message, index) => `Turn ${index + 1} — ${message.role === 'user' ? 'Reader' : 'Guide'}:\n${message.content}`)
    .join('\n\n');
}

function urlAllowlist(sectionPackage, conversation) {
  const urls = new Set();
  for (const entry of sectionPackage.fundEntries) {
    for (const source of entry.sources) urls.add(source.url);
  }
  const pattern = /https?:\/\/[^\s)\]}>,"']+/g;
  for (const message of conversation) {
    for (const url of message.content.match(pattern) || []) urls.add(url.replace(/[.!?;:]+$/, ''));
  }
  return urls;
}

function validateTurns(turns, conversationLength, label) {
  if (!Array.isArray(turns)) throw new Error(`${label} must be an array`);
  if (new Set(turns).size !== turns.length) throw new Error(`${label} must be unique`);
  if (turns.some(turn => !Number.isInteger(turn) || turn < 1 || turn > conversationLength)) {
    throw new Error(`${label} contains an invalid turn number`);
  }
}

function validateEntryProposal(entry, passageIds, allowedUrls, label) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error(`${label} is required`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id || '')) throw new Error(`${label}.id is invalid`);
  for (const field of ['title', 'markdown', 'useWhen']) {
    if (typeof entry[field] !== 'string' || !entry[field].trim()) throw new Error(`${label}.${field} is required`);
  }
  if (wordCount(entry.markdown) > 250) throw new Error(`${label}.markdown exceeds 250 words`);
  if (!Array.isArray(entry.anchors) || entry.anchors.length === 0) throw new Error(`${label}.anchors is required`);
  if (new Set(entry.anchors).size !== entry.anchors.length) throw new Error(`${label}.anchors must be unique`);
  if (entry.anchors.some(anchor => !passageIds.has(anchor))) throw new Error(`${label} has an unknown anchor`);
  if (!FUND_KINDS.has(entry.kind)) throw new Error(`${label}.kind is invalid`);
  if (!SOURCE_STATUSES.has(entry.sourceStatus)) throw new Error(`${label}.sourceStatus is invalid`);
  if (entry.thread !== undefined && entry.thread !== null) {
    if (
      typeof entry.thread !== 'object' ||
      Array.isArray(entry.thread) ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.thread.id || '') ||
      !Number.isInteger(entry.thread.order) ||
      entry.thread.order < 1
    ) {
      throw new Error(`${label}.thread is invalid`);
    }
  }
  if (!Array.isArray(entry.sources)) throw new Error(`${label}.sources must be an array`);
  for (const source of entry.sources) {
    if (!source || typeof source.title !== 'string' || !source.title.trim() || !allowedUrls.has(source.url)) {
      throw new Error(`${label} contains a source URL that was not supplied to the editor`);
    }
  }
  if (entry.sourceStatus === 'verified' && entry.sources.length === 0) {
    throw new Error(`${label} cannot be verified without a supplied source`);
  }
}

function validateProposal(proposal, sectionPackage, conversation) {
  if (!proposal || !['change', 'no-change'].includes(proposal.decision)) throw new Error('Editorial proposal decision is invalid');
  if (typeof proposal.changeSummary !== 'string') throw new Error('Editorial proposal summary is invalid');
  if (!Array.isArray(proposal.spineUpdates) || !Array.isArray(proposal.fundOperations)) {
    throw new Error('Editorial proposal operations are invalid');
  }
  if (proposal.decision === 'no-change' && (proposal.spineUpdates.length || proposal.fundOperations.length)) {
    throw new Error('A no-change proposal cannot contain operations');
  }
  if (proposal.decision === 'change' && !proposal.spineUpdates.length && !proposal.fundOperations.length) {
    throw new Error('A change proposal must contain an operation');
  }

  const passageMap = new Map(sectionPackage.spine.map(passage => [passage.id, passage]));
  const passageIds = new Set(passageMap.keys());
  const updatedIds = proposal.spineUpdates.map(update => update.passageId);
  if (new Set(updatedIds).size !== updatedIds.length) throw new Error('A passage may be updated only once');
  for (const [index, update] of proposal.spineUpdates.entries()) {
    const current = passageMap.get(update.passageId);
    if (!current) throw new Error(`Spine update ${index} refers to an unknown passage`);
    if (typeof update.markdown !== 'string' || !update.markdown.trim()) throw new Error(`Spine update ${index} is empty`);
    if (/intertext:passage/.test(update.markdown)) throw new Error(`Spine update ${index} contains a private passage marker`);
    if (typeof update.rationale !== 'string' || !update.rationale.trim()) throw new Error(`Spine update ${index} has no rationale`);
    validateTurns(update.conversationTurns, conversation.length, `spineUpdates[${index}].conversationTurns`);
    if (wordCount(update.markdown) > Math.max(80, Math.ceil(wordCount(current.markdown) * 1.5))) {
      throw new Error(`Spine update ${index} expands its passage beyond the 50% guard`);
    }
  }

  const existing = new Map(sectionPackage.fundEntries.map(entry => [entry.id, entry]));
  const newIds = new Set();
  const targetedIds = new Set();
  const allowedUrls = urlAllowlist(sectionPackage, conversation);
  for (const [index, operation] of proposal.fundOperations.entries()) {
    if (!operation || !OPERATION_TYPES.has(operation.operation)) throw new Error(`Fund operation ${index} is invalid`);
    if (typeof operation.rationale !== 'string' || !operation.rationale.trim()) throw new Error(`Fund operation ${index} has no rationale`);
    validateTurns(operation.conversationTurns, conversation.length, `fundOperations[${index}].conversationTurns`);
    if (operation.operation === 'add') {
      if (operation.targetEntryId !== null) throw new Error(`Fund add operation ${index} must not have a target`);
      validateEntryProposal(operation.entry, passageIds, allowedUrls, `fundOperations[${index}].entry`);
      if (existing.has(operation.entry.id) || newIds.has(operation.entry.id)) throw new Error(`Fund add operation ${index} duplicates an entry ID`);
      newIds.add(operation.entry.id);
    } else {
      if (typeof operation.targetEntryId !== 'string' || !existing.has(operation.targetEntryId)) {
        throw new Error(`Fund operation ${index} refers to an unknown entry`);
      }
      if (targetedIds.has(operation.targetEntryId)) {
        throw new Error(`Fund operation ${index} repeats a target entry`);
      }
      targetedIds.add(operation.targetEntryId);
      if (operation.operation === 'supersede' && operation.entry !== null) {
        validateEntryProposal(operation.entry, passageIds, allowedUrls, `fundOperations[${index}].entry`);
        if (existing.has(operation.entry.id) || newIds.has(operation.entry.id)) {
          throw new Error(`Fund supersede operation ${index} replacement must have a new entry ID`);
        }
        newIds.add(operation.entry.id);
      } else if (operation.entry !== null) {
        throw new Error(`Fund operation ${index} must not include a replacement entry`);
      }
      if (operation.operation === 'promote' && existing.get(operation.targetEntryId).sourceStatus === 'needs-verification') {
        throw new Error(`Fund operation ${index} cannot promote an entry that still needs verification`);
      }
    }
  }
  return proposal;
}

function validateReview(review, proposal) {
  if (!review || !['approve', 'reject', 'no-change'].includes(review.decision)) throw new Error('Editorial review decision is invalid');
  if (typeof review.summary !== 'string' || !review.summary.trim()) throw new Error('Editorial review summary is required');
  if (!Array.isArray(review.spineReviews) || review.spineReviews.length !== proposal.spineUpdates.length) {
    throw new Error('Editorial review must cover every spine update');
  }
  if (!Array.isArray(review.fundReviews) || review.fundReviews.length !== proposal.fundOperations.length) {
    throw new Error('Editorial review must cover every fund operation');
  }
  const passageIds = proposal.spineUpdates.map(update => update.passageId);
  if (new Set(review.spineReviews.map(item => item.passageId)).size !== review.spineReviews.length) {
    throw new Error('Editorial review repeats a spine update');
  }
  for (const item of review.spineReviews) {
    if (!passageIds.includes(item.passageId) || typeof item.approved !== 'boolean' || typeof item.reason !== 'string') {
      throw new Error('Editorial spine review is invalid');
    }
  }
  const indices = review.fundReviews.map(item => item.operationIndex);
  if (new Set(indices).size !== indices.length || indices.some(index => index < 0 || index >= proposal.fundOperations.length)) {
    throw new Error('Editorial fund review indices are invalid');
  }
  for (const item of review.fundReviews) {
    if (typeof item.approved !== 'boolean' || !['accepted', 'candidate', 'rejected'].includes(item.publishStatus)) {
      throw new Error('Editorial fund review is invalid');
    }
  }
  const approvedCount = review.spineReviews.filter(item => item.approved).length
    + review.fundReviews.filter(item => item.approved).length;
  if (review.decision === 'approve' && approvedCount === 0) {
    throw new Error('An approving editorial review must approve at least one operation');
  }
  if (review.decision !== 'approve' && approvedCount > 0) {
    throw new Error('A rejecting or no-change editorial review cannot approve individual operations');
  }
  return review;
}

function approvedVersion({ sectionPackage, proposal, review, sessionId, updateId, now = new Date() }) {
  if (review.decision === 'reject' || review.decision === 'no-change') return null;
  const spineReview = new Map(review.spineReviews.map(item => [item.passageId, item]));
  const updates = new Map(
    proposal.spineUpdates
      .filter(update => spineReview.get(update.passageId)?.approved)
      .map(update => [update.passageId, update.markdown.trim()])
  );
  const spine = sectionPackage.spine.map(passage => (
    updates.has(passage.id) ? { ...passage, markdown: updates.get(passage.id) } : passage
  ));
  const originalWords = sectionPackage.spine.reduce((sum, passage) => sum + wordCount(passage.markdown), 0);
  const revisedWords = spine.reduce((sum, passage) => sum + wordCount(passage.markdown), 0);
  if (revisedWords > Math.ceil(originalWords * 1.25)) throw new Error('Approved spine exceeds the 25% section growth guard');

  const entries = sectionPackage.fundEntries.map(entry => ({ ...entry }));
  const byId = new Map(entries.map((entry, index) => [entry.id, index]));
  const fundReviews = new Map(review.fundReviews.map(item => [item.operationIndex, item]));

  function reviewedEntry(entry, itemReview, turns) {
    let status = itemReview.publishStatus;
    if (status === 'accepted' && entry.sourceStatus === 'needs-verification') status = 'candidate';
    return {
      ...entry,
      status,
      provenance: {
        type: 'model-editor',
        sessionId,
        turns,
        artifactPath: null,
      },
    };
  }

  for (const [index, operation] of proposal.fundOperations.entries()) {
    const itemReview = fundReviews.get(index);
    if (!itemReview?.approved) continue;
    if (operation.operation === 'add') {
      entries.push(reviewedEntry(operation.entry, itemReview, operation.conversationTurns));
      byId.set(operation.entry.id, entries.length - 1);
    } else {
      const targetIndex = byId.get(operation.targetEntryId);
      const status = operation.operation === 'promote'
        ? 'accepted'
        : operation.operation === 'supersede'
          ? 'superseded'
          : 'rejected';
      entries[targetIndex] = { ...entries[targetIndex], status };
      if (operation.operation === 'supersede' && operation.entry) {
        entries.push(reviewedEntry(operation.entry, itemReview, operation.conversationTurns));
        byId.set(operation.entry.id, entries.length - 1);
      }
    }
  }

  const changed = JSON.stringify(spine) !== JSON.stringify(sectionPackage.spine)
    || JSON.stringify(entries) !== JSON.stringify(sectionPackage.fundEntries);
  if (!changed) return null;

  const createdAt = now.toISOString();
  const stamp = createdAt.replace(/[-:.TZ]/g, '').slice(0, 14);
  const versionId = `${sectionPackage.sectionId}-${stamp}-${crypto.randomUUID().slice(0, 8)}`;
  const next = {
    ...sectionPackage,
    editionId: 'reader-shaped',
    versionId,
    parentVersionId: sectionPackage.versionId,
    createdAt,
    source: {
      type: 'reader-shaped',
      path: `kv://editorial-update/${sectionPackage.workId}/${sectionPackage.sectionId}/${updateId}`,
    },
    spine,
    fundEntries: entries,
    changeSummary: `${proposal.changeSummary.trim()} Validation: ${review.summary.trim()}`.trim(),
  };
  return validateRuntimePackage(next, 'approved editorial version');
}

async function callTool(client, { system, user, tool, model }) {
  const response = await client.messages.create({
    model,
    max_tokens: 8192,
    thinking: { type: 'adaptive' },
    system,
    tools: [tool],
    tool_choice: { type: 'tool', name: tool.name, disable_parallel_tool_use: true },
    messages: [{ role: 'user', content: user }],
  });
  return extractToolInput(response.content, tool.name);
}

async function evolveEditorialSection({
  client,
  sectionPackage,
  conversationHistory,
  sessionId,
  updateId = crypto.randomUUID(),
  model = 'claude-sonnet-5',
  now = new Date(),
}) {
  validateRuntimePackage(sectionPackage, 'current editorial version');
  const conversation = normalizeConversation(conversationHistory);
  if (conversation.length === 0) return { changed: false, proposal: null, review: null, nextPackage: null, updateId };

  const transcript = conversationTranscript(conversation);
  const packageJson = JSON.stringify(sectionPackage, null, 2);
  const proposal = validateProposal(await callTool(client, {
    model,
    tool: proposalTool(),
    system: `You are the first editorial pass for an evolving work. Compare one contributing reader's exchange with the current versioned spine and fund. Preserve the work's voice, argument, proportion, and forward movement. Do not reward persistence by treating a repeatedly stated objection as newly persuasive. A reasonable guide answer may resolve an objection even if the reader remains personally unconvinced. Prefer no change when the exchange produces no durable improvement.

Spine changes must be rare and proportionate. Update only passages that genuinely need correction, clarification, compression, or a durable development of the argument. Never add commentary about "the essay," "the account," or its rhetorical machinery.

Compare every reader correction with the exact current spine, not merely with language improvised by the guide. If the exchange establishes that a factual statement in the spine is wrong or materially misleading, correct that passage; do not leave the known error in the authoritative route and relegate the correction to optional fund material. The fund may preserve supporting detail after the spine itself is accurate.

The fund is for optional material that could help a future reader without burdening everyone. Add concise entries only when they supply a distinct clarification, example, qualification, counterargument, evidence item, or extension. Use promote only when the conversation materially supports accepting an existing candidate. Use supersede or reject only when the exchange supplies a clear editorial reason. Never invent a source URL; you may retain only URLs already present in the current package or conversation. Mark a new entry needs-verification when it introduces or corrects a specific historical fact, quotation, date, reception claim, or institutional action that is not already established by the current package, unless the supplied sources directly support it. Do not label such material not-required merely because it also serves an interpretive point.

Return the complete proposal through the required private tool.`,
    user: `CURRENT VERSION\n${packageJson}\n\nCONTRIBUTING EXCHANGE\n${transcript}`,
  }), sectionPackage, conversation);

  if (proposal.decision === 'no-change') {
    return { changed: false, proposal, review: null, nextPackage: null, updateId };
  }

  const review = validateReview(await callTool(client, {
    model,
    tool: reviewTool(proposal),
    system: `You are the independent second editorial pass. Review—not rewrite—the proposed operations against the exact current version and the actual exchange. Reject repetition, drift, defensive overqualification, unsupported factual claims, duplicate fund material, poor prose, and changes that weaken the work merely because a reader refused to be convinced. Check every fund anchor for contextual and chronological timing. Distinguish faults in the current spine from overstatements introduced only in the guide's replies.

Review every spine update and fund operation independently. If at least one operation is sound, set the overall decision to approve, approve that safe subset, and reject the others individually; rejected operations are omitted from the child version. Never reject a sound correction merely because a separate operation fails. Use an overall reject or no-change decision only when no individual operation should be applied, and in that case mark every individual item unapproved.

Approve a spine update only when it improves the continuous work for future readers. If the proposal acknowledges that the current spine contains a factual error but leaves that error untouched and places the correction only in the optional fund, do not approve the fund-only patch; optional material cannot repair an inaccurate authoritative route. For each approved fund addition, choose accepted only when it is ready for the next guide to use: relevant, nonduplicative, well written, correctly anchored, and either genuinely interpretive or adequately supported by supplied sources. Choose candidate for any precise historical detail, quotation, date, reception claim, or institutional action that lacks direct supplied support, even when its broader interpretive use is sound. Choose rejected when it should not enter the durable fund. Do not introduce any new prose or operation.`,
    user: `CURRENT VERSION\n${packageJson}\n\nCONTRIBUTING EXCHANGE\n${transcript}\n\nFIRST-PASS PROPOSAL\n${JSON.stringify(proposal, null, 2)}`,
  }), proposal);

  const nextPackage = approvedVersion({ sectionPackage, proposal, review, sessionId, updateId, now });
  return { changed: Boolean(nextPackage), proposal, review, nextPackage, updateId };
}

module.exports = {
  EDITORIAL_PROPOSAL_TOOL,
  EDITORIAL_REVIEW_TOOL,
  approvedVersion,
  evolveEditorialSection,
  extractToolInput,
  proposalTool,
  reviewTool,
  validateProposal,
  validateReview,
};
