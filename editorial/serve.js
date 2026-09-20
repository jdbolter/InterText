'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { loadCurrentSection } = require('../api/lib/editorial-store');

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

const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    respond(res, 405, 'Method not allowed');
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname);
  } catch {
    respond(res, 400, 'Bad request');
    return;
  }
  if (pathname === '/api/current-section') {
    try {
      const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const textId = requestUrl.searchParams.get('textId');
      const sectionIndex = Number(requestUrl.searchParams.get('sectionIndex'));
      if (!textId || !Number.isInteger(sectionIndex) || sectionIndex < 0) {
        respond(res, 400, JSON.stringify({ error: 'Invalid section request' }), 'application/json; charset=utf-8');
        return;
      }
      const current = await loadCurrentSection({
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
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`InterText editorial workspace: http://127.0.0.1:${port}\n`);
});
