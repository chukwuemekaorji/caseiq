"use client";

import { motion } from "framer-motion";
import { X, Printer } from "lucide-react";
import type { MedicalEvent } from "../types";
import type { TreatmentGap, TreatmentPhase } from "../lib/analyze";
import { SEVERITY_COLOR } from "../lib/palette";

interface Props {
  moments: MedicalEvent[];
  gaps: TreatmentGap[];
  phases: TreatmentPhase[];
  incidentDate: Date | null;
  caseName: string;
  totalEvents: number;
  onClose: () => void;
}

export default function ExhibitView({
  moments,
  gaps,
  phases,
  incidentDate,
  caseName,
  totalEvents,
  onClose,
}: Props) {
  const span =
    moments.length > 1
      ? Math.round((moments[moments.length - 1].date!.getTime() - moments[0].date!.getTime()) / 86_400_000)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-film print:static print:overflow-visible"
    >
      <div className="mx-auto max-w-5xl px-12 py-16 print:py-6">
        <div className="mb-16 flex items-start justify-between print:mb-8">
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-graphite">
              Treatment chronology
            </p>
            <h1 className="font-display text-6xl uppercase leading-none print:text-4xl">
              {caseName}
            </h1>
            {incidentDate && (
              <p className="mt-3 font-mono text-sm text-graphite">
                Incident {incidentDate.toLocaleDateString()} · {totalEvents} medical
                records · {span} days of treatment
              </p>
            )}
          </div>
          <div className="flex gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 border border-ink px-3 py-2 font-mono text-[10px] uppercase tracking-widest"
            >
              <Printer size={12} /> Print / PDF
            </button>
            <button onClick={onClose} className="border border-ink/30 px-3 py-2">
              <X size={14} />
            </button>
          </div>
        </div>

        {phases.length > 1 && (
          <div className="mb-16 flex gap-px print:mb-8">
            {phases.map((phase, index) => (
              <motion.div
                key={index}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ originX: 0, flex: phase.eventCount }}
                className="border-t-2 border-teal bg-teal/15 px-3 py-3"
              >
                <p className="font-display text-lg uppercase leading-tight">{phase.label}</p>
                <p className="font-mono text-[10px] text-graphite">
                  {phase.start.toLocaleDateString()} — {phase.end.toLocaleDateString()}
                </p>
                <p className="font-mono text-[10px] text-graphite">{phase.eventCount} records</p>
              </motion.div>
            ))}
          </div>
        )}

        <div className="space-y-10 print:space-y-6">
          {moments.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.12, duration: 0.5 }}
              className="grid grid-cols-[130px_28px_1fr] items-start gap-6 break-inside-avoid"
            >
              <div className="text-right">
                <p className="font-display text-2xl uppercase leading-none">
                  {event.date!.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                </p>
                <p className="font-mono text-[10px] text-graphite">{event.date!.getFullYear()}</p>
                {event.daysFromIncident !== null && (
                  <p className="mt-1 font-mono text-[10px] text-teal">day {event.daysFromIncident}</p>
                )}
              </div>

              <div className="flex min-h-[60px] flex-col items-center pt-2">
                <span
                  className="shrink-0 rounded-full"
                  style={{ width: 14, height: 14, background: SEVERITY_COLOR[event.severity] }}
                />
                {index < moments.length - 1 && <span className="mt-2 min-h-[60px] w-px flex-1 bg-ink/20" />}
              </div>

              <div className="pb-2">
                <p className="mb-1 font-display text-2xl uppercase leading-tight">
                  {event.recordType ?? "Medical record"}
                </p>
                <p className="mb-3 font-mono text-[10px] text-graphite">
                  {[event.medicineType, event.facility, event.providers[0]].filter(Boolean).join(" · ")}
                </p>
                <p className="text-[15px] leading-relaxed text-ink/80">
                  {event.summary.slice(0, 340)}
                  {event.summary.length > 340 ? "…" : ""}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {gaps.length > 0 && (
          <div className="mt-16 break-inside-avoid border-t border-amber/40 pt-6 print:mt-8">
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-amber">
              Breaks in treatment
            </p>
            <div className="flex flex-wrap gap-8">
              {gaps.map((gap) => (
                <div key={gap.id}>
                  <p className="font-display text-3xl leading-none text-amber">{gap.days}</p>
                  <p className="font-mono text-[10px] text-graphite">
                    days · {gap.start.toLocaleDateString()} → {gap.end.toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-16 font-mono text-[9px] uppercase tracking-[0.2em] text-graphite print:mt-8">
          CaseIQ · generated from medical chronology · not medical or legal advice
        </p>
      </div>
    </motion.div>
  );
}