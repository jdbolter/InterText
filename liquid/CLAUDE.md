# liquid — CLAUDE.md

## What This Is

A web-based prototype for multi-turn conversation about an essay on the uncanny. The reader opens a browser, types into an input field, and receives responses that adapt to their interests over the course of the conversation.

The system uses Anthropic prompt caching to load the essay once into the context (paid once per session, ~10% cost on subsequent turns). The model behaves as a "liquid network" guide: tracking which themes the reader gravitates toward and reshaping which aspects of the argument it foregrounds.

## File Structure

```
liquid/
├── CLAUDE.md
├── app.py                          (Flask backend)
├── templates/
│   └── index.html                  (conversation UI)
└── source_texts/                   (optional local copy — app reads from ../scrolly/source_texts/)
```

## Prerequisites

```bash
pip install flask anthropic
export ANTHROPIC_API_KEY=your_key_here
```

## Run

```bash
python app.py
# open http://localhost:5000
```

## Technical Stack

- **Backend**: Python / Flask
- **Frontend**: Single HTML page, vanilla JS
- **Model**: `claude-sonnet-4-6`
- **Key feature**: Prompt caching on the essay block — first request writes the cache, subsequent turns hit it at ~10% cost

## Prompt Caching Pattern

```python
response = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    system=[
        {"type": "text", "text": BEHAVIORAL_INSTRUCTIONS},
        {"type": "text", "text": ESSAY_TEXT, "cache_control": {"type": "ephemeral"}}
    ],
    messages=conversation_history
)
```

## System Prompt

```
You are a guide through an essay on the uncanny in film, literature, and digital media.
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
to their own interests.
```

## Design Notes (index.html)

- Clean serif or neutral sans-serif font, readable line length (~65 characters)
- Conversation as flowing exchange, not chat bubbles
- Reader input at bottom, full-width text field
- No avatars, no timestamps
- Brief header: "A conversation about the uncanny"

## What Success Looks Like

After 4–5 turns, responses should feel shaped by the reader's accumulated interests — not just answering each question in isolation, but weaving in connections to what the reader has shown they care about. A reader who keeps pushing on Gorky should get a different conversation than one who pushes on Vertigo, even asking the same final question.
