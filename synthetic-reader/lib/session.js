// Orchestrates one synthetic-reader run: a turn loop that asks the reader model for
// a structured action, executes it against the real /api/chat endpoint (or purely
// client-side, for navigation), and records both what happened and the reader's
// private reactions. Mirrors plenitude/public/app.js's own state machine (history,
// per-section history, completed-section tracking, shown-image tracking) closely
// enough that the requests it sends are indistinguishable from a real browser's —
// this harness exercises InterText's real conversation endpoint rather than
// re-implementing or guessing at its behavior.
//
// This module never imports or calls anything evolve-related; see chatClient.js.
'use strict';

const defaultChatClient = require('./chatClient');

const IMAGE_TOKEN_RE = /\[\[IMAGE:([^\]]+)\]\]/g;

function stripImageTokens(text) {
  return text.replace(IMAGE_TOKEN_RE, '[An image appears here.]');
}

function extractImageIds(text) {
  const ids = [];
  let m;
  IMAGE_TOKEN_RE.lastIndex = 0;
  while ((m = IMAGE_TOKEN_RE.exec(text)) !== null) ids.push(m[1]);
  return ids;
}

/**
 * @param {object} opts
 * @param {object} opts.textEntry - from textRegistry.getText()
 * @param {Array} opts.sections - from publicContent.extractPublicSectionData().sections
 * @param {number} opts.startSectionIndex - 0-based
 * @param {'evolving'|'original'} opts.edition
 * @param {number} opts.maxTurns
 * @param {string} opts.baseUrl
 * @param {{chooseAction: Function}} opts.reader
 * @param {{postChat: Function}} [opts.chatClient] - injectable for tests
 * @param {(turnRecord: object) => void} [opts.onTurn] - optional live progress callback
 */
async function runSession(opts) {
  const { textEntry, sections, startSectionIndex, edition, maxTurns, baseUrl, reader, onTurn } = opts;
  const chatClient = opts.chatClient || defaultChatClient;

  let sectionIndex = startSectionIndex;
  const history = [];
  const sectionHistories = new Map();
  const completedSections = new Set();
  const shownImages = new Set();
  const visibleTranscript = [];
  const turns = [];
  let stopReason = null;
  let stopDetail = null;

  function currentSection() {
    return sections[sectionIndex];
  }

  function appendSectionIntro(idx) {
    const s = sections[idx];
    visibleTranscript.push({ type: 'section-intro', number: s.number, title: s.title, text: s.intro });
  }

  function buildVisibleContext() {
    return {
      workTitle: textEntry.displayTitle,
      tableOfContents: sections.map((s) => ({ number: s.number, title: s.title })),
      currentSection: { number: currentSection().number, title: currentSection().title },
      transcript: visibleTranscript.slice(),
    };
  }

  function recordHistoryTurn(userContent, assistantContent) {
    const pair = [
      { role: 'user', content: userContent },
      { role: 'assistant', content: assistantContent },
    ];
    history.push(...pair);
    const existing = sectionHistories.get(sectionIndex) || [];
    sectionHistories.set(sectionIndex, [...existing, ...pair]);
  }

  appendSectionIntro(sectionIndex);

  let turnNumber = 0;
  while (turnNumber < maxTurns) {
    turnNumber += 1;
    const visibleContext = buildVisibleContext();
    const action = await reader.chooseAction(visibleContext);
    const turnRecord = {
      turn: turnNumber,
      sectionNumber: currentSection().number,
      action: action.action,
      privateReflection: action.private_reflection,
      timestamp: new Date().toISOString(),
    };

    if (action.action === 'message') {
      visibleTranscript.push({ type: 'reader', text: action.message });
      const data = await chatClient.postChat(baseUrl, {
        message: action.message,
        history,
        sectionIndex,
        shownImages: Array.from(shownImages),
        textId: textEntry.id,
        edition,
      });
      const responseText = data.response || '';
      recordHistoryTurn(action.message, responseText);
      extractImageIds(responseText).forEach((id) => shownImages.add(id));
      turnRecord.readerMessage = action.message;
      // Record and display what the reader actually saw, not the server's raw
      // [[IMAGE:id]] token — that's an internal rendering instruction, never prose.
      turnRecord.guideResponse = stripImageTokens(responseText);
      visibleTranscript.push({ type: 'guide', text: turnRecord.guideResponse });
    } else if (action.action === 'continue') {
      let advanced = false;
      for (;;) {
        if (completedSections.has(sectionIndex)) {
          if (sectionIndex === sections.length - 1) {
            visibleTranscript.push({ type: 'system', text: 'End of the final section.' });
            turnRecord.note = 'reached end of final section; no further content to read';
            break;
          }
          sectionIndex += 1;
          appendSectionIntro(sectionIndex);
          advanced = true;
          continue;
        }
        const data = await chatClient.postChat(baseUrl, {
          message: '',
          history,
          sectionIndex,
          shownImages: Array.from(shownImages),
          textId: textEntry.id,
          edition,
          action: 'continue',
          sectionHistory: sectionHistories.get(sectionIndex) || [],
        });
        if (data.sectionComplete === true) completedSections.add(sectionIndex);
        if (data.response) {
          const responseText = data.response;
          recordHistoryTurn('Continue reading from where we have reached in this section.', responseText);
          extractImageIds(responseText).forEach((id) => shownImages.add(id));
          turnRecord.guideResponse = stripImageTokens(responseText);
          visibleTranscript.push({ type: 'guide', text: turnRecord.guideResponse });
          break;
        }
        if (!data.sectionComplete) {
          // Defensive: the server contract guarantees a response unless sectionComplete
          // is true (see api/chat.js), but never loop forever on an unexpected reply.
          turnRecord.note = 'continue produced no response and no section-complete signal';
          break;
        }
        // sectionComplete with no response on a non-final section: loop advances above.
      }
      turnRecord.sectionAfter = currentSection().number;
      turnRecord.advancedSection = advanced;
    } else if (action.action === 'navigate') {
      const targetIdx = action.target_section - 1;
      if (!Number.isInteger(targetIdx) || targetIdx < 0 || targetIdx >= sections.length || targetIdx === sectionIndex) {
        visibleTranscript.push({ type: 'system', text: `Section ${action.target_section} is not available.` });
        turnRecord.note = `invalid navigate target: ${action.target_section}`;
      } else {
        sectionIndex = targetIdx;
        appendSectionIntro(sectionIndex);
        turnRecord.navigatedTo = currentSection().number;
      }
    } else if (action.action === 'finish') {
      stopReason = 'reader_finished';
      stopDetail = action.stop_reason;
      turnRecord.stopReason = action.stop_reason;
      turns.push(turnRecord);
      if (onTurn) onTurn(turnRecord);
      break;
    }

    turns.push(turnRecord);
    if (onTurn) onTurn(turnRecord);
  }

  if (!stopReason) {
    stopReason = 'turn_limit_reached';
    stopDetail = `Reached the ${maxTurns}-turn limit for this run without the reader choosing to finish.`;
  }

  return {
    textId: textEntry.id,
    startSectionIndex,
    finalSectionIndex: sectionIndex,
    edition,
    turns,
    stopReason,
    stopDetail,
  };
}

module.exports = { runSession, stripImageTokens, extractImageIds };
