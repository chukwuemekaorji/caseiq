"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { PresentationSlide } from "@/types";

export default function JuryView({
  slides,
  title,
  onExit,
}: {
  slides: PresentationSlide[];
  title: string;
  onExit: () => void;
}) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === " ") setIndex((i) => Math.min(i + 1, slides.length - 1));
      if (event.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
      if (event.key === "Escape") onExit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [slides.length, onExit]);

  if (!slide) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink text-film">
        <p>No slides.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink text-film">
      <div className="flex items-center justify-between px-6 py-4">
        <span className="font-mono text-[10px] uppercase tracking-widest text-film/50">{title}</span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-widest text-film/50">
            {index + 1} / {slides.length}
          </span>
          <button type="button" onClick={onExit} className="text-film/70 hover:text-film">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-12 pb-16 text-center">
        <h1 className="mb-8 max-w-4xl font-display text-4xl uppercase tracking-tight sm:text-5xl">{slide.title}</h1>
        <div className="max-w-3xl space-y-6">
          {slide.elements.map((el, i) => {
            if (el.type === "heading") {
              return (
                <p key={i} className="text-2xl font-semibold">
                  {el.text}
                </p>
              );
            }
            if (el.type === "bullets") {
              return (
                <ul key={i} className="space-y-3 text-left text-xl leading-relaxed">
                  {(el.items ?? []).filter(Boolean).map((item, j) => (
                    <li key={j} className="flex gap-3">
                      <span className="text-teal">—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              );
            }
            if (el.type === "stat") {
              return (
                <div key={i}>
                  <p className="font-mono text-xs uppercase tracking-widest text-film/50">{el.label}</p>
                  <p className="text-5xl font-bold text-teal">{el.value}</p>
                </div>
              );
            }
            if (el.type === "quote") {
              return (
                <blockquote key={i} className="text-2xl italic text-film/90">
                  &ldquo;{el.text}&rdquo;
                </blockquote>
              );
            }
            return (
              <p key={i} className="text-xl leading-relaxed text-film/90">
                {el.text}
              </p>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 pb-8">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(i - 1, 0))}
          disabled={index === 0}
          className="border border-film/30 p-2 hover:bg-film hover:text-ink disabled:opacity-30"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(i + 1, slides.length - 1))}
          disabled={index === slides.length - 1}
          className="border border-film/30 p-2 hover:bg-film hover:text-ink disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
