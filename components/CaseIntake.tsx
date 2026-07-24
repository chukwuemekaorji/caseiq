"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { CaseDraft } from "../types";

interface Props {
  onContinue: (draft: CaseDraft) => void;
}

export default function CaseIntake({ onContinue }: Props) {
  const [clientName, setClientName] = useState("");
  const [matterNumber, setMatterNumber] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-lg border border-ink/15 bg-white/60 p-8"
    >
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-graphite">Step one · new case</p>
      <h2 className="mb-6 font-display text-3xl uppercase tracking-tight">Who is this case for?</h2>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!clientName.trim()) return;
          onContinue({
            clientName: clientName.trim(),
            matterNumber: matterNumber.trim() || undefined,
          });
        }}
        className="space-y-5"
      >
        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-graphite">
            Client name
          </label>
          <input
            autoFocus
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            placeholder="e.g. Caldwell"
            className="w-full border border-ink/30 bg-transparent px-3 py-2.5 text-sm focus:border-ink/60 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-graphite">
            Matter number <span className="normal-case text-graphite/60">(optional)</span>
          </label>
          <input
            value={matterNumber}
            onChange={(event) => setMatterNumber(event.target.value)}
            placeholder="e.g. PI-2026-0017"
            className="w-full border border-ink/30 bg-transparent px-3 py-2.5 text-sm focus:border-ink/60 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={!clientName.trim()}
          className="bg-ink px-6 py-2.5 font-mono text-xs uppercase tracking-widest text-film disabled:opacity-30"
        >
          Continue
        </button>
      </form>
    </motion.div>
  );
}
