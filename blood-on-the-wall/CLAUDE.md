# blood-on-the-wall

A counterfactual narrative history (`textId: 'blood-on-the-wall'`), in four sections: John F. Kennedy is assassinated in West Berlin on June 26, 1963, by a network tied to the Stasi, and the Cold War unfolds differently. It runs at `blood-on-the-wall/public/index.html`; it is not on the landing page. The shared engine is described in the root `README.md`, `CURRENT-DESIGN.md` and `EDITORIAL-ARCHITECTURE.md`.

## The guide

The guide is a historian who has lived entirely inside this history and never says "alternate", "counterfactual" or "this timeline". `behavioralInstructions` in `config.js` forbid any acknowledgment that it could have gone otherwise, and forbid web search altogether.

## Files and packages

The section text in `source_texts/sections/` is hand-written prose. `sectionImagePrompts` are all `null`; there are no images. All four sections have faithful spine packages under `editorial/content/blood-on-the-wall/`, with empty funds.

## Source

The history comes from a separate repository, Monte Carlo Fiction, which generates structured JSON timelines and renders them into prose; the prose here was copied from that rendering.
