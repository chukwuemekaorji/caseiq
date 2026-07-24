"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

interface OverviewData {
  case: {
    clientName: string | null;
    caseName: string | null;
    matterNumber: string | null;
    incidentDate: string | null;
    createdAt: string;
  };
  eventCount: number;
  contextCount: number;
  evidenceCount: number;
  compositionCount: number;
  approvedCompositionCount: number;
  narrativeCount: number;
  approvedNarrativeCount: number;
  presentationCount: number;
  latestPresentationStatus: string | null;
}

export default function OverviewPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithTimeout(`/api/cases/${caseId}/overview`);
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setData(json);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  if (loading) {
    return <p className="py-24 text-center font-mono text-xs uppercase tracking-widest text-graphite">Loading…</p>;
  }

  if (!data) {
    return (
      <p className="py-24 text-center font-mono text-xs uppercase tracking-widest text-graphite">
        Couldn&apos;t load this case.
      </p>
    );
  }

  const sections = [
    {
      href: "timeline",
      label: "Medical timeline",
      status: `${data.eventCount} record${data.eventCount === 1 ? "" : "s"}`,
      tone: data.eventCount > 0 ? "green" : "grey",
    },
    {
      href: "context",
      label: "Client context",
      status: data.contextCount > 0 ? `${data.contextCount} note${data.contextCount === 1 ? "" : "s"}` : "Not started",
      tone: data.contextCount > 0 ? "green" : "amber",
    },
    {
      href: "evidence",
      label: "Evidence",
      status: data.evidenceCount > 0 ? `${data.evidenceCount} item${data.evidenceCount === 1 ? "" : "s"}` : "Not started",
      tone: data.evidenceCount > 0 ? "green" : "amber",
    },
    {
      href: "evidence-composition",
      label: "Evidence composition",
      status:
        data.compositionCount > 0
          ? `${data.approvedCompositionCount}/${data.compositionCount} approved`
          : "Not started",
      tone: data.compositionCount > 0 ? (data.approvedCompositionCount === data.compositionCount ? "green" : "amber") : "grey",
    },
    {
      href: "story",
      label: "Story",
      status: data.narrativeCount > 0 ? `${data.approvedNarrativeCount}/${data.narrativeCount} approved` : "Not started",
      tone: data.narrativeCount > 0 ? (data.approvedNarrativeCount === data.narrativeCount ? "green" : "amber") : "grey",
    },
    {
      href: "presentation",
      label: "Presentation",
      status: data.latestPresentationStatus ?? "Not started",
      tone: data.latestPresentationStatus === "approved" ? "green" : data.latestPresentationStatus ? "amber" : "grey",
    },
  ] as const;

  const toneClass = {
    green: "border-teal/40 bg-teal/5 text-teal",
    amber: "border-amber/40 bg-amber/5 text-amber",
    grey: "border-ink/10 text-graphite",
  };

  return (
    <div className="space-y-10">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-graphite">Case overview</p>
        <h2 className="font-display text-3xl uppercase tracking-tight">
          {data.case.clientName ?? data.case.caseName ?? "Untitled case"}
        </h2>
        <p className="mt-1 font-mono text-xs text-graphite">
          {data.case.matterNumber ? `${data.case.matterNumber} · ` : ""}
          Created {new Date(data.case.createdAt).toLocaleDateString()}
          {data.case.incidentDate ? ` · Incident ${new Date(data.case.incidentDate).toLocaleDateString()}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="block border border-ink/15 bg-white/50 p-4 transition-colors hover:border-ink/40"
          >
            <p className="mb-2 font-display text-lg uppercase tracking-tight">{section.label}</p>
            <span className={`inline-block border px-2 py-1 font-mono text-[10px] uppercase tracking-widest ${toneClass[section.tone]}`}>
              {section.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
