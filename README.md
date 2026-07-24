# CaseIQ

CaseIQ is a legal case workspace for personal-injury attorneys. Upload a medical chronology (or several), and it becomes a case with a normalized timeline, gap/key-moment detection, attorney-curated client context and evidence, AI-drafted narratives, a defense-style claim stress test, and a presentation builder that exports to Jury View, PDF, and PowerPoint. See [docs/PRD.md](docs/PRD.md) for the original full-scope roadmap this was built against.

**No real authentication.** Identity is a name typed into `localStorage`, purely a greeting — every case lives in one shared database with no per-user ownership boundary. Anyone who opens the app, on any device, sees the same case list. Don't put anything in here you wouldn't want a colleague to also see.

## What's built

- **Case management** — create a case from one workbook, or bulk-upload several files as separate cases in one pass; add more records to an existing case later. Delete a case (cascades everything it owns).
- **Timeline** — hover a point for a summary, click to pin the full record; filter by severity/provider/body part; treatment gaps over 60 days are called out; a "stretch" control widens the trace and scrolls when a case has too many records to space out otherwise.
- **Import diagnostics** — every workbook row is accounted for; rows that don't parse (blank rows, unreadable dates) are reported, not silently dropped.
- **Client context** — attorney notes alongside the medical record, with AI-suggested story-point framing and follow-up questions (a draft the attorney decides whether to use).
- **Evidence** — track documents/statements outside the medical record, with verification status and presentation inclusion.
- **Evidence composition** — AI reviews the full timeline and drafts the defense's strongest challenges to 4-6 claims, each with the missing evidence that would strengthen it and a grounded attorney response.
- **Story** — seven AI-drafted narrative sections (30-second summary, medical journey, life impact, financial impact, before/after, opening, closing), editable, with an approval gate before anything reaches a deck.
- **Presentation** — assembles a deck from *only* attorney-approved content (no fresh AI writing at export time, aside from condensing approved text into slide-ready bullets — never inventing a new fact or citation). Slide-type-aware visual layouts (title, claim comparison, evidence list, content), a fullscreen Jury View with transitions, and export to print/PDF or an editable PPTX.
- **Ask the record** — grounded Q&A over the case; every answer cites specific record numbers or says the records don't support an answer, with clickable citations that jump to that record on the Timeline.
- **Directions** (`/docs`) — an in-app, dropdown-driven walkthrough of every workflow above.

## Structure

```
/app
  /api/import                          POST — persists a parsed workbook (case, import batch, medical records, timeline events)
  /api/cases                           GET (list) / POST (create)
  /api/cases/[caseId]                  GET / PATCH (incident date) / DELETE (cascades everything)
  /api/cases/[caseId]/context          Client context CRUD + AI suggestion
  /api/cases/[caseId]/evidence         Evidence CRUD
  /api/cases/[caseId]/evidence-composition   CRUD + AI generation
  /api/cases/[caseId]/story            Narrative CRUD + AI generation (7 types)
  /api/cases/[caseId]/presentation     Deck + slides CRUD, reorder, AI-assisted generation
  /api/cases/[caseId]/overview         Aggregate counts for the case dashboard
  /api/anthropic                       Proxies ad-hoc AI requests (Ask the Record) — key never reaches the browser
  /cases/[caseId]/*                    Overview, Timeline, Client context, Evidence, Evidence composition,
                                        Story, Presentation, Ask the record — one layout, tabbed nav
  /docs                                 Directions page
  /new                                  Case creation (single or bulk upload)

/db               Drizzle ORM schema (db/schema.ts) + lazy Postgres client (db/client.ts)
/backend          Anthropic Messages API client (backend/anthropicClient.ts) — thinking disabled, structured outputs
/lib              Excel parsing, event analysis, timeline geometry, AI prompt building, PPTX export — framework-agnostic
/components       Timeline (Trace/DayDetail), panels, presentation (JuryView/SlideCanvas/PrintableDeck), illustrations, landing
/hooks            useCaseData, useCaseList, useCaseSummary, useAI, useFilters, useIdentity
/types            Shared TypeScript types
```

## Local setup

```bash
npm install
```

You'll need a Postgres database — this project was built against [Supabase](https://supabase.com). Create a project, then set both of these in `.env.local`:

```bash
DATABASE_URL=postgres://...   # transaction pooler connection, used at runtime
DIRECT_URL=postgres://...     # session pooler connection, used for migrations (drizzle-kit)
ANTHROPIC_API_KEY=sk-ant-...
```

Supabase's *direct* connection is IPv6-only and may be unreachable depending on your network — use the **pooler** connection strings from the Supabase dashboard for both variables above (session pooler for `DIRECT_URL`, transaction pooler for `DATABASE_URL`), not the direct one.

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

AI requests go through server-side routes (`/api/anthropic` for ad-hoc Q&A, plus dedicated `generate` routes per feature) — the key never reaches the browser.

Set `ANTHROPIC_API_KEY` — locally in `.env.local`, and in Vercel project settings for the **Production** environment. Adding or changing the variable does not affect deployments that already ran — trigger a new deployment afterward.

The model in use is `claude-sonnet-5`. Extended thinking is explicitly disabled on every call (`thinking: { type: "disabled" }`) — this model runs reasoning by default on complex prompts, and those tokens count against `max_tokens`; left enabled, a large case context can burn the entire budget on invisible reasoning and return an empty response.

## Deployment

Standard Next.js App Router project on Vercel — no custom build configuration needed.

1. Push the repo to GitHub and import it into Vercel.
2. Add `DATABASE_URL`, `DIRECT_URL`, and `ANTHROPIC_API_KEY` (Production environment) — see above for where the first two come from.
3. Run `npm run db:push` against the production database before the first deploy that needs the new schema.
4. Deploy.

## Notes

- Excel parsing happens entirely client-side (the `xlsx` package, in the browser) — only the extracted structured fields (dates, providers, summaries) are sent to the server for persistence, never the original file.
- The app is built to survive an unreachable database: the Postgres client fails fast (3s connect / 6s query timeout) instead of hanging, and client-side fetches are timeout-bounded, so upload, parsing, the timeline, and the exhibit views keep working even when nothing can be saved.
- Citations use a case-scoped `recordNumber`, not the raw spreadsheet row — necessary once a case can be built from multiple uploaded files, since raw row numbers collide across files.
- Print/PDF export uses the browser print dialog and the print stylesheet in `app/globals.css`; PPTX export uses `pptxgenjs` entirely client-side.
- If you change the UI, API routes, or file parsing, run `npm run build` before deploying — it runs the TypeScript check.
