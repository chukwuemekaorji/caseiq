"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import type { EvidenceItem } from "@/types";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

const CATEGORIES = [
  "medical-record",
  "imaging",
  "operative-report",
  "expert-opinion",
  "employment-record",
  "payroll-record",
  "client-statement",
  "witness-statement",
  "photograph",
  "video",
  "police-report",
  "insurance-record",
  "financial-document",
  "digital-evidence",
  "other",
];

const STRENGTH_COLOR: Record<string, string> = {
  strong: "text-teal border-teal/40",
  moderate: "text-graphite border-ink/20",
  weak: "text-amber border-amber/40",
  missing: "text-amber border-amber/40",
};

export default function EvidencePage() {
  const { caseId } = useParams<{ caseId: string }>();
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("other");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchWithTimeout(`/api/cases/${caseId}/evidence`);
      if (res.ok) setItems((await res.json()).items ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [items, search]);

  const addItem = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetchWithTimeout(`/api/cases/${caseId}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), category, description }),
      });
      if (res.ok) {
        setTitle("");
        setDescription("");
        setCategory("other");
        setShowForm(false);
        await load();
      }
    } finally {
      setSaving(false);
    }
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    await fetchWithTimeout(`/api/cases/${caseId}/evidence/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl uppercase tracking-tight">Evidence</h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 border border-ink px-3 py-1.5 font-mono text-xs uppercase tracking-widest hover:bg-ink hover:text-film"
        >
          <Plus size={12} /> Add evidence
        </button>
      </div>

      {showForm && (
        <div className="space-y-3 border border-ink/15 bg-white/50 p-4">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Title (e.g. Employer attendance records)"
            className="w-full border border-ink/25 bg-transparent px-3 py-2 text-sm"
          />
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
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
            placeholder="Description / notes"
            className="w-full border border-ink/25 bg-transparent px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={!title.trim() || saving}
            onClick={addItem}
            className="bg-ink px-5 py-2 font-mono text-xs uppercase tracking-widest text-film disabled:opacity-30"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 border border-ink/20 bg-white/40 px-3 py-2">
        <Search size={14} className="text-graphite" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search evidence…"
          className="w-full bg-transparent text-sm focus:outline-none"
        />
      </div>

      {loading ? (
        <p className="font-mono text-xs uppercase tracking-widest text-graphite">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm italic text-graphite">No evidence yet.</p>
      ) : (
        <div className="divide-y divide-ink/10 border-t border-ink/10">
          {filtered.map((item) => (
            <div key={item.id} className="grid grid-cols-[1fr_auto] items-start gap-4 py-4">
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <p className="font-display text-lg uppercase tracking-tight">{item.title}</p>
                  <span className={`border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest ${STRENGTH_COLOR[item.strength]}`}>
                    {item.strength}
                  </span>
                  {item.verificationStatus === "verified" && (
                    <span className="border border-teal/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-teal">
                      Verified
                    </span>
                  )}
                  {item.verificationStatus === "disputed" && (
                    <span className="border border-amber/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-amber">
                      Disputed
                    </span>
                  )}
                </div>
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-graphite">
                  {item.category.replace(/-/g, " ")}
                </p>
                {item.description && <p className="text-sm text-ink/80">{item.description}</p>}
              </div>
              <div className="flex shrink-0 flex-wrap gap-1.5 font-mono text-[9px] uppercase tracking-widest">
                <button
                  onClick={() => patch(item.id, { verificationStatus: "verified" })}
                  className="border border-ink/25 px-2 py-1 hover:border-ink"
                >
                  Verify
                </button>
                <button
                  onClick={() => patch(item.id, { verificationStatus: "disputed" })}
                  className="border border-ink/25 px-2 py-1 hover:border-ink"
                >
                  Dispute
                </button>
                <button
                  onClick={() => patch(item.id, { includedInPresentation: !item.includedInPresentation })}
                  className={`border px-2 py-1 ${
                    item.includedInPresentation ? "border-teal/40 text-teal" : "border-ink/25"
                  }`}
                >
                  {item.includedInPresentation ? "In presentation" : "Include"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
