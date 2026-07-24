/**
 * Shared per-template accent so the editor, print output, PPTX export, and
 * Jury View all agree on the same visual language — a claim slide should
 * look like a claim slide everywhere it's rendered.
 */
export const TEMPLATE_ACCENT: Record<string, string> = {
  title: "#8B5CF6",
  content: "#1B4F63",
  evidence: "#2DD4A7",
  claim: "#C4703A",
  "before-after": "#1B4F63",
  closing: "#FF6B6B",
};

export function accentFor(templateType: string): string {
  return TEMPLATE_ACCENT[templateType] ?? "#1B4F63";
}

export const TEMPLATE_LABEL: Record<string, string> = {
  title: "Title",
  content: "Content",
  evidence: "Evidence",
  claim: "Claim",
  "before-after": "Before / after",
  closing: "Closing",
};

/** Single-character glyph per template — used as a decorative anchor in
 * contexts (PPTX export) that can't render a real icon component. */
export const TEMPLATE_GLYPH: Record<string, string> = {
  title: "§",
  content: "✎",
  evidence: "✓",
  claim: "⚖",
  "before-after": "⇄",
  closing: "✦",
};
