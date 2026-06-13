const conv = document.getElementById('conversation');
const input = document.getElementById('message-input');
const btn = document.getElementById('send-btn');
const intro = document.getElementById('intro');

let history = [];
let firstSend = true;
let sectionIndex = 0;

const SECTION_INTROS = [
  `<p>In 1970, Japanese roboticist Masahiro Mori drew a graph. On one axis: how human-like a robot looks. On the other: how much affinity people feel toward it. The line rises steadily — then suddenly plummets. There is a valley right at the point of near-human resemblance. He called it the uncanny valley. It was an observation about robots, but it also applied to computer graphics and other media forms.</p>`,

  `<p>It&rsquo;s January 1896, and you&rsquo;re sitting in the audience in a hall in the Grand Caf&eacute; in Paris, about to watch one of the first public demonstrations of the Lumi&egrave;re brothers&rsquo; all-in-one camera and projector: the cin&eacute;matographe. One of the films shown is &ldquo;The Arrival of the Train at la Ciotat Station.&rdquo; Legend has it that the audience fears that the train will break through the screen and crush them. They rush for the doors.</p>`,

  `<p>In The Invasion of the Body Snatchers (1956), a small-town doctor named Miles is called to examine a strange body found in his friend&rsquo;s basement. It looks human &mdash; it has all the features. But something is wrong. &ldquo;It&rsquo;s like the first impression that&rsquo;s stamped on a coin,&rdquo; his friend says. &ldquo;It isn&rsquo;t finished.&rdquo; No details. No character. No lines. The pod double is in the uncanny valley. The film understands this instinctively, decades before anyone had a name for it.</p>`,

  `<p>In September 2023, Mark Zuckerberg sat across from podcaster Lex Fridman for an interview. They were not in the same room. They appeared as photorealistic avatars &mdash; truncated floating figures, torsos only, suspended in a black space. Fridman kept repeating: &ldquo;This is incredible. The realism here is just incredible.&rdquo; Near the end, Zuckerberg said something almost offhand: &ldquo;We want to get more people scanned and into the system.&rdquo;</p>`,

  `<p>Film is more than a century old. It has survived and flourished in a media economy that includesphotography, radio, television, video games, streaming. Each has flourished not by winning the argument about realism, but by refusing to settle it.</p>`,
];

// Set initial intro for the default active section
intro.innerHTML = SECTION_INTROS[sectionIndex];

// TOC navigation
document.querySelectorAll('.toc-item').forEach(item => {
  item.addEventListener('click', () => {
    sectionIndex = parseInt(item.dataset.section, 10);
    document.querySelectorAll('.toc-item').forEach(el => el.classList.remove('active'));
    item.classList.add('active');
    intro.innerHTML = SECTION_INTROS[sectionIndex];
    intro.classList.remove('is-hiding');
    firstSend = true;
  });
});

function appendTurn(role, text) {
  const turn = document.createElement('div');
  turn.className = `turn ${role}`;

  const label = document.createElement('div');
  label.className = 'turn-label';
  label.textContent = role === 'reader' ? 'Reader' : 'Guide';

  const body = document.createElement('div');
  body.className = 'turn-body';
  text.split(/\n\n+/).forEach(para => {
    const trimmed = para.trim();
    if (trimmed) {
      const p = document.createElement('p');
      p.textContent = trimmed;
      body.appendChild(p);
    }
  });

  turn.appendChild(label);
  turn.appendChild(body);
  conv.appendChild(turn);
  turn.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function showThinking() {
  const el = document.createElement('div');
  el.className = 'thinking';
  el.id = 'thinking';
  el.textContent = '…';
  conv.appendChild(el);
  el.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function removeThinking() {
  const el = document.getElementById('thinking');
  if (el) el.remove();
}

async function send() {
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  input.style.height = 'auto';
  btn.disabled = true;

  if (firstSend) {
    firstSend = false;
    intro.classList.add('is-hiding');
  }

  appendTurn('reader', text);
  showThinking();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history, sectionIndex })
    });

    const data = await res.json();
    removeThinking();

    if (data.response) {
      history.push({ role: 'user', content: text });
      history.push({ role: 'assistant', content: data.response });
      appendTurn('guide', data.response);
    } else {
      appendTurn('guide', '[No response]');
    }
  } catch (err) {
    removeThinking();
    appendTurn('guide', '[Error reaching server]');
  }

  btn.disabled = false;
  input.focus();
}

btn.addEventListener('click', send);

input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    send();
  }
});

input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = input.scrollHeight + 'px';
});
