"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  FileDown,
  Loader2,
  Maximize2,
  Plus,
  Printer,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { Presentation, PresentationSlide } from "@/types";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import JuryView from "@/components/presentation/JuryView";
import SlideThumbnail from "@/components/presentation/SlideThumbnail";
import SlideCanvas from "@/components/presentation/SlideCanvas";
import PrintableDeck from "@/components/presentation/PrintableDeck";
import PresentingBuddy from "@/components/illustrations/PresentingBuddy";

export default function PresentationPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [slides, setSlides] = useState<PresentationSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [juryView, setJuryView] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchWithTimeout(`/api/cases/${caseId}/presentation`);
      if (res.ok) {
        const data = await res.json();
        setPresentation(data.presentation ?? null);
        setSlides(data.slides ?? []);
        setActiveId((current) => current ?? data.slides?.[0]?.id ?? null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const active = useMemo(() => slides.find((s) => s.id === activeId) ?? null, [slides, activeId]);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetchWithTimeout(`/api/cases/${caseId}/presentation/generate`, { method: "POST" }, 30000);
      if (res.ok) {
        const data = await res.json();
        setSlides(data.slides ?? []);
        setActiveId(data.slides?.[0]?.id ?? null);
      }
    } finally {
      setGenerating(false);
    }
  };

  const addSlide = async () => {
    const res = await fetchWithTimeout(`/api/cases/${caseId}/presentation/slides`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New slide", templateType: "content", elements: [{ type: "body", text: "" }] }),
    });
    if (res.ok) {
      const data = await res.json();
      setSlides((current) => [...current, data.slide]);
      setActiveId(data.slide.id);
    }
  };

  const duplicateSlide = async (slide: PresentationSlide) => {
    const res = await fetchWithTimeout(`/api/cases/${caseId}/presentation/slides`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `${slide.title} (copy)`, templateType: slide.templateType, elements: slide.elements }),
    });
    if (res.ok) {
      const data = await res.json();
      setSlides((current) => [...current, data.slide]);
      setActiveId(data.slide.id);
    }
  };

  const deleteSlide = async (slideId: string) => {
    await fetchWithTimeout(`/api/cases/${caseId}/presentation/slides/${slideId}`, { method: "DELETE" });
    setSlides((current) => {
      const next = current.filter((s) => s.id !== slideId);
      if (activeId === slideId) setActiveId(next[0]?.id ?? null);
      return next;
    });
  };

  const updateSlide = async (slideId: string, updates: Partial<Pick<PresentationSlide, "title" | "elements" | "presenterNotes" | "attorneyApproved">>) => {
    setSlides((current) => current.map((s) => (s.id === slideId ? { ...s, ...updates } : s)));
    await fetchWithTimeout(`/api/cases/${caseId}/presentation/slides/${slideId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  };

  const moveSlide = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    const next = [...slides];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setSlides(next);
    await fetchWithTimeout(`/api/cases/${caseId}/presentation/slides/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: next.map((s) => s.id) }),
    });
  };

  const exportPptxDeck = async () => {
    setExporting(true);
    try {
      const { exportPptx } = await import("@/lib/exportPptx");
      await exportPptx(presentation?.title ?? "Presentation", slides);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <p className="font-mono text-xs uppercase tracking-widest text-graphite">Loading…</p>;
  }

  if (juryView) {
    return <JuryView slides={slides} title={presentation?.title ?? "Presentation"} onExit={() => setJuryView(false)} />;
  }

  return (
    <div className="space-y-6">
      <PrintableDeck title={presentation?.title ?? "Presentation"} slides={slides} />
      <div className="space-y-6 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl uppercase tracking-tight">Presentation</h2>
          <p className="max-w-2xl text-sm text-ink/70">
            Assembled only from approved narratives, verified evidence, and approved claim compositions — nothing here was
            invented at export time.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className="inline-flex items-center gap-1.5 border border-ink px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest hover:bg-ink hover:text-film disabled:opacity-40"
          >
            {generating ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
            Generate from approved content
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 border border-ink/30 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest hover:bg-ink hover:text-film"
          >
            <Printer size={11} /> Export PDF
          </button>
          <button
            type="button"
            onClick={exportPptxDeck}
            disabled={exporting || !slides.length}
            className="inline-flex items-center gap-1.5 border border-ink/30 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest hover:bg-ink hover:text-film disabled:opacity-40"
          >
            {exporting ? <Loader2 size={11} className="animate-spin" /> : <FileDown size={11} />}
            Export PPTX
          </button>
          <button
            type="button"
            onClick={() => setJuryView(true)}
            disabled={!slides.length}
            className="inline-flex items-center gap-1.5 border border-teal/40 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-teal hover:bg-teal hover:text-film disabled:opacity-40"
          >
            <Maximize2 size={11} /> Jury view
          </button>
        </div>
      </div>

      {!slides.length ? (
        <div className="border border-dashed border-ink/20 p-10 text-center">
          <PresentingBuddy className="mx-auto mb-3 h-28 w-32" />
          <p className="text-sm text-graphite">No slides yet. Generate from approved content or add a blank slide.</p>
          <button
            type="button"
            onClick={addSlide}
            className="mt-3 inline-flex items-center gap-1.5 border border-ink px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest hover:bg-ink hover:text-film"
          >
            <Plus size={11} /> Add slide
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
          <div className="space-y-2">
            {slides.map((slide, index) => (
              <div key={slide.id} className="group relative">
                <button type="button" onClick={() => setActiveId(slide.id)} className="w-full text-left">
                  <SlideThumbnail slide={slide} index={index} active={slide.id === activeId} />
                </button>
                <div className="mt-1 flex items-center justify-between opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      title="Move up"
                      onClick={() => moveSlide(index, -1)}
                      className="p-1 text-graphite hover:text-ink"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      type="button"
                      title="Move down"
                      onClick={() => moveSlide(index, 1)}
                      className="p-1 text-graphite hover:text-ink"
                    >
                      <ChevronDown size={12} />
                    </button>
                    <button
                      type="button"
                      title="Duplicate"
                      onClick={() => duplicateSlide(slide)}
                      className="p-1 text-graphite hover:text-ink"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => deleteSlide(slide.id)}
                    className="p-1 text-graphite hover:text-red-600"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addSlide}
              className="flex w-full items-center justify-center gap-1.5 border border-dashed border-ink/30 px-2.5 py-2 font-mono text-[10px] uppercase tracking-widest text-graphite hover:border-ink hover:text-ink"
            >
              <Plus size={11} /> Add slide
            </button>
          </div>

          {active && (
            <SlideCanvas
              key={active.id}
              slide={active}
              onChange={(updates) => updateSlide(active.id, updates)}
            />
          )}
        </div>
      )}
      </div>
    </div>
  );
}
