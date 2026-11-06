// H-018: finding out what a web item is and what the page may do with it.
// Every function takes `fetch` as an argument, so the tests can answer for the web.
const USER_AGENT = 'InterText-media-check/1.0 (https://github.com/jdbolter/InterText)';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function slug(text) {
  return String(text || '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').split('-').slice(0, 6).join('-') || 'item';
}

function stripHtml(html) {
  return String(html || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

// Seconds from a YouTube t= value: 90, 90s, 1m30s, 1h2m3s.
function parseStart(value) {
  if (!value) return 0;
  if (/^\d+$/.test(value)) return Number(value);
  const m = String(value).match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  return m ? (Number(m[1] || 0) * 3600) + (Number(m[2] || 0) * 60) + Number(m[3] || 0) : 0;
}

// What sort of address this is.
function identify(rawUrl) {
  let u;
  try { u = new URL(String(rawUrl).trim()); } catch (e) { return { type: 'invalid' }; }
  const host = u.hostname.replace(/^(www|m)\./, '');
  const segs = u.pathname.split('/').filter(Boolean);
  if (host === 'youtu.be' && segs[0]) {
    return { type: 'youtube', videoId: segs[0], start: parseStart(u.searchParams.get('t')) };
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const id = u.searchParams.get('v') || (['embed', 'shorts', 'live', 'v'].includes(segs[0]) ? segs[1] : null);
    if (id) return { type: 'youtube', videoId: id, start: parseStart(u.searchParams.get('t') || u.searchParams.get('start')) };
  }
  if ((host === 'vimeo.com' || host === 'player.vimeo.com') && segs.length) {
    const id = segs.find(s => /^\d+$/.test(s));
    if (id) return { type: 'vimeo', videoId: id };
  }
  const fileFromHash = decodeURIComponent(u.hash).match(/\/media\/(File:[^#?]+)/);
  if (/(^|\.)wikipedia\.org$|(^|\.)wikimedia\.org$/.test(host)) {
    let file = null;
    if (fileFromHash) file = fileFromHash[1];
    else if (segs[0] === 'wiki' && /^File:/i.test(decodeURIComponent(segs[1] || ''))) file = decodeURIComponent(segs.slice(1).join('/'));
    else if (host === 'upload.wikimedia.org') {
      const i = segs.indexOf('thumb');
      file = 'File:' + decodeURIComponent(i >= 0 ? segs[i + 3] : segs[segs.length - 1]);
    }
    if (file) {
      file = file.replace(/^file:/i, 'File:').replace(/_/g, ' ');
      const wiki = host === 'commons.wikimedia.org' || host === 'upload.wikimedia.org' ? 'commons.wikimedia.org' : host;
      return { type: 'wikimedia', wiki, file };
    }
  }
  if (host === 'metmuseum.org') {
    const id = segs.find(s => /^\d+$/.test(s));
    if (id && segs.includes('collection')) return { type: 'met', objectId: id };
  }
  if (host === 'artic.edu' && segs[0] === 'artworks' && /^\d+$/.test(segs[1] || '')) {
    return { type: 'aic', objectId: segs[1] };
  }
  return { type: 'link' };
}

// Licences under which the page may show an image, with its credit.
function licenceCleared(shortName, nonFree) {
  if (nonFree) return false;
  const name = String(shortName || '').trim();
  if (!name || /\b(nc|nd)\b|non-?commercial|no ?deriv|fair use|non-?free/i.test(name)) return false;
  return /^(public domain|pd\b|pd-|cc0|cc[ -]?by\b|cc[ -]?by-sa\b|cc[ -]?by \d|cc[ -]?by-sa \d|attribution|no restrictions)/i.test(name);
}

async function getJson(fetch, url, headers = {}) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json', ...headers } });
  let body = null;
  try { body = await res.json(); } catch (e) { body = null; }
  return { status: res.status, body };
}

async function resolveVideo(fetch, id) {
  const page = id.type === 'youtube'
    ? `https://www.youtube.com/watch?v=${id.videoId}`
    : `https://vimeo.com/${id.videoId}`;
  const oembed = id.type === 'youtube'
    ? `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(page)}`
    : `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(page)}`;
  const where = id.type === 'youtube' ? 'YouTube' : 'Vimeo';
  const { status, body } = await getJson(fetch, oembed);
  const base = {
    kind: 'video',
    url: page + (id.start ? `${id.type === 'youtube' ? '&t=' : '#t='}${id.start}s` : ''),
    embed: { provider: id.type, videoId: id.videoId, ...(id.start ? { start: id.start } : {}) },
  };
  if (status === 200 && body) {
    return {
      ...base,
      title: stripHtml(body.title),
      source: body.author_name ? `${stripHtml(body.author_name)} on ${where}` : where,
      status: 'ok',
    };
  }
  if (status === 401 || (id.type === 'vimeo' && status === 403)) {
    return { ...base, source: where, status: 'embed-disabled', note: `The owner does not allow the video to be embedded; it is shown as a card that opens ${where}.` };
  }
  return { ...base, source: where, status: 'missing', note: `${where} answered ${status}: the video is private, removed or never existed.` };
}

async function resolveWikimedia(fetch, id) {
  const api = `https://${id.wiki}/w/api.php?action=query&format=json&formatversion=2&prop=imageinfo`
    + '&iiprop=url|size|mime|extmetadata&iiurlwidth=1280'
    + '&iiextmetadatafilter=ObjectName|Artist|Credit|LicenseShortName|LicenseUrl|AttributionRequired|NonFree|DateTimeOriginal|ImageDescription'
    + `&titles=${encodeURIComponent(id.file)}`;
  const { status, body } = await getJson(fetch, api);
  const pageUrl = `https://${id.wiki}/wiki/${encodeURIComponent(id.file.replace(/ /g, '_')).replace(/%3A/i, ':')}`;
  const page = body && body.query && body.query.pages && body.query.pages[0];
  const info = page && page.imageinfo && page.imageinfo[0];
  if (status !== 200 || !page || page.missing || !info) {
    return { kind: 'image', url: pageUrl, source: 'Wikimedia Commons', status: 'missing', note: `No such file (${status}).` };
  }
  const meta = info.extmetadata || {};
  const v = (k) => (meta[k] && meta[k].value != null ? String(meta[k].value) : '');
  const licenceName = stripHtml(v('LicenseShortName'));
  const nonFree = v('NonFree') === 'true' || v('NonFree') === true;
  const cleared = licenceCleared(licenceName, nonFree);
  const title = stripHtml(v('ObjectName')) || id.file.replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, '');
  const artist = stripHtml(v('Artist'));
  const source = id.wiki === 'commons.wikimedia.org' ? 'Wikimedia Commons' : 'Wikipedia';
  const licence = { name: licenceName || 'unknown', url: v('LicenseUrl') || pageUrl, cleared };
  const isImage = /^image\//.test(info.mime || '');
  return {
    kind: 'image',
    url: pageUrl,
    title,
    source,
    credit: [title, artist, `${licenceName || 'Licence unknown'}, via ${source}.`].filter(Boolean).join('. ').replace(/\.\./g, '.'),
    licence,
    embed: isImage ? {
      src: info.thumburl || info.url,
      width: info.thumbwidth || info.width,
      height: info.thumbheight || info.height,
      alt: stripHtml(v('ImageDescription')).slice(0, 200) || title,
    } : null,
    status: cleared && isImage ? 'ok' : 'not-cleared',
    ...(cleared && isImage ? {} : { note: nonFree ? 'A non-free file: shown as a card.' : `Licence "${licenceName || 'unknown'}" is not one the page shows: shown as a card.` }),
  };
}

async function resolveMet(fetch, id) {
  const pageUrl = `https://www.metmuseum.org/art/collection/search/${id.objectId}`;
  const { status, body } = await getJson(fetch, `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id.objectId}`);
  if (status !== 200 || !body || !body.objectID) {
    return { kind: 'image', url: pageUrl, source: 'The Metropolitan Museum of Art', status: 'missing', note: `The Met answered ${status}.` };
  }
  const src = body.primaryImageSmall || body.primaryImage;
  const cleared = body.isPublicDomain === true && Boolean(src);
  const title = stripHtml(body.title);
  return {
    kind: 'image',
    url: body.objectURL || pageUrl,
    title,
    date: body.objectDate || undefined,
    source: 'The Metropolitan Museum of Art',
    credit: [body.artistDisplayName, title, body.objectDate].filter(Boolean).join(', ') + '. The Metropolitan Museum of Art, Open Access (public domain).',
    licence: { name: cleared ? 'Public domain' : 'Not open access', url: 'https://www.metmuseum.org/policies/image-resources', cleared },
    embed: src ? { src, alt: title } : null,
    status: cleared ? 'ok' : 'not-cleared',
    ...(cleared ? {} : { note: 'Not in the Met\'s Open Access collection: shown as a card.' }),
  };
}

async function resolveAic(fetch, id) {
  const pageUrl = `https://www.artic.edu/artworks/${id.objectId}`;
  const fields = 'id,title,artist_display,date_display,image_id,is_public_domain,thumbnail';
  const { status, body } = await getJson(fetch, `https://api.artic.edu/api/v1/artworks/${id.objectId}?fields=${fields}`,
    { 'AIC-User-Agent': USER_AGENT });
  const d = body && body.data;
  if (status !== 200 || !d) {
    return { kind: 'image', url: pageUrl, source: 'Art Institute of Chicago', status: 'missing', note: `The Art Institute answered ${status}.` };
  }
  const iiif = (body.config && body.config.iiif_url) || 'https://www.artic.edu/iiif/2';
  const cleared = d.is_public_domain === true && Boolean(d.image_id);
  const title = stripHtml(d.title);
  return {
    kind: 'image',
    url: pageUrl,
    title,
    date: d.date_display || undefined,
    source: 'Art Institute of Chicago',
    credit: [stripHtml(d.artist_display).replace(/\s*\n.*/, ''), title, d.date_display].filter(Boolean).join(', ') + '. Art Institute of Chicago, CC0.',
    licence: { name: cleared ? 'CC0' : 'In copyright', url: cleared ? 'https://creativecommons.org/publicdomain/zero/1.0/' : pageUrl, cleared },
    embed: d.image_id ? { src: `${iiif}/${d.image_id}/full/843,/0/default.jpg`, alt: (d.thumbnail && d.thumbnail.alt_text) || title } : null,
    status: cleared ? 'ok' : 'not-cleared',
    ...(cleared ? {} : { note: 'Not public domain at the Art Institute: shown as a card.' }),
  };
}

function pageTitle(html) {
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
  if (og) return stripHtml(og[1]);
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return t ? stripHtml(t[1]) : '';
}

async function resolveLink(fetch, rawUrl) {
  const url = String(rawUrl).trim();
  let res;
  try {
    res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,*/*' } });
  } catch (err) {
    // A name that does not exist is a dead link; any other failure is the network's, not the item's.
    const code = (err.cause && err.cause.code) || (/ENOTFOUND/.test(err.message) ? 'ENOTFOUND' : null);
    if (code === 'ENOTFOUND') return { kind: 'link', url, status: 'dead', note: 'No such site.' };
    throw err;
  }
  const host = (() => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; } })();
  if (res.status === 404 || res.status === 410) return { kind: 'link', url, source: host, status: 'dead', note: `The site answered ${res.status}.` };
  if (!res.ok) return { kind: 'link', url, source: host, status: 'unverified', note: `The site answered ${res.status} to the checker; a browser may still open it.` };
  let html = '';
  try { html = (await res.text()).slice(0, 300000); } catch (e) { html = ''; }
  return { kind: 'link', url, title: pageTitle(html) || host, source: host, status: 'ok' };
}

// Find out what an address is and what the page may do with it.
async function resolve(fetch, url) {
  const id = identify(url);
  if (id.type === 'invalid') return { kind: 'link', url: String(url), status: 'dead', note: 'Not a web address.' };
  let item;
  if (id.type === 'youtube' || id.type === 'vimeo') item = await resolveVideo(fetch, id);
  else if (id.type === 'wikimedia') item = await resolveWikimedia(fetch, id);
  else if (id.type === 'met') item = await resolveMet(fetch, id);
  else if (id.type === 'aic') item = await resolveAic(fetch, id);
  else item = await resolveLink(fetch, url);
  for (const k of Object.keys(item)) if (item[k] === undefined || item[k] === null) delete item[k];
  return { ...item, checked: today() };
}

// Candidate images on Commons for a search.
async function searchCommons(fetch, query, limit = 10) {
  const api = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2'
    + `&generator=search&gsrnamespace=6&gsrlimit=${Math.min(Math.max(limit, 1), 50)}&gsrsearch=${encodeURIComponent(query)}`
    + '&prop=imageinfo&iiprop=url|mime|extmetadata&iiextmetadatafilter=ObjectName|Artist|LicenseShortName|NonFree';
  const { status, body } = await getJson(fetch, api);
  if (status !== 200 || !body) throw new Error(`Commons answered ${status}`);
  const pages = (body.query && body.query.pages) || [];
  return pages
    .sort((a, b) => (a.index || 0) - (b.index || 0))
    .map((p) => {
      const info = (p.imageinfo && p.imageinfo[0]) || {};
      const meta = info.extmetadata || {};
      const licence = stripHtml(meta.LicenseShortName && meta.LicenseShortName.value);
      return {
        file: p.title,
        url: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`,
        licence,
        cleared: licenceCleared(licence, meta.NonFree && meta.NonFree.value === 'true') && /^image\//.test(info.mime || ''),
        artist: stripHtml(meta.Artist && meta.Artist.value).slice(0, 80),
      };
    });
}

// One line of a bulk file: "section | url | when to use it | id (optional)".
function parseBulkLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  const [section, url, when, id] = trimmed.split('|').map(s => s.trim());
  const n = Number(section);
  if (!Number.isInteger(n) || n < 1 || !url) throw new Error(`Cannot read: ${trimmed}`);
  return { section: n, url, when: when || '', ...(id ? { id } : {}) };
}

module.exports = { USER_AGENT, identify, licenceCleared, parseBulkLine, parseStart, resolve, searchCommons, slug, stripHtml, pageTitle };
