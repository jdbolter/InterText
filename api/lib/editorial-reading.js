'use strict';

const {
  formatFundEntry,
  formatSpine,
  loadEditorialIndex,
  loadSeedSection,
} = require('./editorial-package');

const EDITORIAL_SPINE_EDITION = 'editorial-spine';
const EDITORIAL_FUND_EDITION = 'editorial-fund';
const EDITORIAL_EDITIONS = [EDITORIAL_SPINE_EDITION, EDITORIAL_FUND_EDITION];
const EDITORIAL_DELIVERY_TOOL = 'deliver_editorial_response';

function isEditorialEdition(edition) {
  return EDITORIAL_EDITIONS.includes(edition);
}

function loadEditorialSection({ rootDir = process.cwd(), textId, sectionIndex }) {
  const sectionPackage = loadSeedSection({ rootDir, textId, sectionIndex });
  if (sectionPackage) return sectionPackage;

  const index = loadEditorialIndex({ rootDir });
  const work = (index.works || []).find(candidate => candidate.id === textId);
  if (!work) throw new Error(`No editorial work is registered for "${textId}"`);

  const sectionOrder = sectionIndex + 1;
  const section = (work.sections || []).find(candidate => candidate.order === sectionOrder);
  if (!section) throw new Error(`No editorial section ${sectionOrder} is registered for "${textId}"`);
  throw new Error(
    `${work.title}, section ${sectionOrder} (${section.title}) has no editorial package yet`
  );
}

function normalizePresentedIds(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(id => typeof id === 'string' && id.length > 0))];
}

function preparePackageReading({
  sectionPackage,
  selectableStatuses,
  presentedFundEntryIds = [],
  experimentLabel = null,
}) {
  const alreadyPresented = normalizePresentedIds(presentedFundEntryIds);
  const selectableEntries = sectionPackage.fundEntries
    .filter(entry => selectableStatuses.includes(entry.status));
  const validIds = new Set(selectableEntries.map(entry => entry.id));
  const knownPresentedIds = alreadyPresented.filter(id => validIds.has(id));
  const knownPresentedSet = new Set(knownPresentedIds);
  const offeredEntries = selectableEntries.filter(entry => !knownPresentedSet.has(entry.id));
  const priorNote = knownPresentedIds.length > 0
    ? `The following entries have already been presented in this section; rely on the conversation history rather than repeating them: ${knownPresentedIds.join(', ')}.`
    : 'No fund entry has been presented yet.';
  const offeredText = offeredEntries.length > 0
    ? offeredEntries.map(formatFundEntry).join('\n\n')
    : '(No unpresented fund entries remain.)';
  const contextLabel = experimentLabel
    ? `This request is part of ${experimentLabel}.`
    : 'This is the current reader-shaped edition of the work.';

  return {
    sectionPackage,
    sectionText: formatSpine(sectionPackage),
    instructions: `${contextLabel} The narrative spine below is the authoritative route through the section. Its passage markers are private editorial identifiers: never quote or mention them to the reader.

Speak as the work's own intelligence. Do not refer to the spine, fund, entries, sources, versions, editorial decisions, "the account," or the essay's rhetorical machinery. Preserve the larger claim and proportion of the section when answering a narrow objection. A reader's continued disagreement does not by itself require another concession or longer answer.

Optional fund entries are possibilities, not a checklist. Select an entry only when it directly helps this reader at this moment without interrupting the spine's rhythm or forward movement. Do not expose entry titles, IDs, statuses, anchors, source notes, or the existence of a fund. An anchor identifies where an entry becomes contextually relevant; do not use an entry before the reader has encountered the people or concepts it presupposes. ${priorNote}

Return the response through the required private delivery tool. In usedFundEntryIds, list every newly offered entry whose language, distinctive example, factual detail, or conceptual refinement materially informed the visible response. Do not list an entry merely because it was available. The tool call is private and only its response field will be shown to the reader.`,
    fundText: `OPTIONAL EDITORIAL FUND — PRIVATE TO THE GUIDE\n\n${offeredText}`,
    offeredFundEntryIds: offeredEntries.map(entry => entry.id),
    alreadyPresentedFundEntryIds: knownPresentedIds,
  };
}

function prepareVersionedReading({ sectionPackage, presentedFundEntryIds = [] }) {
  return preparePackageReading({
    sectionPackage,
    selectableStatuses: ['accepted'],
    presentedFundEntryIds,
  });
}

