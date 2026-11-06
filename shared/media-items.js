// H-018: how a reply shows an item from its section's media list.
// A video whose embedding was checked plays in the page; an image whose licence was
// cleared is shown with its credit; anything else, and any image that fails to load,
// becomes a card that opens the item in a new tab.
(function (global) {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // Glyphs for the card's picture panel, drawn on a 64 x 64 grid.
  const GLYPHS = {
    video: ['M24 18 L48 32 L24 46 Z'],
    image: ['M10 46 L24 28 L34 40 L41 32 L54 46 Z', 'M44 22 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0'],
    link: ['M27 37 L37 27', 'M30 22 L34 18 a8 8 0 0 1 12 12 L42 34', 'M34 42 L30 46 a8 8 0 0 1 -12 -12 L22 30'],
  };
  const KIND_LABEL = { video: 'Video', image: 'Image', link: 'On the web' };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function domain(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
  }

  function newTab(a, url) {
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    return a;
  }

  function panel(kind) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 64 64');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'media-card-glyph');
    (GLYPHS[kind] || GLYPHS.link).forEach((d) => {
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', d);
      svg.appendChild(path);
    });
    const box = el('span', `media-card-panel media-card-${kind}`);
    box.appendChild(svg);
    return box;
  }

  function card(item, note) {
    const a = newTab(el('a', 'media-card'), item.url);
    a.appendChild(panel(item.kind));
    const text = el('span', 'media-card-text');
    text.appendChild(el('span', 'media-card-kind', KIND_LABEL[item.kind] || KIND_LABEL.link));
    text.appendChild(el('span', 'media-card-title', item.title));
    const where = item.source || domain(item.url);
    text.appendChild(el('span', 'media-card-source', `${where}${where ? ' · ' : ''}opens in a new tab ↗`));
    if (note) text.appendChild(el('span', 'media-card-note', note));
    a.appendChild(text);
    a.setAttribute('aria-label', `${item.title} (opens in a new tab)`);
    return a;
  }

  function caption(item, linkText) {
    const cap = el('figcaption', 'image-credit');
    const words = item.credit || [item.title, item.source].filter(Boolean).join('. ');
    cap.appendChild(document.createTextNode(`${words} `));
    if (item.licence && item.licence.url) {
      cap.appendChild(newTab(el('a', null, item.licence.name || 'Licence'), item.licence.url));
      cap.appendChild(document.createTextNode(' · '));
    }
    cap.appendChild(newTab(el('a', null, linkText), item.url));
    return cap;
  }

  function videoSrc(embed) {
    if (!embed || typeof embed.videoId !== 'string' || !/^[\w-]+$/.test(embed.videoId)) return null;
    const start = Number.isInteger(embed.start) && embed.start > 0 ? embed.start : 0;
    if (embed.provider === 'youtube') {
      return `https://www.youtube-nocookie.com/embed/${embed.videoId}?rel=0${start ? `&start=${start}` : ''}`;
    }
    if (embed.provider === 'vimeo') {
      return `https://player.vimeo.com/video/${embed.videoId}?dnt=1${start ? `#t=${start}s` : ''}`;
    }
    return null;
  }

  function video(item) {
    const src = videoSrc(item.embed);
    if (!src) return null;
    const figure = el('figure', 'media-video');
    const frame = el('div', 'media-video-frame');
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = item.title;
    iframe.loading = 'lazy';
    iframe.allow = 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    // YouTube's player refuses to play without the page's origin as referrer.
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.appendChild(iframe);
    figure.appendChild(frame);
    const where = item.embed.provider === 'vimeo' ? 'Vimeo' : 'YouTube';
    figure.appendChild(caption(item, `Watch on ${where} ↗`));
    return figure;
  }

  function image(item) {
    const src = item.embed && item.embed.src;
    if (typeof src !== 'string' || !/^https:\/\//.test(src)) return null;
    const figure = el('figure', 'media-image');
    const img = document.createElement('img');
    img.src = src;
    img.alt = item.embed.alt || item.title;
    img.loading = 'lazy';
    if (item.embed.width && item.embed.height) {
      img.width = item.embed.width;
      img.height = item.embed.height;
    }
    // If the image cannot be had after all, the reader still gets the way to it.
    img.addEventListener('error', () => figure.replaceWith(card(item)), { once: true });
    const link = newTab(el('a', 'media-image-link'), item.url);
    link.appendChild(img);
    figure.appendChild(link);
    figure.appendChild(caption(item, `Source: ${domain(item.url) || 'original'} ↗`));
    return figure;
  }

  function render(item) {
    const checked = item.status === 'ok';
    if (item.kind === 'video' && checked) return video(item) || card(item);
    if (item.kind === 'image' && checked && item.licence && item.licence.cleared === true) return image(item) || card(item);
    return card(item);
  }

  global.MediaItems = { render, card, videoSrc };
})(typeof window !== 'undefined' ? window : globalThis);
