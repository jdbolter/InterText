'use strict';

const fs = require('fs');
const path = require('path');
const Ajv2020 = require('ajv/dist/2020');

const schemaDir = path.join(__dirname, '..', 'schema');
const workSchema = JSON.parse(fs.readFileSync(path.join(schemaDir, 'work-manifest.schema.json'), 'utf8'));
const sectionSchema = JSON.parse(fs.readFileSync(path.join(schemaDir, 'section-package.schema.json'), 'utf8'));

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateWorkSchema = ajv.compile(workSchema);
const validateSectionSchema = ajv.compile(sectionSchema);

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    throw new Error(`Could not read JSON at ${filePath}: ${err.message}`);
  }
}

function formatErrors(errors) {
  return (errors || [])
    .map(error => `${error.instancePath || '/'} ${error.message}`)
    .join('; ');
}

function assertSchema(validate, value, label) {
  if (!validate(value)) {
    throw new Error(`${label} is invalid: ${formatErrors(validate.errors)}`);
  }
}

function assertUnique(values, label) {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} must be unique`);
  }
}

function validateWorkManifest(work, label = 'work manifest') {
  assertSchema(validateWorkSchema, work, label);
  assertUnique(work.sections.map(section => section.id), `${label} section IDs`);
  assertUnique(work.sections.map(section => section.order), `${label} section orders`);
  return work;
}

function parseSpine(markdown, label = 'spine') {
  const marker = /<!--\s*intertext:passage\s+([a-z0-9]+(?:-[a-z0-9]+)*)\s*-->/g;
  const matches = Array.from(String(markdown).matchAll(marker));
  if (matches.length === 0) throw new Error(`${label} has no InterText passage markers`);

  const preamble = String(markdown).slice(0, matches[0].index).trim();
  if (preamble) throw new Error(`${label} contains content before its first passage marker`);

  const passages = matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : String(markdown).length;
    const passageMarkdown = String(markdown).slice(start, end).trim();
    if (!passageMarkdown) throw new Error(`${label} passage ${match[1]} is empty`);
    return { id: match[1], markdown: passageMarkdown };
  });

  assertUnique(passages.map(passage => passage.id), `${label} passage IDs`);
  return passages;
}

function validateSectionPackage(sectionPackage, label = 'section package') {
  assertSchema(validateSectionSchema, sectionPackage, label);

  const passageIds = sectionPackage.spine.map(passage => passage.id);
  const passageIdSet = new Set(passageIds);
  assertUnique(passageIds, `${label} passage IDs`);
  assertUnique(sectionPackage.fundEntries.map(entry => entry.id), `${label} fund entry IDs`);

  for (const entry of sectionPackage.fundEntries) {
    for (const anchor of entry.anchors) {
      if (!passageIdSet.has(anchor)) {
        throw new Error(`${label} fund entry ${entry.id} refers to unknown anchor ${anchor}`);
      }
    }
    if (entry.sourceStatus === 'verified' && entry.sources.length === 0) {
      throw new Error(`${label} fund entry ${entry.id} is verified but has no sources`);
    }
  }
  return sectionPackage;
}

function buildSectionPackage(work, section, workDir) {
  if (!section.package) return null;

  const manifestPath = path.join(workDir, section.package);
  const manifest = readJson(manifestPath);
  const packageDir = path.dirname(manifestPath);
  const requiredFields = [
    'schemaVersion', 'editionId', 'versionId', 'parentVersionId', 'createdAt',
    'source', 'spineFile', 'fundEntries', 'changeSummary',
  ];
  for (const field of requiredFields) {
    if (!Object.prototype.hasOwnProperty.call(manifest, field)) {
      throw new Error(`${manifestPath} is missing ${field}`);
    }
  }

  const spine = parseSpine(
    fs.readFileSync(path.join(packageDir, manifest.spineFile), 'utf8'),
    `${work.id}/${section.id} spine`
  );
  const fundEntries = manifest.fundEntries.map(entry => {
    if (!entry.markdownFile) throw new Error(`${manifestPath} fund entry ${entry.id || '(unknown)'} has no markdownFile`);
    const { markdownFile, ...metadata } = entry;
    return {
      ...metadata,
      markdown: fs.readFileSync(path.join(packageDir, markdownFile), 'utf8').trim(),
    };
  });

  return validateSectionPackage({
    schemaVersion: manifest.schemaVersion,
    workId: work.id,
    sectionId: section.id,
    sectionOrder: section.order,
    title: section.title,
    editionId: manifest.editionId,
    versionId: manifest.versionId,
    parentVersionId: manifest.parentVersionId,
    createdAt: manifest.createdAt,
    source: manifest.source,
    spine,
    fundEntries,
    changeSummary: manifest.changeSummary,
  }, `${work.id}/${section.id} section package`);
}

function discoverWorks(contentRoot) {
  const discovered = fs.readdirSync(contentRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && fs.existsSync(path.join(contentRoot, entry.name, 'work.json')))
    .map(entry => {
      const workDir = path.join(contentRoot, entry.name);
      const work = validateWorkManifest(readJson(path.join(workDir, 'work.json')), `${entry.name}/work.json`);
      if (work.id !== entry.name) throw new Error(`${entry.name}/work.json id must match its directory name`);
      return { work, workDir };
    })
    .sort((a, b) => a.work.order - b.work.order);
  assertUnique(discovered.map(({ work }) => work.order), 'work manifest orders');
  return discovered;
}

function buildAll({ contentRoot, outputRoot }) {
  const discovered = discoverWorks(contentRoot);
  fs.mkdirSync(outputRoot, { recursive: true });

  const works = discovered.map(({ work, workDir }) => {
    const sections = work.sections
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(section => {
        const sectionPackage = buildSectionPackage(work, section, workDir);
        if (!sectionPackage) {
          return { ...section, readiness: 'not-started', packageUrl: null, fundCounts: null };
        }

        const workOutputDir = path.join(outputRoot, work.id);
        fs.mkdirSync(workOutputDir, { recursive: true });
        fs.writeFileSync(
          path.join(workOutputDir, `${section.id}.json`),
          `${JSON.stringify(sectionPackage, null, 2)}\n`
        );
        const statuses = ['candidate', 'accepted', 'superseded', 'rejected'];
        const fundCounts = Object.fromEntries(statuses.map(status => [
          status,
          sectionPackage.fundEntries.filter(entry => entry.status === status).length,
        ]));
        return {
          ...section,
          readiness: 'packaged',
          packageUrl: `data/${work.id}/${section.id}.json`,
          versionId: sectionPackage.versionId,
          passageCount: sectionPackage.spine.length,
          fundCounts,
        };
      });
    return { id: work.id, title: work.title, order: work.order, sections };
  });

  const index = { schemaVersion: 1, works };
  fs.writeFileSync(path.join(outputRoot, 'index.json'), `${JSON.stringify(index, null, 2)}\n`);
  return index;
}

module.exports = {
  buildAll,
  buildSectionPackage,
  discoverWorks,
  parseSpine,
  validateSectionPackage,
  validateWorkManifest,
};
