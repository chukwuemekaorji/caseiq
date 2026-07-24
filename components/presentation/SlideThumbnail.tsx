import type { PresentationSlide } from "@/types";
import { accentFor, TEMPLATE_LABEL } from "./slideTheme";

export default function SlideThumbnail({
  slide,
  index,
  active,
}: {
  slide: PresentationSlide;
  index: number;
  active: boolean;
}) {
  const firstBody = slide.elements.find((el) => el.type === "body" || el.type === "bullets");
  const preview =
    firstBody?.type === "bullets" ? (firstBody.items ?? []).join(" · ") : firstBody?.text ?? "";

  return (
    <div
      className={`relative overflow-hidden border px-2.5 py-2 transition-colors ${
        active ? "border-ink bg-ink/5" : "border-ink/15 hover:border-ink/40"
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: accentFor(slide.templateType) }} />
      <div className="mb-1 mt-1 flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-widest text-graphite">
          {index + 1} · {TEMPLATE_LABEL[slide.templateType] ?? "Content"}
        </span>
        {slide.attorneyApproved && (
          <span className="border border-teal/40 px-1 py-0.5 font-mono text-[8px] uppercase tracking-widest text-teal">
            OK
          </span>
        )}
      </div>
      <p className="truncate text-xs font-medium text-ink">{slide.title || "Untitled slide"}</p>
      {preview && <p className="mt-0.5 line-clamp-2 text-[11px] text-graphite">{preview}</p>}
    </div>
  );
}
