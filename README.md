# CaseIQ

CaseIQ is a browser-based medical chronology review tool for personal-injury case work. It accepts an Excel workbook, normalises the rows into a treatment timeline, highlights gaps and key moments, and can generate grounded AI summaries, Q&A, and a defense-style stress test. Everything runs locally in the browser except optional Claude API requests.

## Structure

```
/frontend   Vite + React app (the entire UI lives here)
/backend    Shared server-side logic (the Anthropic client)
/api        Thin Vercel serverless function entrypoints, imports from /backend
vercel.json Wires Vercel's build to frontend/, keeps api/ as functions
```

The split keeps the UI and the server logic independently scoped: `frontend/` never sees the Anthropic key, `backend/` holds the actual API-calling logic, and `api/` is just the Vercel-required routing shim on top of it. Add new endpoints by dropping a file in `api/` that imports whatever it needs from `backend/`.

## What it does

- Drop in an `.xlsx` or `.xls` medical chronology.
- Review the parsed event table, trace, filters, and day details.
- Switch to a presentation-safe exhibit view and export to PDF with print.
- Optionally use Claude for story generation, key moments, Q&A, and stress testing.

## Local setup

From the repo root:

```bash
npm run install:frontend
npm run dev
```

Build for production with:

```bash
npm run build
```

Preview the production build locally with:

```bash
npm run preview
```

These root scripts just delegate into `frontend/` via `--prefix`, so you can also `cd frontend` and run the usual `npm install`, `npm run dev`, etc. directly.

## Claude API key

CaseIQ uses a backend function for AI requests. The Claude key never goes into the browser.

Set the following Vercel environment variable on the project, for the **Production** environment specifically:

- `ANTHROPIC_API_KEY`

Use an Anthropic key that starts with `sk-ant-`. Adding or changing the variable does not affect deployments that already ran — trigger a new deployment afterward.

## Deployment

This app is meant to be hosted on Vercel.

### Vercel setup

1. Push the repo to GitHub.
2. Open Vercel and choose **Add New -> Project**.
3. Import the GitHub repo. Keep the Root Directory as the repo root (not `frontend/`) — `vercel.json` at the root handles pointing the build at `frontend/` while keeping `api/` discoverable.
4. Add the `ANTHROPIC_API_KEY` environment variable in Vercel project settings (Production environment).
5. Deploy. Build command, output directory, and install command all come from `vercel.json`.

The backend lives in the Vercel `api/` folder, so the browser only talks to your own `/api/anthropic` route. If you want to test the backend locally too, use `vercel dev` from the repo root so the function is available during development.

## Notes

- The project expects the `xlsx` package to parse medical workbooks.
- Print / PDF export uses the browser print dialog and the print stylesheet in `frontend/src/index.css`.
- If you change the UI or file parsing, run `npm run build` before deploying.
