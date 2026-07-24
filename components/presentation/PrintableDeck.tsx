import type { PresentationSlide } from "@/types";

export default function PrintableDeck({ title, slides }: { title: string; slides: PresentationSlide[] }) {
  return (
    <div className="hidden print:block">
      {slides.map((slide, index) => (
        <section key={slide.id} className="break-after-page px-10 py-14">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-graphite">
            {title} — {index + 1} / {slides.length}
          </p>
          <h1 className="mb-6 font-display text-3xl uppercase tracking-tight">{slide.title}</h1>
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
                    <p className="text-3xl font-bold">{el.value}</p>
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
        </section>
      ))}
    </div>
  );
}
