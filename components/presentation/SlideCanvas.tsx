"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { PresentationElement, PresentationSlide } from "@/types";

type Updates = Partial<Pick<PresentationSlide, "title" | "elements" | "presenterNotes" | "attorneyApproved">>;

const ELEMENT_KINDS: PresentationElement["type"][] = ["heading", "body", "bullets", "quote", "stat"];

export default function SlideCanvas({
  slide,
  onChange,
}: {
  slide: PresentationSlide;
  onChange: (updates: Updates) => void;
}) {
  const [title, setTitle] = useState(slide.title);
  const [elements, setElements] = useState<PresentationElement[]>(slide.elements);
  const [notes, setNotes] = useState(slide.presenterNotes ?? "");

  useEffect(() => {
    setTitle(slide.title);
    setElements(slide.elements);
    setNotes(slide.presenterNotes ?? "");
  }, [slide.id, slide.title, slide.elements, slide.presenterNotes]);

  const commitElements = (next: PresentationElement[]) => {
    setElements(next);
    onChange({ elements: next });
  };

  const updateElement = (index: number, patch: Partial<PresentationElement>) => {
    commitElements(elements.map((el, i) => (i === index ? { ...el, ...patch } : el)));
  };

  const removeElement = (index: number) => {
    commitElements(elements.filter((_, i) => i !== index));
  };

  const addElement = (type: PresentationElement["type"]) => {
    const blank: PresentationElement =
      type === "bullets"
        ? { type, items: [""] }
        : type === "stat"
        ? { type, label: "", value: "" }
        : { type, text: "" };
    commitElements([...elements, blank]);
  };

  return (
    <div className="space-y-4 border border-ink/15 p-5">
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onBlur={() => title !== slide.title && onChange({ title })}
        placeholder="Slide title"
        className="w-full border-b border-ink/20 bg-transparent pb-2 font-display text-xl uppercase tracking-tight focus:border-ink/50 focus:outline-none"
      />

      <div className="space-y-3">
        {elements.map((el, index) => (
          <div key={index} className="group relative border border-ink/10 p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-widest text-graphite">{el.type}</span>
              <button
                type="button"
                onClick={() => removeElement(index)}
                className="text-graphite opacity-0 hover:text-red-600 group-hover:opacity-100"
              >
                <Trash2 size={12} />
              </button>
            </div>

            {el.type === "heading" && (
              <input
                value={el.text ?? ""}
                onChange={(event) => updateElement(index, { text: event.target.value })}
                className="w-full bg-transparent text-sm font-semibold focus:outline-none"
              />
            )}

            {(el.type === "body" || el.type === "quote") && (
              <textarea
                value={el.text ?? ""}
                onChange={(event) => updateElement(index, { text: event.target.value })}
                rows={3}
                className="w-full resize-y bg-transparent text-sm leading-relaxed text-ink/85 focus:outline-none"
              />
            )}

            {el.type === "bullets" && (
              <textarea
                value={(el.items ?? []).join("\n")}
                onChange={(event) => updateElement(index, { items: event.target.value.split("\n") })}
                rows={4}
                placeholder="One bullet per line"
                className="w-full resize-y bg-transparent text-sm leading-relaxed text-ink/85 focus:outline-none"
              />
            )}

            {el.type === "stat" && (
              <div className="flex gap-3">
                <input
                  value={el.label ?? ""}
                  onChange={(event) => updateElement(index, { label: event.target.value })}
                  placeholder="Label"
                  className="w-1/2 bg-transparent text-sm focus:outline-none"
                />
                <input
                  value={el.value ?? ""}
                  onChange={(event) => updateElement(index, { value: event.target.value })}
                  placeholder="Value"
                  className="w-1/2 bg-transparent text-sm font-semibold focus:outline-none"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ELEMENT_KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => addElement(kind)}
            className="inline-flex items-center gap-1 border border-ink/20 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-graphite hover:border-ink hover:text-ink"
          >
            <Plus size={9} /> {kind}
          </button>
        ))}
      </div>

      <div className="border-t border-ink/10 pt-3">
        <label className="mb-1 block font-mono text-[9px] uppercase tracking-widest text-graphite">
          Presenter notes
        </label>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          onBlur={() => notes !== (slide.presenterNotes ?? "") && onChange({ presenterNotes: notes })}
          rows={2}
          className="w-full border border-ink/15 bg-white/50 px-2.5 py-1.5 text-xs text-ink/80 focus:border-ink/40 focus:outline-none"
        />
      </div>

      <button
        type="button"
        onClick={() => onChange({ attorneyApproved: !slide.attorneyApproved })}
        className={`border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${
          slide.attorneyApproved
            ? "border-teal/40 text-teal hover:bg-teal hover:text-film"
            : "border-ink/30 text-graphite hover:border-ink hover:text-ink"
        }`}
      >
        {slide.attorneyApproved ? "Approved for jury view" : "Mark approved"}
      </button>
    </div>
  );
}
