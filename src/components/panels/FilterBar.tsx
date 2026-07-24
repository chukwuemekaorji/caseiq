import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ChevronDown } from "lucide-react";
import type { Severity } from "../../types";
import { SEVERITY_COLOR, SEVERITY_LABEL } from "../../lib/palette";
import type { useFilters } from "../../hooks/useFilters";

const SEVERITIES: Severity[] = ["critical", "major", "moderate", "routine", "admin"];

export default function FilterBar({
  f,
  total,
  hasIncident,
}: {
  f: ReturnType<typeof useFilters>;
  total: number;
  hasIncident: boolean;
}) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="border-y border-ink/15 py-3 print:hidden">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={13} className="absolute left-0 top-1/2 -translate-y-1/2 text-graphite" />
          <input
            value={f.filters.query}
            onChange={(event) => f.setQuery(event.target.value)}
            placeholder="Search summaries, providers, anything…"
            className="w-full border-b border-ink/20 bg-transparent pb-1.5 pl-5 text-sm outline-none focus:border-ink"
          />
        </div>

        {hasIncident && (
          <div className="flex border border-ink/20">
            {(["all", "pre", "post"] as const).map((period) => (
              <button
                key={period}
                onClick={() => f.setPeriod(period)}
                className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                  f.filters.period === period ? "bg-ink text-film" : "text-graphite hover:text-ink"
                }`}
              >
                {period === "all" ? "All" : period === "pre" ? "Before" : "After"}
              </button>
            ))}
          </div>
        )}

        {f.facets.map((facet) => {
          const selected = f.filters[facet.key].size;
          return (
            <div key={facet.key} className="relative">
              <button
                onClick={() => setOpen(open === facet.key ? null : facet.key)}
                className={`inline-flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest ${
                  selected ? "border-teal text-teal" : "border-ink/20 text-graphite hover:text-ink"
                }`}
              >
                {facet.label}
                {selected > 0 && <span className="text-[9px]">({selected})</span>}
                <ChevronDown size={11} />
              </button>

              <AnimatePresence>
                {open === facet.key && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-40 mt-1 max-h-72 min-w-[220px] overflow-y-auto border border-ink/25 bg-film shadow-lg"
                  >
                    {facet.options.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => f.toggle(facet.key, option.value)}
                        className={`flex w-full items-baseline gap-2 px-3 py-1.5 text-left text-xs hover:bg-ink/5 ${
                          f.filters[facet.key].has(option.value) ? "text-teal" : ""
                        }`}
                      >
                        <span className="flex-1 truncate">{option.value}</span>
                        <span className="font-mono text-[10px] text-graphite">{option.count}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        <div className="flex gap-1">
          {SEVERITIES.map((severity) => (
            <button
              key={severity}
              onClick={() => f.toggleSeverity(severity)}
              title={SEVERITY_LABEL[severity]}
              className={`h-5 w-5 rounded-full border-2 transition-all ${
                f.filters.severities.has(severity) ? "border-ink scale-110" : "border-transparent opacity-45"
              }`}
              style={{ background: SEVERITY_COLOR[severity] }}
            />
          ))}
        </div>

        <span className="ml-auto font-mono text-[10px] text-graphite">
          {f.filtered.length} of {total}
        </span>

        {f.activeCount > 0 && (
          <button
            onClick={f.clear}
            className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-amber"
          >
            <X size={11} /> Clear
          </button>
        )}
      </div>

      {open && <div className="fixed inset-0 z-30" onClick={() => setOpen(null)} />}
    </div>
  );
}