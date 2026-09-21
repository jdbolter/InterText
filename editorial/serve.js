'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { createAuthorRevision } = require('../api/lib/editorial-author');
const {
  ensureSectionInitialized,
  loadCurrentSection,
  publishSectionVersion,
} = require('../api/lib/editorial-store');

const root = __dirname;
const port = Number(process.env.EDITORIAL_PORT || 4173);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

function respond(res, status, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

function readJsonBody(req, limit = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      body += chunk;
      if (Buffer.byteLength(body, 'utf8') > limit) {
        reject(new Error('Request body is too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Request body must be valid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function createEditorialHandler({
  initializeSection = ensureSectionInitialized,
  loadSection = loadCurrentSection,
  makeAuthorRevision = createAuthorRevision,
  publishVersion = publishSectionVersion,
} = {}) {
  return async (req, res) => {
  let requestUrl;
  try {
    requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  } catch {
    respond(res, 400, 'Bad request');
    return;
  }
  let pathname = decodeURIComponent(requestUrl.pathname);

  if (pathname === '/api/author-section') {
    if (req.method !== 'POST') {
      respond(res, 405, 'Method not allowed');
      return;
    }
    if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
      respond(res, 415, JSON.stringify({ error: 'Content-Type must be application/json' }), 'application/json; charset=utf-8');
      return;
    }
    const expectedOrigin = `http://${req.headers.host || '127.0.0.1'}`;
    if (req.headers.origin && req.headers.origin !== expectedOrigin) {
      respond(res, 403, JSON.stringify({ error: 'Cross-origin author edits are not allowed' }), 'application/json; charset=utf-8');
      return;
    }
    try {
      const body = await readJsonBody(req);
      const { textId, sectionIndex, baseVersionId, spine, fundEntries, changeSummary } = body || {};
      if (!textId || !Number.isInteger(sectionIndex) || sectionIndex < 0 || !baseVersionId) {
        respond(res, 400, JSON.stringify({ error: 'Invalid author revision request' }), 'application/json; charset=utf-8');
        return;
      }
      const current = await initializeSection({
        rootDir: path.join(__dirname, '..'),
        textId,
        sectionIndex,
      });
      if (!current) {
        respond(res, 404, JSON.stringify({ error: 'Section is not packaged' }), 'application/json; charset=utf-8');
        return;
      }
      if (current.sectionPackage.versionId !== baseVersionId) {
        respond(res, 409, JSON.stringify({
          error: 'This section changed after editing began. Reload before publishing.',
          actualVersionId: current.sectionPackage.versionId,
        }), 'application/json; charset=utf-8');
        return;
      }
      const revision = makeAuthorRevision({
        sectionPackage: current.sectionPackage,
        spine,
        fundEntries,
        changeSummary,
      });
      const result = await publishVersion({
        currentPackage: current.sectionPackage,
        nextPackage: revision.nextPackage,
        updateRecord: revision.updateRecord,
        updateId: revision.updateId,
        redis: current.redis,
      });
      if (!result.published) {
        respond(res, 409, JSON.stringify({
          error: 'This section changed while the revision was being published. Reload before trying again.',
          actualVersionId: result.actualHead,
        }), 'application/json; charset=utf-8');
        return;
      }
      respond(res, 201, JSON.stringify({
        sectionPackage: revision.nextPackage,
        source: 'kv',
        updateRecord: revision.updateRecord,
      }), 'application/json; charset=utf-8');
    } catch (error) {
      const status = /requires KV_REST_API|Request body is too large/.test(error.message) ? 503 : 400;
      respond(res, status, JSON.stringify({ error: error.message }), 'application/json; charset=utf-8');
    }
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    respond(res, 405, 'Method not allowed');
    return;
  }

  if (pathname === '/api/current-section') {
    try {
      const textId = requestUrl.searchParams.get('textId');
      const sectionIndex = Number(requestUrl.searchParams.get('sectionIndex'));
      if (!textId || !Number.isInteger(sectionIndex) || sectionIndex < 0) {
        respond(res, 400, JSON.stringify({ error: 'Invalid section request' }), 'application/json; charset=utf-8');
        return;
      }
      const current = await loadSection({
        rootDir: path.join(__dirname, '..'),
        textId,
        sectionIndex,
      });
      if (!current) {
        respond(res, 404, JSON.stringify({ error: 'Section is not packaged' }), 'application/json; charset=utf-8');
        return;
      }
      respond(res, 200, JSON.stringify({
        sectionPackage: current.sectionPackage,
        source: current.source,
      }), 'application/json; charset=utf-8');
    } catch (error) {
      respond(res, 502, JSON.stringify({ error: error.message }), 'application/json; charset=utf-8');
    }
    return;
  }
  if (pathname === '/') pathname = '/index.html';
  if (pathname.split('/').some(part => part.startsWith('.'))) {
    respond(res, 404, 'Not found');
    return;
  }

  const filePath = path.resolve(root, `.${pathname}`);
  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
    respond(res, 403, 'Forbidden');
    return;
  }

  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch {
    respond(res, 404, 'Not found');
    return;
  }
  if (!stat.isFile()) {
    respond(res, 404, 'Not found');
    return;
  }

  const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  fs.createReadStream(filePath).pipe(res);
  };
}

function createEditorialServer(options = {}) {
  return http.createServer(createEditorialHandler(options));
}

if (require.main === module) {
  const server = createEditorialServer();
  server.listen(port, '127.0.0.1', () => {
    process.stdout.write(`InterText editorial workspace: http://127.0.0.1:${port}\n`);
  });
}

module.exports = { createEditorialHandler, createEditorialServer };
