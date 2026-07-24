"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import type { ClientContextEntry, ContextSuggestion } from "@/types";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

const CATEGORIES = [
  "life-before",
  "incident",
  "medical",
  "work",
  "financial",
  "family",
  "hobbies",
  "mobility",
  "mental-health",
  "daily-life",
  "current-condition",
  "future-concern",
  "witness",
  "uncategorized",
];

export default function ClientContextPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const [entries, setEntries] = useState<ClientContextEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("uncategorized");
  const [confidential, setConfidential] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<Record<string, ContextSuggestion>>({});
  const [suggestingId, setSuggestingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchWithTimeout(`/api/cases/${caseId}/context`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const addNote = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      const res = await fetchWithTimeout(`/api/cases/${caseId}/context`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: note.trim(), category, confidential }),
      });
      if (res.ok) {
        setNote("");
        setCategory("uncategorized");
        setConfidential(false);
        await load();
      }
    } finally {
      setSaving(false);
    }
  };

  const patchEntry = async (id: string, patch: Record<string, unknown>) => {
    await fetchWithTimeout(`/api/cases/${caseId}/context/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await load();
  };

  const convert = async (id: string, as: "story-point" | "evidence") => {
    await fetchWithTimeout(`/api/cases/${caseId}/context/${id}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ as }),
    });
  };

  const suggest = async (id: string) => {
    setSuggestingId(id);
    try {
      const res = await fetchWithTimeout(`/api/cases/${caseId}/context/${id}/suggest`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setSuggestions((current) => ({ ...current, [id]: data.suggestion }));
      }
    } finally {
      setSuggestingId(null);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-graphite">Client context</p>
        <h2 className="mb-4 font-display text-2xl uppercase tracking-tight">Add what the record doesn&apos;t say</h2>
        <p className="mb-4 max-w-2xl text-sm text-ink/70">
          Add new information about the client, their life, treatment, work, family, finances, recovery, or current
          limitations. Write in plain language — this becomes the raw material for the case story.
        </p>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
          placeholder="e.g. Caldwell used to coach his son's football team every Saturday. Since March, he has stopped attending because he cannot stand for more than twenty minutes."
          className="w-full border border-ink/25 bg-white/60 px-3 py-2.5 text-sm focus:border-ink/50 focus:outline-none"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="border border-ink/25 bg-transparent px-2 py-1.5 font-mono text-[11px] uppercase tracking-widest"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace(/-/g, " ")}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-graphite">
            <input type="checkbox" checked={confidential} onChange={(event) => setConfidential(event.target.checked)} />
            Confidential (excluded from AI &amp; jury output)
          </label>
          <button
            type="button"
            disabled={!note.trim() || saving}
            onClick={addNote}
            className="ml-auto bg-ink px-5 py-2 font-mono text-xs uppercase tracking-widest text-film disabled:opacity-30"
          >
            {saving ? "Saving…" : "Add note"}
          </button>
        </div>
      </div>

      <div className="space-y-4 border-t border-ink/10 pt-6">
        {loading ? (
          <p className="font-mono text-xs uppercase tracking-widest text-graphite">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm italic text-graphite">No context added yet.</p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="border border-ink/15 bg-white/50 p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-graphite">
                <span>{entry.category.replace(/-/g, " ")}</span>
                <span>·</span>
                <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                {entry.verified && <span className="text-teal">Verified</span>}
                {entry.confidential && <span className="text-amber">Confidential</span>}
                {!entry.aiUsable && <span>Excluded from AI</span>}
              </div>
              <p className="mb-3 text-sm text-ink/85">{entry.content}</p>
              <div className="flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-widest">
                <button
                  onClick={() => patchEntry(entry.id, { verified: !entry.verified })}
                  className="border border-ink/25 px-2 py-1 hover:border-ink"
                >
                  {entry.verified ? "Unmark verified" : "Mark verified"}
                </button>
                <button
                  onClick={() => patchEntry(entry.id, { aiUsable: !entry.aiUsable })}
                  className="border border-ink/25 px-2 py-1 hover:border-ink"
                >
                  {entry.aiUsable ? "Exclude from AI" : "Include in AI"}
                </button>
                <button
                  onClick={() => convert(entry.id, "story-point")}
                  className="border border-teal/40 px-2 py-1 text-teal hover:bg-teal hover:text-film"
                >
                  Convert to story point
                </button>
                <button
                  onClick={() => convert(entry.id, "evidence")}
                  className="border border-teal/40 px-2 py-1 text-teal hover:bg-teal hover:text-film"
                >
                  Convert to evidence
                </button>
                <button
                  onClick={() => suggest(entry.id)}
                  disabled={suggestingId === entry.id}
                  className="inline-flex items-center gap-1 border border-ink px-2 py-1 hover:bg-ink hover:text-film disabled:opacity-40"
                >
                  {suggestingId === entry.id ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                  AI suggestions
                </button>
              </div>

              {suggestions[entry.id] && (
                <div className="mt-3 border-t border-ink/10 pt-3 text-sm">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-graphite">
                    Suggested story point (draft)
                  </p>
                  <p className="mb-2 font-display text-base uppercase">{suggestions[entry.id].storyPointTitle}</p>
                  <p className="mb-3 text-ink/80">{suggestions[entry.id].storyPointDescription}</p>
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-graphite">Follow-up questions</p>
                  <ul className="mb-3 list-disc pl-4 text-ink/70">
                    {suggestions[entry.id].followUpQuestions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-graphite">Possible evidence</p>
                  <ul className="list-disc pl-4 text-ink/70">
                    {suggestions[entry.id].suggestedEvidence.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