function prepareEditorialReading({
  rootDir = process.cwd(),
  textId,
  sectionIndex,
  edition,
  presentedFundEntryIds = [],
}) {
  if (!isEditorialEdition(edition)) throw new Error(`Unknown editorial edition "${edition}"`);
  const sectionPackage = loadEditorialSection({ rootDir, textId, sectionIndex });
  const alreadyPresented = normalizePresentedIds(presentedFundEntryIds);
  const selectableEntries = edition === EDITORIAL_FUND_EDITION
    ? sectionPackage.fundEntries.filter(entry => ['accepted', 'candidate'].includes(entry.status))
    : [];
  const validIds = new Set(selectableEntries.map(entry => entry.id));
  const knownPresentedIds = alreadyPresented.filter(id => validIds.has(id));
  const knownPresentedSet = new Set(knownPresentedIds);
  const offeredEntries = selectableEntries.filter(entry => !knownPresentedSet.has(entry.id));

  const commonInstructions = `This request is part of a controlled, local spine-and-fund reading experiment. The narrative spine below is the authoritative route through the section. Its passage markers are private editorial identifiers: never quote or mention them to the reader.

Keep this condition comparable with other experimental runs. Do not introduce substantive examples or historical claims from general knowledge or web research. You may explain, connect, and rephrase in response to the reader, but every substantive claim must come from the supplied spine${edition === EDITORIAL_FUND_EDITION ? ' or the supplied optional fund' : ''}.`;

  let selectionInstructions;
  let fundText = null;
  if (edition === EDITORIAL_FUND_EDITION) {
    const priorNote = knownPresentedIds.length > 0
      ? `The following entries have already been presented in this section; rely on the conversation history rather than repeating them: ${knownPresentedIds.join(', ')}.`
      : 'No fund entry has been presented yet.';
    const offeredText = offeredEntries.length > 0
      ? offeredEntries.map(formatFundEntry).join('\n\n')
      : '(No unpresented fund entries remain.)';
    fundText = `OPTIONAL EDITORIAL FUND — PRIVATE TO THE GUIDE\n\n${offeredText}`;
    selectionInstructions = `Optional fund entries are possibilities, not a checklist. Select an entry only when it directly helps this reader at this moment without interrupting the spine's rhythm or forward movement. Do not expose entry titles, IDs, statuses, anchors, source notes, or the existence of a fund. An anchor identifies where an entry becomes contextually relevant; do not use an entry before the reader has encountered the people or concepts it presupposes. ${priorNote}

Return the response through the required private delivery tool. In usedFundEntryIds, list every newly offered entry whose language, distinctive example, factual detail, or conceptual refinement materially informed the visible response. Do not list an entry merely because it was available. The tool call is private and only its response field will be shown to the reader.`;
  } else {
    selectionInstructions = `This is the spine-only condition. No optional fund material is available. Return the response through the required private delivery tool with an empty usedFundEntryIds array. Only its response field will be shown to the reader.`;
  }

  return {
    sectionPackage,
    sectionText: formatSpine(sectionPackage),
    instructions: `${commonInstructions}\n\n${selectionInstructions}`,
    fundText,
    offeredFundEntryIds: offeredEntries.map(entry => entry.id),
    alreadyPresentedFundEntryIds: knownPresentedIds,
  };
}

function buildEditorialDeliveryTool(offeredFundEntryIds = []) {
  const ids = [...new Set(offeredFundEntryIds)];
  const usedIdsSchema = ids.length > 0
    ? { type: 'array', items: { type: 'string', enum: ids }, uniqueItems: true }
    : { type: 'array', items: { type: 'string' }, maxItems: 0 };

  return {
    name: EDITORIAL_DELIVERY_TOOL,
    description: 'Deliver the reader-visible prose together with a complete private record of optional fund entries used. This tool must be called exactly once for every editorial-experiment response.',
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['response', 'usedFundEntryIds', 'sectionComplete'],
      properties: {
        response: {
          type: 'string',
          description: 'The complete prose shown to the reader. Do not include editorial IDs, labels, or tracking commentary.',
        },
        usedFundEntryIds: usedIdsSchema,
        sectionComplete: {
          type: 'boolean',
          description: 'True only when all substantive material in the packaged section has been covered; otherwise false.',
        },
      },
    },
  };
}

function extractEditorialDelivery(content, allowedIds = []) {
  const blocks = Array.isArray(content)
    ? content.filter(block => block && block.type === 'tool_use' && block.name === EDITORIAL_DELIVERY_TOOL)
    : [];
  if (blocks.length !== 1) {
    throw new Error(`Expected exactly one ${EDITORIAL_DELIVERY_TOOL} tool call, received ${blocks.length}`);
  }

  const input = blocks[0].input;
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error(`${EDITORIAL_DELIVERY_TOOL} input must be an object`);
  }
  if (typeof input.response !== 'string') {
    throw new Error(`${EDITORIAL_DELIVERY_TOOL}.response must be a string`);
  }
  if (!Array.isArray(input.usedFundEntryIds) || typeof input.sectionComplete !== 'boolean') {
    throw new Error(`${EDITORIAL_DELIVERY_TOOL} tracking fields are invalid`);
  }

  const allowed = new Set(allowedIds);
  const used = [...new Set(input.usedFundEntryIds)];
  if (used.some(id => typeof id !== 'string' || !allowed.has(id))) {
    throw new Error(`${EDITORIAL_DELIVERY_TOOL} reported an entry that was not offered`);
  }

  return {
    text: input.response.trim(),
    usedFundEntryIds: used,
    sectionComplete: input.sectionComplete,
    trackingComplete: true,
  };
}

module.exports = {
  EDITORIAL_DELIVERY_TOOL,
  EDITORIAL_EDITIONS,
  EDITORIAL_FUND_EDITION,
  EDITORIAL_SPINE_EDITION,
  buildEditorialDeliveryTool,
  extractEditorialDelivery,
  isEditorialEdition,
  loadEditorialSection,
  prepareEditorialReading,
  prepareVersionedReading,
};
