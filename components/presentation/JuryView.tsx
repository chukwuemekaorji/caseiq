"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { PresentationSlide } from "@/types";
import { accentFor, TEMPLATE_GLYPH } from "./slideTheme";

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
  const [direction, setDirection] = useState(1);
  const slide = slides[index];

  const go = (next: number) => {
    setDirection(next > index ? 1 : -1);
    setIndex(Math.max(0, Math.min(next, slides.length - 1)));
  };

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === " ") go(index + 1);
      if (event.key === "ArrowLeft") go(index - 1);
      if (event.key === "Escape") onExit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, slides.length, onExit]);

  if (!slide) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink text-film">
        <p>No slides.</p>
      </div>
    );
  }

  const accent = accentFor(slide.templateType);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink text-film">
      <div className="flex items-center justify-between px-8 py-5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-film/50">{title}</span>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] uppercase tracking-widest text-film/50">
            {index + 1} / {slides.length}
          </span>
          <button type="button" onClick={onExit} className="text-film/70 hover:text-film">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex flex-col items-center justify-center px-16 pb-10"
          >
            <SlideBody slide={slide} accent={accent} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-16 pb-3">
        <div className="h-[2px] w-full bg-film/10">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${((index + 1) / slides.length) * 100}%`, background: accent }}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 pb-8">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          className="border border-film/30 p-2 hover:bg-film hover:text-ink disabled:opacity-30"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === slides.length - 1}
          className="border border-film/30 p-2 hover:bg-film hover:text-ink disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function SlideBody({ slide, accent }: { slide: PresentationSlide; accent: string }) {
  if (slide.templateType === "title") {
    return (
      <div className="max-w-4xl text-center">
        <h1 className="mb-6 font-display text-6xl uppercase tracking-tight sm:text-7xl">{slide.title}</h1>
        <div className="mx-auto mb-6 h-[3px] w-24" style={{ background: accent }} />
        {slide.elements
          .filter((el) => el.type !== "heading" || el.text !== slide.title)
          .map((el, i) => (
            <p key={i} className="font-mono text-sm uppercase tracking-[0.2em] text-film/60">
              {el.text}
            </p>
          ))}
      </div>
    );
  }

  if (slide.templateType === "claim" && slide.elements.length >= 2) {
    const [claim, response] = slide.elements;
    const claimItems = claim.items ?? (claim.text ? [claim.text] : []);
    const responseItems = response.items ?? (response.text ? [response.text] : []);
    return (
      <div className="w-full max-w-5xl">
        <h2 className="mb-10 text-center font-display text-4xl uppercase tracking-tight sm:text-5xl">
          {slide.title}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="border-t-2 border-amber/70 bg-film/5 p-6">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-amber">The other side will argue</p>
            <ul className="space-y-3 text-left">
              {claimItems.map((item, i) => (
                <li key={i} className="flex gap-3 text-lg leading-relaxed text-film/85">
                  <span className="text-amber">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t-2 p-6" style={{ borderColor: accent, background: "rgba(45, 212, 167, 0.06)" }}>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: accent }}>
              Our response
            </p>
            <ul className="space-y-3 text-left">
              {responseItems.map((item, i) => (
                <li key={i} className="flex gap-3 text-lg leading-relaxed text-film/85">
                  <span style={{ color: accent }}>—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (slide.templateType === "evidence") {
    const bullets = slide.elements.find((el) => el.type === "bullets");
    return (
      <div className="w-full max-w-3xl">
        <h2 className="mb-8 font-display text-4xl uppercase tracking-tight sm:text-5xl">{slide.title}</h2>
        <ul className="space-y-4 text-left">
          {(bullets?.items ?? []).filter(Boolean).map((item, i) => (
            <li key={i} className="flex items-start gap-4">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ background: accent }} />
              <span className="text-xl leading-relaxed text-film/90">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // content / before-after / closing / anything else — generic flowing layout
  return (
    <div className="max-w-3xl text-center">
      <div
        className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full text-lg text-film"
        style={{ background: accent }}
      >
        {TEMPLATE_GLYPH[slide.templateType] ?? "✎"}
      </div>
      <h2 className="mb-3 font-display text-4xl uppercase tracking-tight sm:text-5xl">{slide.title}</h2>
      <div className="mx-auto mb-8 h-[2px] w-16" style={{ background: accent }} />
      <div className="space-y-6">
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
                    <span style={{ color: accent }}>—</span>
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
                <p className="text-6xl font-bold" style={{ color: accent }}>
                  {el.value}
                </p>
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
            <p key={i} className="text-xl leading-relaxed text-film/85">
              {el.text}
            </p>
          );
        })}
      </div>
    </div>
  );
}
