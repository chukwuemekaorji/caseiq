"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, FileSpreadsheet, MessageSquareText, Scale } from "lucide-react";
import PresentingBuddy from "./illustrations/PresentingBuddy";
import WavingBuddy from "./illustrations/WavingBuddy";

interface Props {
  onEnter: (name: string) => void;
}

const FEATURES = [
  {
    icon: FileSpreadsheet,
    title: "Drop in the records",
    body: "An .xlsx chronology becomes a clean treatment timeline in seconds — parsed entirely in your browser.",
  },
  {
    icon: MessageSquareText,
    title: "Ask it anything",
    body: "Grounded summaries and Q&A — every claim cited back to a record number in the source file.",
  },
  {
    icon: Scale,
    title: "See both sides of a claim",
    body: "Evidence composition lays out the defence's strongest argument next to the grounded attorney response.",
  },
];

export default function Landing({ onEnter }: Props) {
  const [step, setStep] = useState<"pitch" | "name">("pitch");
  const [name, setName] = useState("");

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-film">
      <BackgroundTrace />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-8 py-24">
        <AnimatePresence mode="wait">
          {step === "pitch" ? (
            <motion.div
              key="pitch"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-6 flex items-center gap-5">
                <PresentingBuddy className="h-24 w-28 shrink-0 sm:h-28 sm:w-32" />
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-film/50">
                  Medical chronology &amp; case review
                </p>
              </div>
              <h1 className="mb-6 font-display text-7xl uppercase leading-[0.95] tracking-tight sm:text-8xl">
                Case<span className="bg-gradient-to-r from-coral via-violet to-mint bg-clip-text text-transparent">IQ</span>
              </h1>
              <p className="mb-12 max-w-lg text-lg text-film/70">
                Turn a stack of medical records into a timeline an attorney can actually read —
                gaps, key moments, and a grounded AI second opinion, all in one pass.
              </p>

              <div className="mb-16 grid gap-8 sm:grid-cols-3">
                {FEATURES.map((feature, index) => (
                  <div key={feature.title}>
                    <feature.icon
                      className="mb-3"
                      style={{ color: [`#FF6B6B`, `#8B5CF6`, `#2DD4A7`][index % 3] }}
                      size={20}
                      strokeWidth={1.5}
                    />
                    <h3 className="mb-1 font-display text-lg uppercase tracking-tight">{feature.title}</h3>
                    <p className="text-sm text-film/60">{feature.body}</p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setStep("name")}
                className="group inline-flex items-center gap-2 bg-film px-7 py-3 font-mono text-xs uppercase tracking-widest text-ink transition-colors hover:bg-coral hover:text-film"
              >
                Sign in
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </button>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-film/40">
                No account needed — just tell us what to call you.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="name"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-md"
            >
              <WavingBuddy className="mb-4 h-20 w-20" />
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-film/50">
                One quick thing
              </p>
              <h2 className="mb-6 font-display text-4xl uppercase tracking-tight">What should we call you?</h2>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (name.trim()) onEnter(name);
                }}
                className="flex items-center gap-3"
              >
                <input
                  autoFocus
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  className="w-full border border-film/30 bg-transparent px-4 py-3 text-lg placeholder:text-film/30 focus:border-film/60 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="shrink-0 bg-film px-6 py-3 font-mono text-xs uppercase tracking-widest text-ink transition-colors hover:bg-coral hover:text-film disabled:opacity-30"
                >
                  Continue
                </button>
              </form>
              <button
                type="button"
                onClick={() => setStep("pitch")}
                className="mt-4 font-mono text-[10px] uppercase tracking-widest text-film/40 hover:text-film/70"
              >
                ← Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function BackgroundTrace() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.18]"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
    >
      <motion.path
        d="M -50 620 C 150 620, 220 420, 380 420 S 560 220, 700 220 S 860 520, 1000 520 S 1180 300, 1260 300"
        fill="none"
        stroke="#1B4F63"
        strokeWidth={2}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d="M -50 460 C 200 460, 260 620, 420 620 S 600 340, 760 340 S 900 600, 1040 600 S 1180 460, 1260 460"
        fill="none"
        stroke="#C4703A"
        strokeWidth={1.25}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d="M -50 340 C 180 340, 240 180, 400 180 S 620 380, 780 380 S 940 160, 1100 160 S 1220 300, 1260 300"
        fill="none"
        stroke="#8B5CF6"
        strokeWidth={1.25}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 3.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}
