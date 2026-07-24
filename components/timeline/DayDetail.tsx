"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { DayCluster } from "../../lib/analyze";
import { SEVERITY_COLOR, SEVERITY_LABEL } from "../../lib/palette";

export default function DayDetail({ cluster }: { cluster: DayCluster | null }) {
  return (
    <AnimatePresence mode="wait">
      {cluster && (
        <motion.div
          key={cluster.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="mt-4 border-t border-ink/15 pt-6"
        >
          <div className="mb-5 flex items-baseline gap-4">
            <h3 className="font-display text-3xl uppercase">
              {cluster.date.toLocaleDateString(undefined, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </h3>
            <span className="font-mono text-xs text-graphite">
              {cluster.events.length} record{cluster.events.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="max-h-[38vh] space-y-5 overflow-y-auto pr-3">
            {cluster.events.map((event) => (
              <div key={event.id} className="flex gap-4">
                <span
                  className="mt-1.5 shrink-0 rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    background: SEVERITY_COLOR[event.severity],
                  }}
                />
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-graphite">
                      {event.recordType ?? "Record"}
                    </span>
                    <span className="font-mono text-[10px] text-graphite">
                      {SEVERITY_LABEL[event.severity]}
                    </span>
                    {event.daysFromIncident !== null && (
                      <span className="font-mono text-[10px] text-graphite">
                        day {event.daysFromIncident}
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-graphite/60">
                      record {event.recordNumber}
                    </span>
                    <span className="font-mono text-[10px] text-graphite/40">
                      {event.sourceFileName} · row {event.rowIndex}
                    </span>
                  </div>
                  {(event.providers.length > 0 || event.facility) && (
                    <p className="mb-1 text-xs text-ink/60">
                      {[event.providers.join(", "), event.facility].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed text-ink/85">{event.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}