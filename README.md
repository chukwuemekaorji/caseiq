# CaseIQ

CaseIQ is a browser-based medical chronology review tool for personal-injury case work. It accepts an Excel workbook, normalises the rows into a treatment timeline, highlights gaps and key moments, and can generate grounded AI summaries, Q&A, and a defense-style stress test. Everything runs locally in the browser except optional Claude API requests.

## What it does

- Drop in an `.xlsx` or `.xls` medical chronology.
- Review the parsed event table, trace, filters, and day details.
- Switch to a presentation-safe exhibit view and export to PDF with print.
- Optionally use Claude for story generation, key moments, Q&A, and stress testing.

## Local setup

```bash
npm install
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

## Claude API key

CaseIQ now uses a backend function for AI requests. The Claude key never goes into the browser.

Set the following Vercel environment variable on the project:

- `ANTHROPIC_API_KEY`

Use an Anthropic key that starts with `sk-ant-`.

## Deployment

This app is meant to be hosted on Vercel.

### Vercel setup

1. Push the repo to GitHub.
2. Open Vercel and choose **Add New -> Project**.
3. Import the GitHub repo.
4. Keep the default framework detection as Vite.
5. Add the `ANTHROPIC_API_KEY` environment variable in Vercel project settings.
6. Set the build command to `npm run build`.
7. Set the output directory to `dist`.
8. Deploy.

The backend lives in the Vercel `api/` folder, so the browser only talks to your own `/api/anthropic` route. If you want to test the backend locally too, use `vercel dev` from the repo root so the function is available during development.

## Notes

- The project expects the `xlsx` package to parse medical workbooks.
- Print / PDF export uses the browser print dialog and the print stylesheet in `src/index.css`.
- If you change the UI or file parsing, run `npm run build` before deploying.
