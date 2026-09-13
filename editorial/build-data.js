'use strict';

const path = require('path');
const { buildAll } = require('./lib/content');

const editorialRoot = __dirname;
const index = buildAll({
  contentRoot: path.join(editorialRoot, 'content'),
  outputRoot: path.join(editorialRoot, 'data'),
});

const packagedSections = index.works
  .flatMap(work => work.sections)
  .filter(section => section.readiness === 'packaged').length;
const totalSections = index.works.flatMap(work => work.sections).length;

process.stdout.write(`Built editorial data for ${index.works.length} works: ${packagedSections}/${totalSections} sections packaged.\n`);
