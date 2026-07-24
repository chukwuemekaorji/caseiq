"use client";

import { useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, Presentation, LayoutList } from "lucide-react";
import AddRecordsModal from "@/components/AddRecordsModal";
import IncidentPrompt from "@/components/panels/IncidentPrompt";
import { AskPanel, MomentsPanel, StoryPanel, StressPanel } from "@/components/panels/AIPanels";
import FilterBar from "@/components/panels/FilterBar";
import ExhibitView from "@/components/ExhibitView";
import DayDetail from "@/components/timeline/DayDetail";
import Trace from "@/components/timeline/Trace";
import { useCaseData } from "@/hooks/useCaseData";
import { useAI } from "@/hooks/useAI";
import { useFilters } from "@/hooks/useFilters";
import { useIdentityContext } from "@/components/IdentityProvider";
import { computeNextStep } from "@/lib/nextStep";

export default function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const identity = useIdentityContext();
  const caseData = useCaseData(caseId);
  const ai = useAI(caseData.events, caseData.incidentDate, caseData.gaps);
  const f = useFilters(caseData.events);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [exhibit, setExhibit] = useState(false);
  const [addingRecords, setAddingRecords] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);
  const visibleClusters = useMemo(() => {
    const keys = new Set(f.filtered.map((event) => event.date!.toISOString().slice(0, 10)));
    return caseData.clusters.filter((cluster) => keys.has(cluster.key));
  }, [caseData.clusters, f.filtered]);
  const selectedCluster = visibleClusters.find((cluster) => cluster.key === selectedKey) ?? null;

  const goToRecord = (recordNumber: number) => {
    const event = caseData.events.find((entry) => entry.recordNumber === recordNumber);
    if (!event?.date) return;
    setSelectedKey(event.date.toISOString().slice(0, 10));
    requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  const nextStep = computeNextStep({
    incidentConfirmed: caseData.incidentConfirmed,
    skippedCount: caseData.importSummary?.skippedCount ?? 0,
    hasStory: !!ai.story,
    hasMoments: !!ai.moments,
    gapsCount: caseData.gaps.length,
  });

  return (
    <div className="min-h-screen bg-film text-ink">
      <header className="border-b border-ink/10 px-8 py-5 flex items-center gap-4">
        <Link href="/" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-graphite hover:text-ink">
          <LayoutList size={12} /> My cases
        </Link>
        {caseData.caseRecord && (
          <span className="font-mono text-xs text-graphite uppercase tracking-widest">
            {caseData.caseRecord.clientName ?? caseData.caseRecord.caseName ?? "Untitled case"}
            {caseData.caseRecord.matterNumber ? ` · ${caseData.caseRecord.matterNumber}` : ""}
          </span>
        )}
        {caseData.saveError && (
          <span
            className="font-mono text-xs uppercase tracking-widest text-amber"
            title="Working offline — changes aren't being saved right now, but nothing here is lost for this session."
          >
            Not saved · offline
          </span>
        )}
        <span className="ml-auto font-mono text-xs text-graphite uppercase tracking-widest">
          Hey, {identity.name} ·{" "}
          <button type="button" onClick={identity.clear} className="underline hover:text-ink">
            not you?
          </button>
        </span>
        {!caseData.caseLoading && !caseData.notFound && (
          <button
            type="button"
            onClick={() => setAddingRecords(true)}
            className="inline-flex items-center gap-2 border border-ink/30 px-3 py-1 font-mono text-xs uppercase tracking-widest"
          >
            <Plus size={12} /> Add records
          </button>
        )}
        {!caseData.caseLoading && !caseData.notFound && (
          <button
            type="button"
            onClick={() => setExhibit(true)}
            className="inline-flex items-center gap-2 border border-ink px-3 py-1 font-mono text-xs uppercase tracking-widest"
          >
            <Presentation size={12} /> Exhibit
          </button>
        )}
      </header>

      <main className="mx-auto max-w-[1400px] px-8 py-12">
        {caseData.caseLoading ? (
          <p className="py-24 text-center font-mono text-xs uppercase tracking-widest text-graphite">
            Loading case…
          </p>
        ) : caseData.notFound ? (
          <div className="py-24 text-center">
            <p className="mb-4 font-display text-2xl uppercase">Case not found</p>
            <Link href="/" className="font-mono text-xs uppercase tracking-widest text-teal underline">
              Back to your cases
            </Link>
          </div>
        ) : !caseData.incidentConfirmed ? (
          <IncidentPrompt
            guess={caseData.guess}
            onConfirm={(date) => {
              caseData.setIncidentDate(date);
              caseData.setIncidentConfirmed(true);
            }}
          />
        ) : (
          <div className="space-y-10">
            <div className="border border-ink/15 bg-white/50 px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-graphite">Next step</p>
              <p className="font-display text-lg uppercase tracking-tight">{nextStep.label}</p>
              {nextStep.detail && <p className="font-mono text-xs text-graphite">{nextStep.detail}</p>}
            </div>

            {caseData.importSummary && (
              <div
                className={`border px-4 py-3 font-mono text-xs uppercase tracking-widest ${
                  caseData.importSummary.skippedCount > 0
                    ? "border-amber/40 bg-amber/5 text-amber"
                    : "border-ink/10 text-graphite"
                }`}
              >
                {caseData.importSummary.importedCount} of {caseData.importSummary.workbookRowCount} workbook rows
                imported
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

            <Trace
              clusters={visibleClusters}
              curve={caseData.curve}
              gaps={caseData.gaps}
              incidentDate={caseData.incidentDate}
              selectedKey={selectedKey}
              onSelect={setSelectedKey}
            />

            {!selectedCluster && (
              <p className="text-center font-mono text-xs text-graphite">
                Hover a point for a quick look, click to pin the full record below.
              </p>
            )}

            <div ref={detailRef}>
              <DayDetail cluster={selectedCluster} />
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-8 pt-4">
              <div className="space-y-8">
                <StoryPanel ai={ai} events={caseData.events} onCite={goToRecord} />
                <MomentsPanel ai={ai} onCite={goToRecord} />
              </div>
              <div className="space-y-8">
                <StressPanel ai={ai} onCite={goToRecord} />
                <AskPanel ai={ai} events={caseData.events} onCite={goToRecord} />
              </div>
            </div>
          </div>
        )}
      </main>

      {ai.error && (
        <div className="fixed bottom-6 right-6 max-w-sm border border-amber bg-film px-4 py-3 font-mono text-xs text-amber">
          {ai.error}
        </div>
      )}
      {addingRecords && <AddRecordsModal onAdd={caseData.addRecords} onClose={() => setAddingRecords(false)} />}
      {exhibit && caseData.caseRecord && (
        <ExhibitView
          moments={
            ai.moments
              ? ai.moments
                  .map((moment) => caseData.events.find((event) => event.recordNumber === moment.record))
                  .filter((event): event is NonNullable<typeof event> => !!event)
              : caseData.keyMoments
          }
          gaps={caseData.gaps}
          phases={caseData.phases}
          incidentDate={caseData.incidentDate}
          caseName={caseData.caseRecord.clientName ?? caseData.caseRecord.caseName ?? "Case"}
          totalEvents={caseData.events.length}
          onClose={() => setExhibit(false)}
        />
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
