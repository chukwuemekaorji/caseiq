"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import type { EvidenceComposition } from "@/types";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

const RISK_COLOR: Record<string, string> = {
  high: "border-amber text-amber",
  moderate: "border-graphite text-graphite",
  low: "border-teal/40 text-teal",
};

export default function EvidenceCompositionPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const [compositions, setCompositions] = useState<EvidenceComposition[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchWithTimeout(`/api/cases/${caseId}/evidence-composition`);
      if (res.ok) setCompositions((await res.json()).compositions ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetchWithTimeout(`/api/cases/${caseId}/evidence-composition/generate`, { method: "POST" });
      if (!res.ok) {
        setError("Could not generate compositions — try again.");
        return;
      }
      await load();
    } finally {
      setGenerating(false);
    }
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    await fetchWithTimeout(`/api/cases/${caseId}/evidence-composition/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl uppercase tracking-tight">Evidence composition</h2>
        <button
          type="button"
          onClick={generate}
          disabled={generating}
          className="inline-flex items-center gap-2 border border-ink px-3 py-1.5 font-mono text-xs uppercase tracking-widest hover:bg-ink hover:text-film disabled:opacity-40"
        >
          {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          {compositions.length ? "Regenerate from record" : "Generate from record"}
        </button>
      </div>
      <p className="max-w-2xl text-sm text-ink/70">
        For each claim, see the evidence that supports it, what&apos;s missing, and how the defence will attack it —
        with the strongest grounded response already drafted.
      </p>

      {error && <p className="font-mono text-xs text-amber">{error}</p>}

      {loading ? (
        <p className="font-mono text-xs uppercase tracking-widest text-graphite">Loading…</p>
      ) : compositions.length === 0 ? (
        <p className="text-sm italic text-graphite">No compositions yet — generate from the medical record above.</p>
      ) : (
        <div className="space-y-6">
          {compositions.map((c) => (
            <div key={c.id} className={`border-l-2 pl-4 ${RISK_COLOR[c.riskLevel] ?? "border-ink/20"}`}>
              <div className="mb-1.5 flex flex-wrap items-center gap-3">
                <h3 className="font-display text-xl uppercase tracking-tight">{c.claimTitle}</h3>
                <span className={`border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest ${RISK_COLOR[c.riskLevel]}`}>
                  {c.riskLevel} risk
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-graphite">
                  strength {c.strengthScore}/100
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-graphite">{c.reviewStatus}</span>
              </div>
              <p className="mb-3 text-sm text-ink/80">{c.claimDescription}</p>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-amber">Defence will argue</p>
                  <p className="text-xs text-ink/70">{c.aiReasoning}</p>
                </div>
                <div>
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-teal">Attorney response</p>
                  <p className="text-xs text-ink/70">{c.attorneyResponse}</p>
                </div>
                <div>
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-graphite">Missing evidence</p>
                  <ul className="list-disc pl-4 text-xs text-ink/70">
                    {c.missingEvidenceItems.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 font-mono text-[9px] uppercase tracking-widest">
                <button
                  onClick={() => patch(c.id, { reviewStatus: c.reviewStatus === "approved" ? "draft" : "approved" })}
                  className={`border px-2 py-1 ${c.reviewStatus === "approved" ? "border-teal/40 text-teal" : "border-ink/25"}`}
                >
                  {c.reviewStatus === "approved" ? "Approved" : "Approve"}
                </button>
                <button
                  onClick={() => patch(c.id, { includedInPresentation: !c.includedInPresentation })}
                  className={`border px-2 py-1 ${c.includedInPresentation ? "border-teal/40 text-teal" : "border-ink/25"}`}
                >
                  {c.includedInPresentation ? "In presentation" : "Include in presentation"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
