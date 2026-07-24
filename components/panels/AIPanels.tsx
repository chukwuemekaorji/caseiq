"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ShieldAlert, MessageCircleQuestion, Loader2 } from "lucide-react";
import type { MedicalEvent } from "../../types";
import Cited from "../Cited";
import type { useAI } from "../../hooks/useAI";

type AI = ReturnType<typeof useAI>;

const SEVERITY_BORDER: Record<string, string> = {
  high: "border-amber",
  medium: "border-teal",
  low: "border-graphite",
};

export function StoryPanel({ ai, events, onCite }: { ai: AI; events: MedicalEvent[]; onCite: (r: number) => void }) {
  return (
    <Section
      icon={<Sparkles size={14} />}
      label="The story"
      action={
        <RunButton busy={ai.busy === "story"} onClick={ai.runStory}>
          {ai.story ? "Regenerate" : "Generate narrative"}
        </RunButton>
      }
    >
      {ai.story ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {ai.story.split(/\n{2,}/).map((paragraph, index) => (
            <p key={index} className="text-[15px] leading-relaxed text-ink/85">
              <Cited text={paragraph} events={events} onCite={onCite} />
            </p>
          ))}
        </motion.div>
      ) : (
        <Empty>A thirty-second read of the whole treatment history.</Empty>
      )}
    </Section>
  );
}

export function MomentsPanel({ ai, onCite }: { ai: AI; onCite: (r: number) => void }) {
  return (
    <Section
      icon={<Sparkles size={14} />}
      label="Five biggest moments"
      action={
        <RunButton busy={ai.busy === "moments"} onClick={ai.runMoments}>
          {ai.moments ? "Regenerate" : "Identify"}
        </RunButton>
      }
    >
      {ai.moments ? (
        <ol className="space-y-4">
          {ai.moments.map((moment, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06 }}
              className="flex gap-4"
            >
              <span className="w-6 leading-none font-display text-2xl text-graphite">
                {index + 1}
              </span>
              <div>
                <button
                  onClick={() => onCite(moment.record)}
                  className="text-left font-display text-lg uppercase hover:text-teal"
                >
                  {moment.title}
                </button>
                <p className="text-sm leading-snug text-ink/70">{moment.why}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      ) : (
        <Empty>The events that carry the case.</Empty>
      )}
    </Section>
  );
}

export function StressPanel({ ai, onCite }: { ai: AI; onCite: (r: number) => void }) {
  return (
    <Section
      icon={<ShieldAlert size={14} />}
      label="Stress test"
      action={
        <RunButton busy={ai.busy === "stress"} onClick={ai.runChallenges}>
          {ai.challenges ? "Run again" : "Challenge this case"}
        </RunButton>
      }
    >
      {ai.challenges ? (
        <div className="space-y-5">
          {ai.challenges.map((challenge, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`border-l-2 pl-4 ${SEVERITY_BORDER[challenge.severity] ?? "border-graphite"}`}
            >
              <div className="mb-1.5 flex items-baseline gap-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-graphite">
                  {challenge.category}
                </span>
                <span className="font-mono text-[10px] uppercase text-graphite/60">
                  {challenge.severity}
                </span>
              </div>
              <h4 className="mb-2 font-display text-xl uppercase">{challenge.headline}</h4>
              <p className="mb-2 text-sm leading-relaxed text-ink/80">
                <span className="mr-2 font-mono text-[10px] uppercase text-amber">Defence</span>
                {challenge.argument}
              </p>
              <p className="mb-2 text-sm leading-relaxed text-ink/70">
                <span className="mr-2 font-mono text-[10px] uppercase text-teal">Response</span>
                {challenge.response}
              </p>
              <div className="flex flex-wrap gap-1">
                {challenge.records.map((record) => (
                  <button
                    key={record}
                    onClick={() => onCite(record)}
                    className="border border-teal/40 px-1.5 py-0.5 font-mono text-[10px] text-teal hover:bg-teal hover:text-film"
                  >
                    record {record}
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <Empty>The AI argues the other side, then tells you how to answer it.</Empty>
      )}
    </Section>
  );
}

export function AskPanel({ ai, events, onCite }: { ai: AI; events: MedicalEvent[]; onCite: (r: number) => void }) {
  const [question, setQuestion] = useState("");
  const suggestions = ["When was the first MRI?", "How many PT sessions?", "Which providers treated the neck?"];

  return (
    <Section icon={<MessageCircleQuestion size={14} />} label="Ask the record">
      <div className="mb-3 flex gap-2">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && question.trim()) {
              ai.ask(question.trim());
              setQuestion("");
            }
          }}
          placeholder="Ask anything about this case…"
          className="flex-1 border border-ink/25 bg-transparent px-3 py-2 text-sm"
        />
        <RunButton
          busy={ai.busy === "qa"}
          onClick={() => {
            if (question.trim()) {
              ai.ask(question.trim());
              setQuestion("");
            }
          }}
        >
          Ask
        </RunButton>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => ai.ask(suggestion)}
            className="border border-ink/20 px-2 py-1 font-mono text-[10px] text-graphite hover:border-ink hover:text-ink"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {ai.qa.map((entry, index) => (
          <motion.div
            key={`${entry.question}-${index}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 border-t border-ink/10 pt-3"
          >
            <p className="mb-1.5 font-mono text-[11px] text-graphite">{entry.question}</p>
            <p className="text-sm leading-relaxed text-ink/85">
              <Cited text={entry.answer} events={events} onCite={onCite} />
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </Section>
  );
}

function Section({
  icon,
  label,
  action,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-ink/15 pt-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-graphite">{icon}</span>
        <h3 className="flex-1 font-mono text-[10px] uppercase tracking-[0.2em] text-graphite">
          {label}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function RunButton({
  busy,
  onClick,
  children,
}: {
  busy: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="inline-flex items-center gap-2 border border-ink px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors hover:bg-ink hover:text-film disabled:opacity-40"
    >
      {busy && <Loader2 size={11} className="animate-spin" />}
      {busy ? "Working" : children}
    </button>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm italic text-graphite">{children}</p>;
}