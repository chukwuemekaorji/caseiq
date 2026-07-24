import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  cases,
  presentations,
  presentationSlides,
  generatedNarratives,
  evidenceItems,
  evidenceCompositions,
} from "@/db/schema";
import type { PresentationElement } from "@/db/schema";
import { callAnthropic } from "@/backend/anthropicClient";

const BULLET_SCHEMA = {
  type: "array",
  items: { type: "string" },
};

/**
 * Condenses attorney-approved prose into short, jury-slide-ready bullets.
 * This never introduces a new fact — it's a compression of text that's
 * already been approved elsewhere, not fresh generation, so it stays
 * inside the "nothing invented at export time" rule. Falls back to a
 * plain sentence split if the model call fails, so one bad summarization
 * never blocks the whole deck.
 */
async function condenseToBullets(text: string, maxBullets = 4): Promise<string[]> {
  const result = await callAnthropic({
    system:
      "You compress attorney-approved case text into short, punchy bullet points for a jury-facing slide. " +
      "ABSOLUTE RULES: never add a fact, number, date, citation, or claim that isn't already written in the source text — " +
      "that includes record citations. If the source text already contains a specific citation like '[record 42]' or 'record 42', " +
      "keep that exact number. If the source text has NO citation for a given statement, do not add one — never write a placeholder " +
      "or generic marker like '[record N]', '[record #]', or similar. An uncited sentence in the source must stay uncited in the bullet. " +
      "Never soften or exaggerate. Each bullet is one short sentence or fragment, plain language, no legal jargon where a simpler word works.",
    schema: BULLET_SCHEMA,
    user: `Condense this into at most ${maxBullets} short bullet points for a jury slide:\n\n${text}`,
  });

  if (!result.ok) return fallbackBullets(text, maxBullets);
  try {
    const parsed = JSON.parse(result.text);
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string") && parsed.length) {
      return parsed.slice(0, maxBullets).map(stripPlaceholderCitations);
    }
  } catch {
    // fall through to heuristic fallback
  }
  return fallbackBullets(text, maxBullets);
}

/**
 * Belt-and-suspenders against the model inventing a citation where the
 * source had none — e.g. "[record N]" or "[record #]" instead of a real
 * number. Only strips brackets that contain "record" with no digit inside;
 * a genuine "[record 42]" citation is left untouched.
 */
function stripPlaceholderCitations(bullet: string): string {
  return bullet.replace(/\s*\[record[^\]0-9]*\]/gi, "").trim();
}

function fallbackBullets(text: string, maxBullets: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  return sentences.slice(0, maxBullets).map((s) => s.trim());
}

export async function POST(_req: Request, context: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await context.params;

  const [caseRecord] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
  if (!caseRecord) {
    return NextResponse.json({ error: "Case not found." }, { status: 404 });
  }

  const [existingPresentation] = await db.select().from(presentations).where(eq(presentations.caseId, caseId)).limit(1);
  const presentation = existingPresentation ?? (await db.insert(presentations).values({ caseId }).returning())[0];

  const narratives = await db
    .select()
    .from(generatedNarratives)
    .where(and(eq(generatedNarratives.caseId, caseId), eq(generatedNarratives.status, "approved")));

  const narrativeText = (type: string) => {
    const n = narratives.find((x) => x.type === type);
    return n ? n.attorneyVersion ?? n.aiDraft : null;
  };

  const includedEvidence = await db
    .select()
    .from(evidenceItems)
    .where(and(eq(evidenceItems.caseId, caseId), eq(evidenceItems.includedInPresentation, true)));

  const includedCompositions = await db
    .select()
    .from(evidenceCompositions)
    .where(
      and(
        eq(evidenceCompositions.caseId, caseId),
        eq(evidenceCompositions.includedInPresentation, true),
        eq(evidenceCompositions.reviewStatus, "approved")
      )
    );

  const clientName = caseRecord.clientName ?? caseRecord.caseName ?? "This case";

  type DraftSlide = { templateType: string; title: string; elements: PresentationElement[]; presenterNotes?: string };
  const slides: DraftSlide[] = [];

  slides.push({
    templateType: "title",
    title: clientName,
    elements: [
      { type: "heading", text: clientName },
      ...(caseRecord.matterNumber ? [{ type: "body" as const, text: `Matter ${caseRecord.matterNumber}` }] : []),
    ],
  });

  const NARRATIVE_SLIDES: Array<{ type: string; title: string }> = [
    { type: "thirty-second-summary", title: "Case summary" },
    { type: "medical-story", title: "Medical journey" },
    { type: "life-impact-story", title: "Life impact" },
    { type: "financial-story", title: "Financial impact" },
    { type: "before-after", title: "Before vs. after" },
    { type: "closing-summary", title: "Closing" },
  ];

  const narrativeJobs = NARRATIVE_SLIDES.map(({ type, title }) => ({ type, title, text: narrativeText(type) })).filter(
    (job): job is { type: string; title: string; text: string } => Boolean(job.text)
  );

  const claimJobs = includedCompositions.flatMap((c) => [
    { key: `${c.id}:claim`, text: c.claimDescription },
    { key: `${c.id}:response`, text: c.attorneyResponse },
  ]);

  const [narrativeBullets, claimBullets] = await Promise.all([
    Promise.all(narrativeJobs.map((job) => condenseToBullets(job.text))),
    Promise.all(claimJobs.map((job) => condenseToBullets(job.text, 3))),
  ]);

  narrativeJobs.forEach((job, i) => {
    slides.push({
      templateType: job.type === "before-after" ? "before-after" : job.type === "closing-summary" ? "closing" : "content",
      title: job.title,
      elements: [{ type: "bullets", items: narrativeBullets[i] }],
      presenterNotes: job.text,
    });
  });

  if (includedEvidence.length) {
    slides.push({
      templateType: "evidence",
      title: "Key evidence",
      elements: [
        {
          type: "bullets",
          items: includedEvidence.map((item) => `${item.title} (${item.category.replace(/-/g, " ")})`),
        },
      ],
    });
  }

  const claimBulletsByKey = new Map<string, string[]>();
  claimJobs.forEach((job, i) => claimBulletsByKey.set(job.key, claimBullets[i]));

  for (const composition of includedCompositions) {
    slides.push({
      templateType: "claim",
      title: composition.claimTitle,
      elements: [
        { type: "bullets", items: claimBulletsByKey.get(`${composition.id}:claim`) ?? [] },
        { type: "bullets", items: claimBulletsByKey.get(`${composition.id}:response`) ?? [] },
      ],
      presenterNotes: `Claim: ${composition.claimDescription}\n\nResponse: ${composition.attorneyResponse}`,
    });
  }

  await db.delete(presentationSlides).where(eq(presentationSlides.presentationId, presentation.id));
  const created = slides.length
    ? await db
        .insert(presentationSlides)
        .values(
          slides.map((slide, index) => ({
            presentationId: presentation.id,
            order: index,
            templateType: slide.templateType,
            title: slide.title,
            elements: slide.elements,
            presenterNotes: slide.presenterNotes ?? null,
          }))
        )
        .returning()
    : [];

  return NextResponse.json({ presentation, slides: created });
}
