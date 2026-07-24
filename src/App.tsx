import { useMemo, useRef, useState } from "react";
import { Presentation } from "lucide-react";
import FileDrop from "./components/FileDrop";
import IncidentPrompt from "./components/panels/IncidentPrompt";
import { AskPanel, MomentsPanel, StoryPanel, StressPanel } from "./components/panels/AIPanels";
import FilterBar from "./components/panels/FilterBar";
import ExhibitView from "./components/ExhibitView";
import DayDetail from "./components/timeline/DayDetail";
import Trace from "./components/timeline/Trace";
import { useCaseData } from "./hooks/useCaseData";
import { useAI } from "./hooks/useAI";
import { useFilters } from "./hooks/useFilters";

export default function App() {
  const caseData = useCaseData();
  const ai = useAI(caseData.events, caseData.incidentDate, caseData.gaps);
  const f = useFilters(caseData.events);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [exhibit, setExhibit] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);
  const visibleClusters = useMemo(() => {
    const keys = new Set(f.filtered.map((event) => event.date!.toISOString().slice(0, 10)));
    return caseData.clusters.filter((cluster) => keys.has(cluster.key));
  }, [caseData.clusters, f.filtered]);
  const selectedCluster = visibleClusters.find((cluster) => cluster.key === selectedKey) ?? null;

  const goToRow = (rowIndex: number) => {
    const event = caseData.events.find((entry) => entry.rowIndex === rowIndex);
    if (!event?.date) return;
    setSelectedKey(event.date.toISOString().slice(0, 10));
    requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  return (
    <div className="min-h-screen bg-film text-ink">
      <header className="border-b border-ink/10 px-8 py-5 flex items-baseline gap-4">
        <h1 className="font-display text-3xl uppercase tracking-tight">
          CaseIQ
        </h1>
        <span className="font-mono text-xs text-graphite uppercase tracking-widest">
          Medical timeline &amp; case review
        </span>
        {caseData.parsed && (
          <button
            type="button"
            onClick={() => setExhibit(true)}
            className="inline-flex items-center gap-2 border border-ink px-3 py-1 font-mono text-xs uppercase tracking-widest"
          >
            <Presentation size={12} /> Exhibit
          </button>
        )}
        {caseData.parsed && (
          <button
            type="button"
            onClick={caseData.reset}
            className="border border-ink/30 px-3 py-1 font-mono text-xs uppercase tracking-widest"
          >
            New case
          </button>
        )}
      </header>

      <main className="mx-auto max-w-[1400px] px-8 py-12">
        {!caseData.parsed ? (
          <FileDrop onParsed={caseData.load} />
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
                Select any point on the trace to read that day&apos;s records.
              </p>
            )}

            <div ref={detailRef}>
              <DayDetail cluster={selectedCluster} />
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-8 pt-4">
              <div className="space-y-8">
                <StoryPanel ai={ai} events={caseData.events} onCite={goToRow} />
                <MomentsPanel ai={ai} onCite={goToRow} />
              </div>
              <div className="space-y-8">
                <StressPanel ai={ai} onCite={goToRow} />
                <AskPanel ai={ai} events={caseData.events} onCite={goToRow} />
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
      {exhibit && (
        <ExhibitView
          moments={
            ai.moments
              ? ai.moments
                  .map((moment) => caseData.events.find((event) => event.rowIndex === moment.row))
                  .filter((event): event is NonNullable<typeof event> => !!event)
              : caseData.keyMoments
          }
          gaps={caseData.gaps}
          phases={caseData.phases}
          incidentDate={caseData.incidentDate}
          caseName={caseData.parsed!.fileName.replace(/[_-]/g, " ").replace(/\.xlsx?$/i, "")}
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