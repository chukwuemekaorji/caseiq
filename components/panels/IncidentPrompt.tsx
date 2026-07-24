"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { IncidentGuess } from "../../lib/analyze";

interface Props {
  guess: IncidentGuess | null;
  onConfirm: (date: Date) => void;
}

export default function IncidentPrompt({ guess, onConfirm }: Props) {
  const [manual, setManual] = useState(guess ? guess.date.toISOString().slice(0, 10) : "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-2xl border border-ink/15 bg-white/60 p-8"
    >
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-graphite">
        Step one · the incident
      </p>

      {guess ? (
        <>
          <h3 className="mb-3 font-display text-3xl uppercase">
            {guess.date.toLocaleDateString(undefined, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </h3>
          <p className="mb-1 text-sm text-ink/70">CaseIQ thinks this is the date of the incident.</p>
          <p className="mb-6 font-mono text-xs text-graphite">
            {guess.reasoning} · confidence: {guess.confidence}
          </p>
        </>
      ) : (
        <>
          <h3 className="mb-3 font-display text-3xl uppercase">Not in the file</h3>
          <p className="mb-6 text-sm text-ink/70">
            The records don&apos;t clearly show an acute event. Enter the incident date to anchor the timeline.
          </p>
        </>
      )}

      <div className="flex items-center gap-3">
        <input
          type="date"
          value={manual}
          onChange={(event) => setManual(event.target.value)}
          className="border border-ink/30 bg-transparent px-3 py-2 font-mono text-sm"
        />
        <button
          type="button"
          disabled={!manual}
          onClick={() => {
            const [year, month, day] = manual.split("-").map(Number);
            onConfirm(new Date(year, month - 1, day));
          }}
          className="bg-ink px-6 py-2.5 font-mono text-xs uppercase tracking-widest text-film disabled:opacity-30"
        >
          {guess ? "Confirm" : "Set date"}
        </button>
      </div>
    </motion.div>
  );
}