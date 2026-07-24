import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { cases, importBatches, medicalRecords, timelineEvents } from "@/db/schema";
import type { MedicalEvent, MergedImport } from "@/types";

interface ImportRequestBody extends MergedImport {
  caseId?: string;
  clientName?: string;
  matterNumber?: string;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as ImportRequestBody | null;

  if (!body || !Array.isArray(body.events) || !Array.isArray(body.undated) || !Array.isArray(body.fileNames)) {
    return NextResponse.json({ error: "Invalid import payload." }, { status: 400 });
  }

  let caseId = body.caseId;

  if (caseId) {
    const [existing] = await db.select().from(cases).where(eq(cases.id, caseId)).limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Case not found." }, { status: 404 });
    }
  } else {
    const [newCase] = await db
      .insert(cases)
      .values({
        clientName: body.clientName ?? null,
        caseName: body.clientName ?? body.fileNames[0]?.replace(/\.[^.]+$/, "") ?? "Untitled case",
        matterNumber: body.matterNumber ?? null,
      })
      .returning();
    caseId = newCase.id;
  }

  const importedCount = body.events.length;
  const skippedCount = body.totalRows - importedCount;

  const [batch] = await db
    .insert(importBatches)
    .values({
      caseId,
      fileNames: body.fileNames,
      totalRows: body.totalRows,
      importedCount,
      skippedCount,
    })
    .returning();

  const allRows: MedicalEvent[] = [...body.events, ...body.undated];

  if (allRows.length) {
    await db.insert(medicalRecords).values(
      allRows.map((event) => ({
        caseId: caseId!,
        importBatchId: batch.id,
        rowIndex: event.rowIndex,
        sourceFileName: event.sourceFileName,
        parseStatus: event.date ? ("ok" as const) : ("unparsed-date" as const),
        rawValues: event,
      }))
    );
  }

  if (body.events.length) {
    await db.insert(timelineEvents).values(
      body.events.map((event) => ({
        caseId: caseId!,
        importBatchId: batch.id,
        recordNumber: event.recordNumber,
        originalRowNumber: event.rowIndex,
        sourceFileName: event.sourceFileName,
        eventDate: new Date(event.date as unknown as string),
        title: event.recordType,
        summary: event.summary,
        providers: event.providers,
        facility: event.facility,
        bodyParts: event.bodyParts,
        specialty: event.medicineType,
        recordType: event.recordType,
        sourceDocumentUrl: event.pdfUrl,
        severity: event.severity,
        daysFromIncident: event.daysFromIncident,
      }))
    );
  }

  return NextResponse.json({
    caseId,
    fileNames: body.fileNames,
    totalRows: body.totalRows,
    importedCount,
    skippedCount,
  });
}
