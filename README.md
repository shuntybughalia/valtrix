# VALTRIX

Measure Content. Maximize Value.

VALTRIX is a content audit tool built with Next.js, React, TypeScript, and Tailwind CSS. Paste a draft to detect its main topic and get separate E-E-A-T signal and generative search readiness scores. These are rules-based estimates from the text. The last 20 reports are stored in the browser running the audit.

## Local development

```bash
npm ci
npm run dev
```

Open http://localhost:3000. The rules-based audit workspace is at `/dashboard`.

The AI Content Quality Checker is at `/dashboard/quality`. Set `GEMINI_API_KEY` in a local `.env.local` file or in Vercel's server-side environment variables. The optional `GEMINI_CONTENT_QUALITY_MODEL` variable overrides the default `gemini-3.1-flash-lite` model and must support Gemini's GenerateContent API with structured JSON output. Restart the local server or redeploy after changing environment values. Never use a `NEXT_PUBLIC_` name for the key.

The checker submits up to 100,000 characters to Google Gemini in a single request for a document-wide review. The original is held in the open page and displayed alongside the report. For HTML, source view displays the exact submitted source. Formatted preview runs in a sandbox with external assets disabled. Free-tier requests are subject to the Google API project's quota and data-use terms. For a public deployment, apply a platform rate limit to `/api/content-quality`.

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

## Deployment

Import the dedicated `valtrix` GitHub repository as a new project in the Vercel account or team that owns RankingPost. Use the Next.js framework preset and the repository root. Set the production branch to `main` so pushes deploy automatically.
