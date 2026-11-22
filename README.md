# VALTRIX

Measure Content. Maximize Value.

VALTRIX is a content audit tool built with Next.js, React, TypeScript, and Tailwind CSS. Paste a draft to detect its main topic and get separate E-E-A-T signal and generative search readiness scores. These are rules-based estimates from the text. The last 20 reports are stored in the browser running the audit.

## Local development

```bash
npm ci
npm run dev
```

Open http://localhost:3000. The audit workspace is at `/dashboard`.

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

## Deployment

Import the dedicated `valtrix` GitHub repository as a new project in the Vercel account or team that owns RankingPost. Use the Next.js framework preset and the repository root. The project uses the standard npm build script and requires no environment variables. Set the production branch to `main` so pushes deploy automatically.
