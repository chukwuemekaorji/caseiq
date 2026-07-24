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

/**
 * Assembles a slide deck from content that is already attorney-approved —
 * it never calls the model here. Narratives, evidence, and claim compositions
 * were already reviewed on their own pages; this step only structures what
 * was approved. That's the whole point of "jury-facing output built from
 * approved content only" — nothing new gets invented at export time.
 */
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

  const slides: Array<{ templateType: string; title: string; elements: PresentationElement[] }> = [];

  slides.push({
    templateType: "title",
    title: clientName,
    elements: [
      { type: "heading", text: clientName },
      ...(caseRecord.matterNumber ? [{ type: "body" as const, text: `Matter ${caseRecord.matterNumber}` }] : []),
    ],
  });

  const summary = narrativeText("thirty-second-summary");
  if (summary) {
    slides.push({
      templateType: "content",
      title: "Case summary",
      elements: [{ type: "body", text: summary }],
    });
  }

  const medical = narrativeText("medical-story");
  if (medical) {
    slides.push({
      templateType: "content",
      title: "Medical journey",
      elements: [{ type: "body", text: medical }],
    });
  }

  const lifeImpact = narrativeText("life-impact-story");
  if (lifeImpact) {
    slides.push({
      templateType: "content",
      title: "Life impact",
      elements: [{ type: "body", text: lifeImpact }],
    });
  }

  const financial = narrativeText("financial-story");
  if (financial) {
    slides.push({
      templateType: "content",
      title: "Financial impact",
      elements: [{ type: "body", text: financial }],
    });
  }

  const beforeAfter = narrativeText("before-after");
  if (beforeAfter) {
    slides.push({
      templateType: "before-after",
      title: "Before vs. after",
      elements: [{ type: "body", text: beforeAfter }],
    });
  }

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

  for (const composition of includedCompositions) {
    slides.push({
      templateType: "claim",
      title: composition.claimTitle,
      elements: [
        { type: "body", text: composition.claimDescription },
        { type: "body", text: composition.attorneyResponse },
      ],
    });
  }

  const closing = narrativeText("closing-summary");
  if (closing) {
    slides.push({
      templateType: "closing",
      title: "Closing",
      elements: [{ type: "body", text: closing }],
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
          }))
        )
        .returning()
    : [];

  return NextResponse.json({ presentation, slides: created });
}
