"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MessageCircleQuestion } from "lucide-react";
import { useCaseData } from "@/hooks/useCaseData";
import { useAI } from "@/hooks/useAI";
import Cited from "@/components/Cited";

const SUGGESTIONS = [
  "When was the first visit after the incident?",
  "How many physical therapy sessions were there?",
  "Which providers treated the neck or back?",
  "Is there a gap in treatment longer than 60 days?",
];

export default function AskPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const router = useRouter();
  const caseData = useCaseData(caseId);
  const ai = useAI(caseData.events, caseData.incidentDate, caseData.gaps);
  const [question, setQuestion] = useState("");

  const onCite = (recordNumber: number) => {
    router.push(`/cases/${caseId}/timeline?record=${recordNumber}`);
  };

  const submit = () => {
    const trimmed = question.trim();
    if (!trimmed) return;
    ai.ask(trimmed);
    setQuestion("");
  };

  if (caseData.caseLoading) {
    return <p className="py-24 text-center font-mono text-xs uppercase tracking-widest text-graphite">Loading case…</p>;
  }

  if (caseData.notFound) {
    return <p className="py-24 text-center font-mono text-xs uppercase tracking-widest text-graphite">Case not found.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl uppercase tracking-tight">Ask the record</h2>
        <p className="max-w-2xl text-sm text-ink/70">
          Ask anything about this case. Every answer is grounded in the imported medical records and cites the record
          numbers it draws from — if the records don&apos;t support an answer, it says so instead of guessing.
        </p>
      </div>

      <div className="border-t border-ink/15 pt-6">
        <div className="mb-3 flex gap-2">
          <MessageCircleQuestion size={16} className="mt-2 shrink-0 text-graphite" />
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
            placeholder="Ask anything about this case…"
            className="flex-1 border border-ink/25 bg-transparent px-3 py-2 text-sm focus:border-ink/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={submit}
            disabled={ai.busy === "qa" || !question.trim()}
            className="inline-flex items-center gap-2 border border-ink px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest hover:bg-ink hover:text-film disabled:opacity-40"
          >
            {ai.busy === "qa" && <Loader2 size={11} className="animate-spin" />}
            {ai.busy === "qa" ? "Working" : "Ask"}
          </button>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => ai.ask(suggestion)}
              disabled={ai.busy === "qa"}
              className="border border-ink/20 px-2 py-1 font-mono text-[10px] text-graphite hover:border-ink hover:text-ink disabled:opacity-40"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {ai.error && <p className="mb-4 font-mono text-xs uppercase tracking-widest text-amber">{ai.error}</p>}

        {ai.qa.length === 0 ? (
          <p className="text-sm italic text-graphite">No questions asked yet.</p>
        ) : (
          <AnimatePresence>
            {ai.qa.map((entry, index) => (
              <motion.div
                key={`${entry.question}-${index}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 border-t border-ink/10 pt-4"
              >
                <p className="mb-1.5 font-mono text-[11px] uppercase tracking-widest text-graphite">{entry.question}</p>
                <p className="text-sm leading-relaxed text-ink/85">
                  <Cited text={entry.answer} events={caseData.events} onCite={onCite} />
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
