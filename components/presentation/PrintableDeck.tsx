import type { PresentationSlide } from "@/types";
import { accentFor, TEMPLATE_GLYPH } from "./slideTheme";

export default function PrintableDeck({ title, slides }: { title: string; slides: PresentationSlide[] }) {
  return (
    <div className="hidden print:block">
      {slides.map((slide, index) => (
        <section key={slide.id} className="break-after-page relative px-12 py-14">
          <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: accentFor(slide.templateType) }} />
          <p className="mb-8 flex justify-between font-mono text-[10px] uppercase tracking-widest text-graphite">
            <span>{title}</span>
            <span>
              {index + 1} / {slides.length}
            </span>
          </p>
          <PrintableSlideBody slide={slide} />
        </section>
      ))}
    </div>
  );
}

function PrintableSlideBody({ slide }: { slide: PresentationSlide }) {
  const accent = accentFor(slide.templateType);

  if (slide.templateType === "title") {
    return (
      <div className="py-16 text-center">
        <h1 className="mb-5 font-display text-5xl uppercase tracking-tight">{slide.title}</h1>
        <div className="mx-auto mb-5 h-[3px] w-20" style={{ background: accent }} />
        {slide.elements
          .filter((el) => el.type !== "heading" || el.text !== slide.title)
          .map((el, i) => (
            <p key={i} className="font-mono text-sm uppercase tracking-[0.2em] text-graphite">
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
      <div>
        <h1 className="mb-8 font-display text-3xl uppercase tracking-tight">{slide.title}</h1>
        <div className="grid grid-cols-2 gap-6 break-inside-avoid">
          <div className="border-t-2 border-amber p-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-amber">
              The other side will argue
            </p>
            <ul className="list-disc space-y-1 pl-4 text-sm leading-relaxed">
              {claimItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="border-t-2 p-4" style={{ borderColor: accent }}>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest" style={{ color: accent }}>
              Our response
            </p>
            <ul className="list-disc space-y-1 pl-4 text-sm leading-relaxed">
              {responseItems.map((item, i) => (
                <li key={i}>{item}</li>
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
      <div>
        <h1 className="mb-6 font-display text-3xl uppercase tracking-tight">{slide.title}</h1>
        <ul className="space-y-2">
          {(bullets?.items ?? []).filter(Boolean).map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: accent }} />
              <span className="text-base leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm text-white"
          style={{ background: accent }}
        >
          {TEMPLATE_GLYPH[slide.templateType] ?? "✎"}
        </span>
        <h1 className="font-display text-3xl uppercase tracking-tight">{slide.title}</h1>
      </div>
      <div className="mb-6 h-[2px] w-14" style={{ background: accent }} />
      <div className="space-y-4">
        {slide.elements.map((el, i) => {
          if (el.type === "bullets") {
            return (
              <ul key={i} className="list-disc space-y-1 pl-5 text-base leading-relaxed">
                {(el.items ?? []).filter(Boolean).map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          }
          if (el.type === "stat") {
            return (
              <div key={i}>
                <p className="font-mono text-xs uppercase tracking-widest text-graphite">{el.label}</p>
                <p className="text-3xl font-bold" style={{ color: accent }}>
                  {el.value}
                </p>
              </div>
            );
          }
          if (el.type === "heading") {
            return (
              <p key={i} className="text-xl font-semibold">
                {el.text}
              </p>
            );
          }
          if (el.type === "quote") {
            return (
              <blockquote key={i} className="text-lg italic">
                &ldquo;{el.text}&rdquo;
              </blockquote>
            );
          }
          return (
            <p key={i} className="text-base leading-relaxed">
              {el.text}
            </p>
          );
        })}
      </div>
    </div>
  );
}
