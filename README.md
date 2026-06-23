# uncanny_doubles

Two experiments in adaptive reading about the uncanny.

```
uncanny_doubles/
├── index.html          — landing page (links to both apps)
├── api/
│   └── chat.js         — Vercel serverless function (used by liquid)
├── package.json
├── vercel.json
├── scrolly/            — scroll-driven visual essay (HTML/CSS/JS, no backend)
└── liquid/             — multi-turn conversation interface (Vercel + Anthropic API)
    └── source_texts/
        ├── sections/   — essay sections loaded by the serverless function
        └── full-uncanny.md
```

## scrolly

A scroll-driven visual essay format. See `scrolly/CLAUDE.md` for build and editing instructions.

## liquid

A web-based prototype for multi-turn conversation about the essay, using Anthropic prompt caching to load the essay once per session. See `liquid/CLAUDE.md` for setup and run instructions.
