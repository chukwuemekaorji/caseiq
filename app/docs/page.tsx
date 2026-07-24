"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ReadingBuddy from "@/components/illustrations/ReadingBuddy";

interface Topic {
  id: string;
  label: string;
  summary: string;
  steps: string[];
  note?: string;
}

const TOPICS: Topic[] = [
  {
    id: "getting-started",
    label: "1. Getting started",
    summary: "There's no real account system — just a name so the app knows what to call you.",
    steps: [
      "Open the app and type a name on the welcome screen. This is stored only in your browser (localStorage) — it's a greeting, not a login.",
      "Every case lives in one shared database. Anyone who opens the app — on any device — sees the same case list. There's currently no per-person privacy boundary, so don't put anything in here you wouldn't want a colleague to also see.",
      "From \"My cases\" you can open an existing case or start a new one.",
    ],
  },
  {
    id: "uploading",
    label: "2. Uploading records",
    summary: "Turn an Excel chronology into a case, either one at a time or in bulk.",
    steps: [
      "Click \"New case.\" Choose single-case mode to name the case and upload one or more Excel files that all belong to the same client.",
      "Or choose bulk mode to upload several files at once, each becoming its own separate case — useful when you're importing a batch of unrelated matters in one go.",
      "The parser looks for column headers like date, provider, facility, body part, specialty, record type, and summary. Rows it can't confidently map (blank rows, unreadable dates) are reported as skipped, not silently dropped — check the import banner on the Timeline page.",
      "You can add more records to an existing case later from the Timeline page's \"Add records\" button.",
    ],
  },
  {
    id: "timeline",
    label: "3. Timeline",
    summary: "The core chronology view — every record plotted against time.",
    steps: [
      "Hover over a point on the trace for a quick summary of that day's events; click it to pin the full detail panel below.",
      "Use the filter bar to narrow by severity, provider, or body part.",
      "Gaps in treatment longer than 60 days are marked distinctly — worth reviewing before the defence does.",
    ],
  },
  {
    id: "context",
    label: "4. Client context",
    summary: "Attorney notes that live alongside the medical record — things the records alone don't capture.",
    steps: [
      "Add a note (e.g. something the client told you), tag it with a category, and mark it confidential if it shouldn't be used for AI grounding.",
      "Mark a note \"verified\" once you've confirmed it independently.",
      "Use \"Suggest\" to have the AI draft a story-point framing and follow-up questions from a note — it's a starting point, not a final answer, and you decide whether to use it.",
      "Convert a note into a story point or an evidence item once it's ready to be used in the case narrative.",
    ],
  },
  {
    id: "evidence",
    label: "5. Evidence",
    summary: "Everything beyond the medical record itself — documents, statements, exhibits.",
    steps: [
      "Add an evidence item with a title, category, and description.",
      "Mark it verified or disputed as you confirm it, and toggle \"include in presentation\" once it's ready for a jury-facing deck.",
    ],
  },
  {
    id: "evidence-composition",
    label: "6. Evidence composition",
    summary: "See both sides of a claim before the defence does.",
    steps: [
      "Click \"Generate from record\" to have the AI review the full timeline and draft 4-6 claim compositions — each with the defence's strongest argument, the missing evidence that would strengthen it, and a grounded attorney response.",
      "This can take under a minute on a large case since it reads the whole record — the button stays disabled with a spinner until it's done.",
      "Review each one, approve it, and toggle \"include in presentation\" for anything that should reach the deck.",
    ],
  },
  {
    id: "story",
    label: "7. Story",
    summary: "AI-drafted narratives for each stage of telling the case.",
    steps: [
      "Each of the seven sections (30-second summary, medical journey, life impact, financial impact, before/after, opening, closing) has its own \"Generate\" button — generate them independently, in any order.",
      "Edit the draft directly in the text box; edits save automatically when you click away.",
      "Click \"Approve for presentation\" once a section is ready — only approved narratives are used when assembling a deck.",
    ],
  },
  {
    id: "presentation",
    label: "8. Presentation",
    summary: "The jury-facing deck — assembled only from what you've already approved.",
    steps: [
      "Click \"Generate from approved content\" to assemble a deck from approved Story sections, approved evidence compositions marked for inclusion, and evidence marked for inclusion. Nothing is freshly written by AI at this step — it only arranges what's already been reviewed.",
      "Add, duplicate, reorder, or delete slides manually, and edit any slide's content directly.",
      "Use \"Jury view\" for a fullscreen presentation mode (arrow keys to navigate), \"Export PDF\" to print the deck, or \"Export PPTX\" to download an editable PowerPoint file.",
    ],
  },
  {
    id: "ask",
    label: "9. Ask the record",
    summary: "Ask a direct question and get an answer grounded in the uploaded records.",
    steps: [
      "Type any question about the case, or use one of the suggested prompts.",
      "Every answer cites the specific record numbers it's drawn from — click a citation to jump straight to that record on the Timeline.",
      "If the records don't support an answer, it says so directly rather than guessing.",
    ],
  },
  {
    id: "managing-cases",
    label: "10. Managing cases",
    summary: "The case list, and how to remove a case you no longer need.",
    steps: [
      "\"My cases\" lists every case in the shared database, with the record count and creation date.",
      "Click the trash icon on a case row to delete it. You'll be asked to confirm — this permanently removes the case and everything in it (timeline, evidence, story, presentations). It can't be undone.",
    ],
  },
];

export default function DocsPage() {
  const [topicId, setTopicId] = useState(TOPICS[0].id);
  const topic = TOPICS.find((t) => t.id === topicId)!;

  return (
    <div className="min-h-screen bg-film text-ink">
      <header className="flex items-center gap-4 border-b border-ink/10 px-8 py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-graphite hover:text-ink"
        >
          <ArrowLeft size={12} /> My cases
        </Link>
        <span className="ml-auto font-mono text-xs uppercase tracking-widest text-graphite">Directions</span>
      </header>

      <main className="mx-auto max-w-3xl px-8 py-12">
        <div className="mb-8 flex items-center gap-5">
          <ReadingBuddy className="h-24 w-24 shrink-0" />
          <div>
            <h1 className="font-display text-3xl uppercase tracking-tight">How CaseIQ works</h1>
            <p className="text-sm text-ink/70">Pick a section below for step-by-step directions.</p>
          </div>
        </div>

        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-graphite">
          Section
        </label>
        <select
          value={topicId}
          onChange={(event) => setTopicId(event.target.value)}
          className="mb-8 w-full border border-ink/25 bg-white/60 px-4 py-3 text-base focus:border-ink/60 focus:outline-none"
        >
          {TOPICS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>

        <div className="border-t border-ink/10 pt-6">
          <h2 className="mb-2 font-display text-2xl uppercase tracking-tight">{topic.label}</h2>
          <p className="mb-6 text-sm text-ink/70">{topic.summary}</p>
          <ol className="space-y-4">
            {topic.steps.map((step, index) => (
              <li key={index} className="flex gap-4">
                <span className="w-6 shrink-0 font-display text-xl text-graphite">{index + 1}</span>
                <p className="text-sm leading-relaxed text-ink/85">{step}</p>
              </li>
            ))}
          </ol>
          {topic.note && <p className="mt-4 font-mono text-xs text-amber">{topic.note}</p>}
        </div>
      </main>
    </div>
  );
}
