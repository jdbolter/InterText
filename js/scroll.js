// ── Uncanny Doubles — scroll.js ──

// SVG coordinate space for the uncanny valley graph
// ViewBox: 0 0 480 320
// Axes origin: (55, 265)  x-max: 435  y-min: 20

const OX = 55, OY = 265, W = 480, H = 320;

// The valley curve path — drawn once, annotated progressively across steps 1/6/9.
//
// Shape: industrial (low) → rise → humanoid peak → sharp valley drop → steep rise → asymptote
// Valley bottom ≈ x=265 (55 % of x-range)
// Post-valley ascent: film / CG / VR cluster on the steep far slope
//
const CURVE = [
  `M ${OX},${OY - 40}`,
  `C ${OX + 30},${OY - 70} ${OX + 70},${OY - 100} ${OX + 110},${OY - 110}`,
  `C ${OX + 140},${OY - 122} ${OX + 155},${OY - 108} ${OX + 168},${OY - 108}`,
  `C ${OX + 188},${OY - 108} ${OX + 198},${OY - 5}  ${OX + 213},${OY - 5}`,
  `C ${OX + 228},${OY - 5}  ${OX + 243},${OY - 178} ${OX + 268},${OY - 183}`,
  // Post-valley: rises steeply then levels to a horizontal plateau (second control and
  // endpoint share the same y → zero slope at the right edge, matching Mori's curve)
  `C ${OX + 305},${OY - 205} ${OX + 365},${OY - 220} ${W - 48},${OY - 220}`,
].join(' ');

// Approximate pixel positions for key points on the far slope
const FILM_X  = OX + 268;   // ≈ 323
const FILM_Y  = OY - 183;   // ≈ 82

// Data points for step 9 — plotted along the post-valley ascent
// x/y positions recalculated to follow the revised plateau curve
const MEDIA_POINTS = [
  { x: FILM_X,       y: FILM_Y,       label: 'Early film' },      // ≈ t=0  (323, 82)
  { x: FILM_X + 32,  y: FILM_Y - 16,  label: 'Sound / color' },   // ≈ t=0.25 (355, 66)
  { x: FILM_X + 64,  y: FILM_Y - 28,  label: 'CG' },              // ≈ t=0.5  (387, 54)
  { x: FILM_X + 92,  y: FILM_Y - 36,  label: 'VR' },              // ≈ t=0.75 (415, 46)
];

// ── Zoomed graph for step 9 ───────────────────────────────────────────────
// Crops the SVG viewBox to the top-right ascending section so the media-point
// labels have room to spread out without crowding or crossing the curve line.

function buildGraphZoomed() {
  // Viewport: x=265→475, y=18→133 — just the post-valley far slope
  const vbX = 265, vbY = 18, vbW = 210, vbH = 115;
  const asymY = OY - 224;  // 41 — the plateau asymptote

  // Labels alternate below / above as we move along the slope so they
  // never crowd each other or the "healthy human" asymptote annotation.
  // Below-dot labels fall in the space under the rising curve;
  // above-dot labels clear the curve line upward.
  const pts = [
    { x: FILM_X,      y: FILM_Y,      label: 'Early film',    dx: 12, dy: 20  },  // below
    { x: FILM_X + 32, y: FILM_Y - 16, label: 'Sound / color', dx: 12, dy: -15 },  // above
    { x: FILM_X + 64, y: FILM_Y - 28, label: 'CG',            dx: 12, dy: 20  },  // below
    { x: FILM_X + 92, y: FILM_Y - 36, label: 'VR',            dx: 12, dy: -14 },  // above
  ];

  const dots = pts.map(pt => `
    <circle class="g-dot" cx="${pt.x}" cy="${pt.y}" r="5"/>
    <text class="g-dlabel" x="${pt.x + pt.dx}" y="${pt.y + pt.dy}">${pt.label}</text>
  `).join('');

  return `
    <div class="graph-wrap">
      <p class="graph-heading">The Far Side of the Valley</p>
      <svg class="graph-svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}"
           xmlns="http://www.w3.org/2000/svg">
        <line class="g-asym"
              x1="${vbX}" y1="${asymY}" x2="${vbX + vbW}" y2="${asymY}"/>
        <text class="g-valley" text-anchor="end"
              x="${vbX + vbW - 2}" y="${asymY - 4}">healthy human</text>
        <path class="g-curve" d="${CURVE}"/>
        ${dots}
      </svg>
    </div>
  `;
}

// ── Graph builder ──────────────────────────────────────────────────────────

