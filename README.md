# CaseIQ

CaseIQ is a legal case workspace for personal-injury attorneys, starting from a medical chronology timeline and growing toward the full case-story platform described in [docs/PRD.md](docs/PRD.md). It accepts an Excel workbook, normalises the rows into a treatment timeline, highlights gaps and key moments, and can generate grounded AI summaries, Q&A, and a defense-style stress test.

This build (Priority 0 of the PRD's roadmap) focuses on making the existing chronology durable: imported cases now persist in a real database instead of living only in browser memory, and any rows the parser can't place on the timeline are reported explicitly instead of silently dropped.

## Structure

```
/app              Next.js App Router — pages and API routes
  /api/import         POST — persists a parsed workbook (case, import batch, medical records, timeline events)
  /api/cases/current   GET — hydrates the most recently created case (no case switcher yet — Priority 1)
  /api/cases/[caseId]  PATCH — persists the confirmed incident date
  /api/anthropic       POST — proxies AI requests, key never reaches the browser
/db               Drizzle ORM schema + client (Postgres)
/backend          Shared Anthropic-calling logic, used by the /api/anthropic route
/lib              Excel parsing, event analysis, timeline geometry, AI prompt building — framework-agnostic
/components       UI components (timeline, panels, exhibit view, landing)
/hooks            useCaseData (now DB-backed), useAI, useFilters, useIdentity
/types            Shared TypeScript types
```

## Local setup

```bash
npm install
```

You'll need a Postgres database. The easiest path is Vercel Postgres (Storage → Create Database → Postgres in the Vercel dashboard), which gives you a connection string. Put it in `.env.local`:

```bash
DATABASE_URL=postgres://...
```

Then push the schema and start the dev server:

```bash
npm run db:push
npm run dev
```

Other scripts:

```bash
npm run build        # production build
npm run start         # run the production build locally
npm run db:studio     # browse the database in Drizzle Studio
```

## Claude API key

AI requests go through `/api/anthropic`, a server-side route. The Claude key never goes into the browser.

Set `ANTHROPIC_API_KEY` as an environment variable — locally in `.env.local`, and in Vercel project settings for the **Production** environment. Use an Anthropic key that starts with `sk-ant-`. Adding or changing the variable does not affect deployments that already ran — trigger a new deployment afterward.

## Deployment

This app is meant to be hosted on Vercel — it's a standard Next.js App Router project, so no custom build configuration is needed.

1. Push the repo to GitHub and import it into Vercel.
2. Add a Postgres database from the Vercel dashboard (Storage tab) — this auto-injects the connection string as an env var.
3. Add `ANTHROPIC_API_KEY` (Production environment).
4. Run `npm run db:push` against the production database (or set up a migration step in CI) before the first deploy that needs it.
5. Deploy.

## What's implemented vs. what's next

See [docs/PRD.md](docs/PRD.md) for the full roadmap. This build covers Priority 0: import diagnostics and row-level provenance, and a chronology that survives a page refresh. Multi-case switching, client context, evidence, and the presentation builder are later priorities and not yet built.

## Notes

- The project expects the `xlsx` package to parse medical workbooks. Parsing still happens client-side — only the extracted structured fields (dates, providers, summaries) are sent to the server for persistence, not the file itself.
- Print / PDF export uses the browser print dialog and the print stylesheet in `app/globals.css`.
- If you change the UI or file parsing, run `npm run build` before deploying.
