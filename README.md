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

CaseIQ does not need a backend. If you want the AI features, open the app and click **API key** in the header. Paste your Claude key there and save it.

- The key is stored only in `sessionStorage` for the current browser tab.
- It is not committed to the repo and is not bundled into the app.
- The app uses the Anthropic direct browser API, so the key is sent only in the requests you make from the browser.

Use an Anthropic key that starts with `sk-ant-`. If the key is missing or rejected, the app will prompt you in the UI.

## Deployment

This is a static Vite app, so you can deploy it anywhere that serves static files.

Recommended options:

1. Vercel - import the repo, keep the build command as `npm run build`, and publish the `dist` folder.
2. Netlify - set the build command to `npm run build` and the publish directory to `dist`.
3. Cloudflare Pages or any static host - same build output, same `dist` folder.

### Deploy steps

1. Push the repo to GitHub.
2. Connect the repo to your host of choice.
3. Set the build command to `npm run build`.
4. Set the output/public directory to `dist`.
5. Deploy.

### API key after deploy

There is no server-side environment variable for the Claude key in this app. Users enter their own key in the browser via the **API key** button after the site loads.

If you later add a backend proxy, that would be the place to move the key out of the browser. In the current version, the browser-held key is the intended setup.

## Notes

- The project expects the `xlsx` package to parse medical workbooks.
- Print / PDF export uses the browser print dialog and the print stylesheet in `src/index.css`.
- If you change the UI or file parsing, run `npm run build` before deploying.
