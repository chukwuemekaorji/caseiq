import type { PresentationSlide } from "@/types";
import { TEMPLATE_ACCENT } from "@/components/presentation/slideTheme";

const INK = "0B1520";
const GRAPHITE = "8A939B";
const AMBER = "C4703A";
const SLIDE_W = 10;
const SLIDE_H = 5.63;

function accentHex(templateType: string): string {
  return (TEMPLATE_ACCENT[templateType] ?? TEMPLATE_ACCENT.content).replace("#", "");
}

export async function exportPptx(title: string, slides: PresentationSlide[]) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const deck = new PptxGenJS();
  deck.title = title;
  deck.defineLayout({ name: "CASEIQ", width: SLIDE_W, height: SLIDE_H });
  deck.layout = "CASEIQ";

  slides.forEach((slide, index) => {
    const pptSlide = deck.addSlide();
    const accent = accentHex(slide.templateType);
    pptSlide.background = { color: "FFFFFF" };
    pptSlide.addShape("rect", { x: 0, y: 0, w: SLIDE_W, h: 0.12, fill: { color: accent }, line: { type: "none" } });

    if (slide.templateType === "title") {
      addTitleSlide(pptSlide, slide, accent);
    } else if (slide.templateType === "claim" && slide.elements.length >= 2) {
      addClaimSlide(pptSlide, slide, accent);
    } else if (slide.templateType === "evidence") {
      addEvidenceSlide(pptSlide, slide, accent);
    } else {
      addContentSlide(pptSlide, slide, accent);
    }

    pptSlide.addText(`${title}  ·  ${index + 1} / ${slides.length}`, {
      x: 0.4,
      y: SLIDE_H - 0.4,
      w: SLIDE_W - 0.8,
      h: 0.3,
      fontSize: 8,
      color: GRAPHITE,
      fontFace: "Arial",
      align: "right",
    });
  });

  await deck.writeFile({ fileName: `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pptx` });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addTitleSlide(pptSlide: any, slide: PresentationSlide, accent: string) {
  pptSlide.addText(slide.title || "Untitled slide", {
    x: 0.6,
    y: SLIDE_H / 2 - 1,
    w: SLIDE_W - 1.2,
    h: 1.2,
    fontSize: 40,
    bold: true,
    color: INK,
    fontFace: "Arial",
    align: "center",
  });
  pptSlide.addShape("rect", {
    x: SLIDE_W / 2 - 0.6,
    y: SLIDE_H / 2 + 0.25,
    w: 1.2,
    h: 0.03,
    fill: { color: accent },
    line: { type: "none" },
  });
  const subtitle = slide.elements.find((el) => el.type !== "heading" || el.text !== slide.title);
  if (subtitle?.text) {
    pptSlide.addText(subtitle.text, {
      x: 0.6,
      y: SLIDE_H / 2 + 0.4,
      w: SLIDE_W - 1.2,
      h: 0.5,
      fontSize: 13,
      color: GRAPHITE,
      fontFace: "Arial",
      align: "center",
      charSpacing: 2,
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addClaimSlide(pptSlide: any, slide: PresentationSlide, accent: string) {
  pptSlide.addText(slide.title || "Untitled slide", {
    x: 0.5,
    y: 0.45,
    w: SLIDE_W - 1,
    h: 0.7,
    fontSize: 26,
    bold: true,
    color: INK,
    fontFace: "Arial",
  });

  const [claim, response] = slide.elements;
  const colW = (SLIDE_W - 1.3) / 2;

  pptSlide.addShape("rect", { x: 0.5, y: 1.35, w: colW, h: 0.03, fill: { color: AMBER }, line: { type: "none" } });
  pptSlide.addText("THE OTHER SIDE WILL ARGUE", {
    x: 0.5,
    y: 1.5,
    w: colW,
    h: 0.3,
    fontSize: 10,
    bold: true,
    color: AMBER,
    fontFace: "Arial",
    charSpacing: 1,
  });
  pptSlide.addText(claim?.text ?? "", {
    x: 0.5,
    y: 1.85,
    w: colW,
    h: SLIDE_H - 2.3,
    fontSize: 13,
    color: "333333",
    fontFace: "Arial",
    valign: "top",
  });

  const rightX = 0.5 + colW + 0.3;
  pptSlide.addShape("rect", { x: rightX, y: 1.35, w: colW, h: 0.03, fill: { color: accent }, line: { type: "none" } });
  pptSlide.addText("OUR RESPONSE", {
    x: rightX,
    y: 1.5,
    w: colW,
    h: 0.3,
    fontSize: 10,
    bold: true,
    color: accent,
    fontFace: "Arial",
    charSpacing: 1,
  });
  pptSlide.addText(response?.text ?? "", {
    x: rightX,
    y: 1.85,
    w: colW,
    h: SLIDE_H - 2.3,
    fontSize: 13,
    color: "333333",
    fontFace: "Arial",
    valign: "top",
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addEvidenceSlide(pptSlide: any, slide: PresentationSlide, accent: string) {
  pptSlide.addText(slide.title || "Untitled slide", {
    x: 0.5,
    y: 0.45,
    w: SLIDE_W - 1,
    h: 0.7,
    fontSize: 26,
    bold: true,
    color: INK,
    fontFace: "Arial",
  });
  const bullets = slide.elements.find((el) => el.type === "bullets");
  const items = (bullets?.items ?? []).filter(Boolean);
  pptSlide.addText(
    items.map((item) => ({ text: item, options: { bullet: { code: "25CF", color: accent }, breakLine: true, paraSpaceAfter: 10 } })),
    { x: 0.6, y: 1.4, w: SLIDE_W - 1.2, h: SLIDE_H - 2, fontSize: 16, color: "333333", fontFace: "Arial", valign: "top" }
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addContentSlide(pptSlide: any, slide: PresentationSlide, accent: string) {
  pptSlide.addText(slide.title || "Untitled slide", {
    x: 0.5,
    y: 0.45,
    w: SLIDE_W - 1,
    h: 0.7,
    fontSize: 26,
    bold: true,
    color: INK,
    fontFace: "Arial",
  });
  pptSlide.addShape("rect", { x: 0.5, y: 1.25, w: 0.6, h: 0.03, fill: { color: accent }, line: { type: "none" } });

  let y = 1.5;
  for (const el of slide.elements) {
    if (el.type === "bullets" && el.items?.length) {
      const items = el.items.filter(Boolean);
      pptSlide.addText(
        items.map((item) => ({ text: item, options: { bullet: true, breakLine: true, paraSpaceAfter: 6 } })),
        { x: 0.5, y, w: SLIDE_W - 1, h: Math.min(items.length * 0.4 + 0.3, SLIDE_H - y - 0.5), fontSize: 14, color: "333333", fontFace: "Arial" }
      );
      y += Math.min(items.length * 0.4 + 0.5, SLIDE_H - y);
    } else if (el.type === "stat") {
      pptSlide.addText(`${el.label ?? ""}`, { x: 0.5, y, w: SLIDE_W - 1, h: 0.35, fontSize: 11, color: GRAPHITE, fontFace: "Arial", charSpacing: 1 });
      pptSlide.addText(`${el.value ?? ""}`, { x: 0.5, y: y + 0.35, w: SLIDE_W - 1, h: 0.7, fontSize: 30, bold: true, color: accent, fontFace: "Arial" });
      y += 1.2;
    } else if (el.text) {
      pptSlide.addText(el.text, {
        x: 0.5,
        y,
        w: SLIDE_W - 1,
        h: Math.min(1.2, SLIDE_H - y - 0.5),
        fontSize: el.type === "quote" ? 15 : 13,
        italic: el.type === "quote",
        color: "333333",
        fontFace: "Arial",
        valign: "top",
      });
      y += 1.25;
    }
    if (y > SLIDE_H - 0.6) break;
  }
}
