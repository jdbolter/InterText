'use strict';

const path = require('path');
const { buildAll } = require('./lib/content');

const editorialRoot = __dirname;
const buildOptions = {
  contentRoot: path.join(editorialRoot, 'content'),
};
const index = buildAll({ ...buildOptions, outputRoot: path.join(editorialRoot, 'data') });

// The browser workspace remains excluded from deployment, but the serverless reading
// and evolution APIs need a validated baseline for every packaged section. Keep a
// second generated copy under api/ so Vercel includes only the compiled packages —
// never the private workspace, research notes, or provenance transcripts.
buildAll({ ...buildOptions, outputRoot: path.join(editorialRoot, '..', 'api', 'editorial-seed') });

const packagedSections = index.works
  .flatMap(work => work.sections)
  .filter(section => section.readiness === 'packaged').length;
const totalSections = index.works.flatMap(work => work.sections).length;

process.stdout.write(`Built editorial data for ${index.works.length} works: ${packagedSections}/${totalSections} sections packaged.\n`);
