// ── Uncanny Doubles — scroll.js ──

const panels = {};

function activateStep(stepNum) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('is-active'));
  document.querySelectorAll('.visual-panel').forEach(p => p.classList.remove('is-active'));

  const step = document.querySelector(`.step[data-step="${stepNum}"]`);
  if (step) step.classList.add('is-active');

  const panel = panels[stepNum];
  if (panel) panel.classList.add('is-active');
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.visual-panel').forEach(el => {
    const num = parseInt(el.id.replace('visual-', ''), 10);
    panels[num] = el;
  });

  activateStep(1);

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
