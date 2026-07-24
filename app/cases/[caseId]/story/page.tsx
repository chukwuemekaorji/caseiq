"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import type { GeneratedNarrative, NarrativeType } from "@/types";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

const NARRATIVE_TYPES: { type: NarrativeType; label: string }[] = [
  { type: "thirty-second-summary", label: "30-second summary" },
  { type: "medical-story", label: "Medical journey" },
  { type: "life-impact-story", label: "Life-impact story" },
  { type: "financial-story", label: "Financial-impact story" },
  { type: "before-after", label: "Before vs. after" },
  { type: "opening-overview", label: "Opening overview" },
  { type: "closing-summary", label: "Closing summary" },
];

const STATUS_COLOR: Record<string, string> = {
  draft: "border-graphite text-graphite",
  edited: "border-amber/40 text-amber",
  approved: "border-teal/40 text-teal",
};

export default function StoryPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const [narratives, setNarratives] = useState<GeneratedNarrative[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchWithTimeout(`/api/cases/${caseId}/story`);
      if (res.ok) {
        const data = await res.json();
        setNarratives(data.narratives ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const byType = (type: NarrativeType) => narratives.find((n) => n.type === type);

  const generate = async (type: NarrativeType) => {
    setGenerating(type);
    setError(null);
    try {
      const res = await fetchWithTimeout(
        `/api/cases/${caseId}/story/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        },
        45000
      );
      if (res.ok) {
        await load();
      } else {
        setError("Could not generate this narrative — try again.");
      }
    } catch {
      setError("Could not reach the server — try again.");
    } finally {
      setGenerating(null);
    }
  };

  const saveEdit = async (narrativeId: string, text: string) => {
    await fetchWithTimeout(`/api/cases/${caseId}/story/${narrativeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attorneyVersion: text }),
    });
    await load();
  };

  const approve = async (narrativeId: string) => {
    await fetchWithTimeout(`/api/cases/${caseId}/story/${narrativeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    await load();
  };

  return (
    <div className="space-y-8">
      <h2 className="font-display text-2xl uppercase tracking-tight">Story</h2>
      <p className="max-w-2xl text-sm text-ink/70">
        Every narrative starts as an AI draft grounded in the medical record and approved client context. Edit
        freely, then approve when it&apos;s ready for the presentation.
      </p>

      {error && <p className="font-mono text-xs text-amber">{error}</p>}

      {loading ? (
        <p className="font-mono text-xs uppercase tracking-widest text-graphite">Loading…</p>
      ) : (
        <div className="space-y-8">
          {NARRATIVE_TYPES.map(({ type, label }) => {
            const narrative = byType(type);
            const draftValue = drafts[type] ?? narrative?.attorneyVersion ?? narrative?.aiDraft ?? "";
            return (
              <section key={type} className="border-t border-ink/10 pt-5">
                <div className="mb-2 flex items-center gap-3">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-graphite">{label}</h3>
                  {narrative && (
                    <span className={`border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest ${STATUS_COLOR[narrative.status]}`}>
                      {narrative.status === "draft" ? "AI draft" : narrative.status === "edited" ? "Attorney edited" : "Approved"}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => generate(type)}
                    disabled={generating === type}
                    className="ml-auto inline-flex items-center gap-1.5 border border-ink px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest hover:bg-ink hover:text-film disabled:opacity-40"
                  >
                    {generating === type ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                    {narrative ? "Regenerate" : "Generate"}
                  </button>
                </div>

                {narrative ? (
                  <div className="space-y-2">
                    <textarea
                      value={draftValue}
                      onChange={(event) => setDrafts((current) => ({ ...current, [type]: event.target.value }))}
                      onBlur={() => {
                        const baseline = narrative.attorneyVersion ?? narrative.aiDraft;
                        if (draftValue !== baseline) void saveEdit(narrative.id, draftValue);
                      }}
                      rows={5}
                      className="w-full border border-ink/20 bg-white/50 px-3 py-2 text-sm leading-relaxed text-ink/85 focus:border-ink/50 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => approve(narrative.id)}
                      className="border border-teal/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-teal hover:bg-teal hover:text-film"
                    >
                      {narrative.status === "approved" ? "Approved" : "Approve for presentation"}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm italic text-graphite">Not generated yet.</p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
