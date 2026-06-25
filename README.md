# InterText

A platform for AI-mediated interactive reading experiences. Each text lives in its own folder with a config file; a shared generic API engine serves all of them.

```
InterText/
├── index.html          — landing page
├── api/
│   ├── chat.js         — generic Vercel serverless function (config-driven by textId)
│   └── evolve.js       — generic Vercel serverless function (config-driven by textId)
├── package.json
├── vercel.json
└── uncanny/            — "The Uncanny Double" essay (textId: 'uncanny')
    ├── config.js       — all text-specific content
    └── source_texts/
        ├── sections/   — essay sections loaded by the API
        └── full-uncanny.md
```

## uncanny

A web-based prototype for multi-turn conversation about an essay on the uncanny in film, literature, and digital media. Readers converse with an AI guide that reveals the argument section by section. Conversations can be contributed back to evolve the text for future readers. See `uncanny/CLAUDE.md` for setup and run instructions.

## Adding a new text

See the "Adding a New Text" section in `uncanny/CLAUDE.md` for the step-by-step pattern.
