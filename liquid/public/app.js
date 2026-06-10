const conv = document.getElementById('conversation');
const input = document.getElementById('message-input');
const btn = document.getElementById('send-btn');

// Conversation history lives here in the browser
let history = [];

function appendTurn(role, text) {
  const turn = document.createElement('div');
  turn.className = `turn ${role}`;

  const label = document.createElement('div');
  label.className = 'turn-label';
  label.textContent = role === 'reader' ? 'Reader' : 'Guide';

  const body = document.createElement('div');
  body.className = 'turn-body';
  body.textContent = text;

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

  appendTurn('reader', text);
  showThinking();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history })
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
