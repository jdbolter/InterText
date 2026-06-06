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
  `C ${OX + 320},${OY - 198} ${OX + 375},${OY - 212} ${W - 48},${OY - 220}`,
].join(' ');

// Approximate pixel positions for key points on the far slope
const FILM_X  = OX + 268;   // ≈ 323
const FILM_Y  = OY - 183;   // ≈ 82

// Data points for step 9 — plotted along the post-valley ascent
const MEDIA_POINTS = [
  { x: FILM_X,       y: FILM_Y,       label: 'Early film' },
  { x: FILM_X + 38,  y: FILM_Y - 16,  label: 'Sound / color' },
  { x: FILM_X + 72,  y: FILM_Y - 26,  label: 'CG' },
  { x: FILM_X + 100, y: FILM_Y - 32,  label: 'VR' },
];

// ── Graph builder ──────────────────────────────────────────────────────────

function buildGraph(state) {
  // state: 'initial' | 'film' | 'full'

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
  const filmDot = (state === 'film') ? `
    <circle class="g-dot" cx="${FILM_X}" cy="${FILM_Y}" r="4.5"/>
    <line class="g-drop" x1="${FILM_X}" y1="${FILM_Y + 2}" x2="${FILM_X}" y2="${OY}"/>
    <text class="g-dlabel" x="${FILM_X + 9}" y="${FILM_Y - 6}">Film (La Ciotat effect)</text>
  ` : '';

  // All media points — shown in full state
  const allPoints = (state === 'full') ? MEDIA_POINTS.map((pt, i) => `
    <circle class="g-dot" cx="${pt.x}" cy="${pt.y}" r="${i === 0 ? 4.5 : 3.8}"/>
    <text class="g-dlabel" x="${pt.x + 7}" y="${pt.y + 4}">${pt.label}</text>
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
