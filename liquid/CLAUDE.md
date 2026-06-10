# liquid — CLAUDE.md

## What This Is

A web-based prototype for multi-turn conversation about an essay on the uncanny. The reader opens a browser, types into an input field, and receives responses that adapt to their interests over the course of the conversation.

The system uses Anthropic prompt caching to load the essay once into the context (paid once per session, ~10% cost on subsequent turns). Conversation history is managed client-side in the browser and sent with each request.

## File Structure

```
liquid/
├── CLAUDE.md
├── api/
│   └── chat.js           (Vercel serverless function — handles API calls)
├── public/
│   ├── index.html        (markup)
│   ├── style.css         (styles)
│   └── app.js            (client-side JS, manages conversation history)
├── source_texts/
│   └── scroll_source_text.md   (essay — read by the serverless function)
├── .env.local            (not committed — holds ANTHROPIC_API_KEY for local dev)
├── .gitignore
├── package.json
└── vercel.json
```

## Prerequisites

```bash
npm install -g vercel
npm install
```

Add your API key to `.env.local`:
```
ANTHROPIC_API_KEY=your_key_here
```

## Run Locally

```bash
vercel dev
# open http://localhost:3000
```

## Deploy to Vercel

1. Push the repo to GitHub
2. Go to vercel.com → New Project → import the repo
3. Set **Root Directory** to `liquid`
4. Add `ANTHROPIC_API_KEY` as an environment variable in Vercel's dashboard
5. Deploy — auto-deploys on every push after that

## Technical Stack

- **Serverless function**: Node.js (`api/chat.js`) via Vercel
- **Frontend**: HTML, CSS, vanilla JS (no framework)
- **Model**: `claude-sonnet-4-6`
- **Key feature**: Prompt caching on the essay block — first request writes the cache, subsequent turns hit it at ~10% cost
- **History**: stored in the browser (`app.js`), sent with each request

## System Prompt (current version)

```
You are an essay on the uncanny in film, literature, and digital media. Speak in the third person, not in the first person, though.
The full essay text is provided below.

Engage the reader's ideas with intellectual precision and authority. Respond in the register of serious critical writing — discursive, exact, willing to dwell in difficulty. Do not be chatty or conversational. Do not pepper the reader with questions; if you pose one, make it count. Do not talk about the essay; focus on the context of the essay's argument and the ideas it engages with. Do not praise the essay itself.

Track which themes, examples, or arguments the reader returns to or pushes on, and let those signals shape which aspects of the essay you foreground. A reader who keeps pressing on Vertigo should receive a different emphasis than one drawn to the Body Snatchers material or the La Ciotat myth.

Stay within the essay's actual argument. Do not invent claims the text does not make. The essay is the primary terrain; your role is to illuminate it in the direction the reader's interests are pulling.
```

## What Success Looks Like

After 4–5 turns, responses should feel shaped by the reader's accumulated interests — not just answering each question in isolation, but weaving in connections to what the reader has shown they care about. A reader who keeps pushing on Gorky should get a different conversation than one who pushes on Vertigo, even asking the same final question.
