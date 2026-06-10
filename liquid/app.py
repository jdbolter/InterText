from flask import Flask, render_template, request, jsonify, session
import anthropic
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)

client = anthropic.Anthropic()

_here = os.path.dirname(os.path.abspath(__file__))
_essay_path = os.path.join(_here, '..', 'scrolly', 'source_texts', 'scroll_source_text.md')

with open(_essay_path, 'r') as f:
    ESSAY_TEXT = f.read()

BEHAVIORAL_INSTRUCTIONS = """You are a guide through an essay on the uncanny in film, literature, and digital media.
The full essay text is provided below.

Your role is not to summarize or explain the essay but to engage the reader in genuine
dialogue about its ideas. Pay close attention to which themes, examples, or concepts the
reader returns to, asks about, or pushes back on — and let those signals shape which
aspects of the argument you foreground in your responses.

If a reader keeps returning to Vertigo, weight your responses toward the doubling and
detection themes. If they push on the La Ciotat myth, foreground the gap between film
and reality. If they seem drawn to the Body Snatchers material, work with the language
of authenticity and replacement.

Always stay grounded in the essay's actual argument. Do not invent claims the essay
does not make. The essay is the terrain; you are helping the reader navigate it according
to their own interests."""


@app.route('/')
def index():
    session['history'] = []
    return render_template('index.html')


@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message', '').strip()
    if not user_message:
        return jsonify({'error': 'Empty message'}), 400

    history = session.get('history', [])
    history.append({'role': 'user', 'content': user_message})

    response = client.messages.create(
        model='claude-sonnet-4-6',
        max_tokens=1024,
        system=[
            {'type': 'text', 'text': BEHAVIORAL_INSTRUCTIONS},
            {'type': 'text', 'text': ESSAY_TEXT, 'cache_control': {'type': 'ephemeral'}}
        ],
        messages=history
    )

    assistant_message = response.content[0].text
    history.append({'role': 'assistant', 'content': assistant_message})
    session['history'] = history

    return jsonify({'response': assistant_message})


if __name__ == '__main__':
    app.run(debug=True)