function buildGraph(state) {
  // state: 'initial' | 'film' | 'full'
  if (state === 'full') return buildGraphZoomed();

  const asymptoteY = OY - 224;

  // Valley label
  const valleyX = OX + 213;
  const valleyY = OY - 5;
  const valleyAnnotation = `
    <line class="g-drop" x1="${valleyX}" y1="${valleyY - 2}" x2="${valleyX}" y2="${OY}"/>
    <text class="g-valley" x="${valleyX - 24}" y="${valleyY - 14}">Uncanny</text>
    <text class="g-valley" x="${valleyX - 14}" y="${valleyY - 5}">Valley</text>
  `;

  // Asymptote line — shown in film and full states
  const asymptote = (state !== 'initial') ? `
    <line class="g-asym" x1="${OX}" y1="${asymptoteY}" x2="${W - 20}" y2="${asymptoteY}"/>
  ` : '';

  // Film dot + label — shown in film state only
  // Label above the dot so it clears the curve line
  const filmDot = (state === 'film') ? `
    <circle class="g-dot" cx="${FILM_X}" cy="${FILM_Y}" r="7"/>
    <line class="g-drop" x1="${FILM_X}" y1="${FILM_Y + 5}" x2="${FILM_X}" y2="${OY}"/>
    <text class="g-dlabel" x="${FILM_X + 10}" y="${FILM_Y - 14}">Film (La Ciotat effect)</text>
  ` : '';

  // All media points — shown in full state
  // r=7, labels placed above the dot (y - 14) with dark halo via CSS paint-order
  const allPoints = (state === 'full') ? MEDIA_POINTS.map((pt, i) => `
    <circle class="g-dot" cx="${pt.x}" cy="${pt.y}" r="7"/>
    <text class="g-dlabel" x="${pt.x + 8}" y="${pt.y - 14}">${pt.label}</text>
  `).join('') : '';

  return `
    <div class="graph-wrap">
      <p class="graph-heading">Human Likeness → Affinity</p>
      <svg id="graph-svg-${state}" class="graph-svg" viewBox="0 0 ${W} ${H}"
           xmlns="http://www.w3.org/2000/svg" aria-label="Mori's uncanny valley graph">

        <!-- Axes -->
        <line class="g-axis" x1="${OX}" y1="${OY}" x2="${W - 20}" y2="${OY}"/>
        <line class="g-axis" x1="${OX}" y1="${OY}" x2="${OX}" y2="14"/>

        <!-- Axis labels -->
        <text class="g-label" x="${(OX + W - 20) / 2}" y="${OY + 20}" text-anchor="middle">
          Human Likeness →
        </text>
        <text class="g-label"
              x="${OX - 14}" y="${(OY + 14) / 2}"
              text-anchor="middle"
              transform="rotate(-90 ${OX - 14} ${(OY + 14) / 2})">
          Affinity →
        </text>

        <!-- Asymptote -->
        ${asymptote}

        <!-- Valley annotation -->
        ${valleyAnnotation}

        <!-- The curve — animated on step 1 entry via JS stroke-dashoffset -->
        <path id="valley-curve" class="g-curve" d="${CURVE}"/>

        <!-- Overlaid data -->
        ${filmDot}
        ${allPoints}

      </svg>
    </div>
  `;
}

// ── Curve draw-in animation ────────────────────────────────────────────────

function animateCurve(panel) {
  const path = panel.querySelector('#valley-curve');
  if (!path) return;
  try {
    const len = path.getTotalLength();
    path.style.transition = 'none';
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    // Double rAF ensures the "none" transition takes effect before we set the real one
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        path.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(0.4, 0, 0.2, 1)';
        path.style.strokeDashoffset = 0;
      });
    });
  } catch (_) {}
}

// ── Panel map & activation ─────────────────────────────────────────────────

const panels = {};

function activateStep(stepNum) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('is-active'));
  document.querySelectorAll('.visual-panel').forEach(p => p.classList.remove('is-active'));

  const step = document.querySelector(`.step[data-step="${stepNum}"]`);
  if (step) step.classList.add('is-active');

  const panel = panels[stepNum];
  if (panel) panel.classList.add('is-active');

  // Re-run the draw animation every time step 1 becomes active
  if (stepNum === 1) animateCurve(panel);
}

// ── Init ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Collect all panels
  document.querySelectorAll('.visual-panel').forEach(el => {
    const num = parseInt(el.id.replace('visual-', ''), 10);
    panels[num] = el;
  });

  // Render graph panels
  panels[1].innerHTML = buildGraph('initial');
  panels[6].innerHTML = buildGraph('film');
  panels[9].innerHTML = buildGraph('full');

  // Show step 1 and trigger its animation after a brief paint delay
  activateStep(1);

  // ── Scrollama setup ────────────────────────────────────────────────────
  const scroller = scrollama();

  scroller
    .setup({
      step:   '.step',
      offset: 0.5,
      debug:  false,
    })
    .onStepEnter(({ element }) => {
      const stepNum = parseInt(element.dataset.step, 10);
      activateStep(stepNum);
    })
    .onStepExit(({ element }) => {
      element.classList.remove('is-active');
    });

  window.addEventListener('resize', scroller.resize);
});
