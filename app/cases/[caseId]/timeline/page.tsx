"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import AddRecordsModal from "@/components/AddRecordsModal";
import IncidentPrompt from "@/components/panels/IncidentPrompt";
import FilterBar from "@/components/panels/FilterBar";
import DayDetail from "@/components/timeline/DayDetail";
import Trace from "@/components/timeline/Trace";
import { useCaseData } from "@/hooks/useCaseData";
import { useFilters } from "@/hooks/useFilters";

export default function TimelinePage() {
  return (
    <Suspense fallback={<p className="py-24 text-center font-mono text-xs uppercase tracking-widest text-graphite">Loading…</p>}>
      <TimelinePageInner />
    </Suspense>
  );
}

function TimelinePageInner() {
  const { caseId } = useParams<{ caseId: string }>();
  const searchParams = useSearchParams();
  const caseData = useCaseData(caseId);
  const f = useFilters(caseData.events);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [addingRecords, setAddingRecords] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);
  const visibleClusters = useMemo(() => {
    const keys = new Set(f.filtered.map((event) => event.date!.toISOString().slice(0, 10)));
    return caseData.clusters.filter((cluster) => keys.has(cluster.key));
  }, [caseData.clusters, f.filtered]);
  const selectedCluster = visibleClusters.find((cluster) => cluster.key === selectedKey) ?? null;

  useEffect(() => {
    const recordParam = searchParams.get("record");
    if (!recordParam || !caseData.events.length) return;
    const recordNumber = Number(recordParam);
    const target = caseData.events.find((event) => event.recordNumber === recordNumber);
    if (!target?.date) return;
    setSelectedKey(target.date.toISOString().slice(0, 10));
    detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, caseData.events.length]);

  if (caseData.caseLoading) {
    return (
      <p className="py-24 text-center font-mono text-xs uppercase tracking-widest text-graphite">Loading case…</p>
    );
  }

  if (caseData.notFound) {
    return <p className="py-24 text-center font-mono text-xs uppercase tracking-widest text-graphite">Case not found.</p>;
  }

  if (!caseData.incidentConfirmed) {
    return (
      <IncidentPrompt
        guess={caseData.guess}
        onConfirm={(date) => {
          caseData.setIncidentDate(date);
          caseData.setIncidentConfirmed(true);
        }}
      />
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl uppercase tracking-tight">Medical timeline</h2>
        <button
          type="button"
          onClick={() => setAddingRecords(true)}
          className="inline-flex items-center gap-2 border border-ink/30 px-3 py-1 font-mono text-xs uppercase tracking-widest"
        >
          <Plus size={12} /> Add records
        </button>
      </div>

      {caseData.importSummary && (
        <div
          className={`border px-4 py-3 font-mono text-xs uppercase tracking-widest ${
            caseData.importSummary.skippedCount > 0
              ? "border-amber/40 bg-amber/5 text-amber"
              : "border-ink/10 text-graphite"
          }`}
        >
          {caseData.importSummary.importedCount} of {caseData.importSummary.workbookRowCount} workbook rows imported
          {caseData.importSummary.skippedCount > 0 && (
            <>
              {" "}
              — {caseData.importSummary.skippedCount} skipped
              {typeof caseData.importSummary.skippedBlank === "number" &&
              typeof caseData.importSummary.skippedUnparsedDate === "number"
                ? ` (${caseData.importSummary.skippedBlank} blank, ${caseData.importSummary.skippedUnparsedDate} unreadable date)`
                : ""}
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-4 gap-6">
        <Stat label="Events" value={caseData.events.length} />
        <Stat label="Treatment days" value={caseData.clusters.length} />
        <Stat label="Gaps over 60d" value={caseData.gaps.length} />
        <Stat label="Phases" value={caseData.phases.length} />
      </div>

      <FilterBar f={f} total={caseData.events.length} hasIncident={!!caseData.incidentDate} />

      <div className="border-t border-ink/10 pt-4">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-graphite">Legend</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-widest text-graphite">
          <LegendDot color="#0B1520" label="Critical" />
          <LegendDot color="#1B4F63" label="Major" />
          <LegendDot color="#8A939B" label="Moderate / routine" />
          <LegendDot color="#C4703A" label="Treatment gap" />
          <span className="text-graphite/70">Hover a point for a summary · click to pin the full record</span>
        </div>
      </div>

      <Trace
        clusters={visibleClusters}
        curve={caseData.curve}
        gaps={caseData.gaps}
        incidentDate={caseData.incidentDate}
        selectedKey={selectedKey}
        onSelect={setSelectedKey}
      />

      <div ref={detailRef}>
        <DayDetail cluster={selectedCluster} />
      </div>

      {addingRecords && (
        <AddRecordsModal onAdd={caseData.addRecords} onClose={() => setAddingRecords(false)} />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-t border-ink pt-2">
      <p className="font-display text-4xl">{value}</p>
      <p className="uppercase tracking-widest text-graphite">{label}</p>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
