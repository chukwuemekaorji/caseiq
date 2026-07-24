import type { PresentationSlide } from "@/types";

export async function exportPptx(title: string, slides: PresentationSlide[]) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const deck = new PptxGenJS();
  deck.title = title;

  for (const slide of slides) {
    const pptSlide = deck.addSlide();
    pptSlide.addText(slide.title || "Untitled slide", {
      x: 0.5,
      y: 0.35,
      w: 9,
      h: 0.8,
      fontSize: 24,
      bold: true,
      color: "1A1A1A",
    });

    let y = 1.4;
    for (const el of slide.elements) {
      if (el.type === "bullets" && el.items?.length) {
        pptSlide.addText(
          el.items.filter(Boolean).map((item) => ({ text: item, options: { bullet: true, breakLine: true } })),
          { x: 0.5, y, w: 9, h: 3, fontSize: 16, color: "333333" }
        );
        y += 0.5 + el.items.length * 0.4;
      } else if (el.type === "stat") {
        pptSlide.addText(`${el.label ?? ""}`, { x: 0.5, y, w: 9, h: 0.4, fontSize: 12, color: "888888" });
        pptSlide.addText(`${el.value ?? ""}`, { x: 0.5, y: y + 0.35, w: 9, h: 0.7, fontSize: 28, bold: true, color: "0F6E6E" });
        y += 1.3;
      } else if (el.text) {
        pptSlide.addText(el.text, {
          x: 0.5,
          y,
          w: 9,
          h: 1.2,
          fontSize: el.type === "quote" ? 18 : 14,
          italic: el.type === "quote",
          color: "333333",
        });
        y += 1.3;
      }
    }
  }

  await deck.writeFile({ fileName: `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pptx` });
}
