import { pgTable, uuid, text, integer, timestamp, jsonb, boolean, date } from "drizzle-orm/pg-core";

export const cases = pgTable("cases", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientName: text("client_name"),
  caseName: text("case_name"),
  matterNumber: text("matter_number"),
  incidentDate: date("incident_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const importBatches = pgTable("import_batches", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),
  fileNames: jsonb("file_names").$type<string[]>().notNull(),
  totalRows: integer("total_rows").notNull(),
  importedCount: integer("imported_count").notNull(),
  skippedCount: integer("skipped_count").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const PARSE_STATUSES = ["ok", "unparsed-date"] as const;

export const medicalRecords = pgTable("medical_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),
  importBatchId: uuid("import_batch_id")
    .notNull()
    .references(() => importBatches.id, { onDelete: "cascade" }),
  rowIndex: integer("row_index").notNull(),
  sourceFileName: text("source_file_name").notNull(),
  parseStatus: text("parse_status", { enum: PARSE_STATUSES }).notNull(),
  rawValues: jsonb("raw_values").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const timelineEvents = pgTable("timeline_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),
  medicalRecordId: uuid("medical_record_id").references(() => medicalRecords.id, { onDelete: "set null" }),
  importBatchId: uuid("import_batch_id").references(() => importBatches.id, { onDelete: "set null" }),
  recordNumber: integer("record_number").notNull(),
  originalRowNumber: integer("original_row_number"),
  sourceFileName: text("source_file_name"),

  eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
  eventType: text("event_type").notNull().default("medical"),
  title: text("title"),
  summary: text("summary").notNull(),

  providers: jsonb("providers").$type<string[]>().notNull().default([]),
  facility: text("facility"),
  bodyParts: jsonb("body_parts").$type<string[]>().notNull().default([]),
  specialty: text("specialty"),
  recordType: text("record_type"),

  sourceType: text("source_type").notNull().default("excel-import"),
  sourceDocumentUrl: text("source_document_url"),

  severity: text("severity").notNull().default("routine"),
  daysFromIncident: integer("days_from_incident"),

  significance: text("significance").notNull().default("minor"),
  evidenceStrength: text("evidence_strength").notNull().default("missing"),
  verificationStatus: text("verification_status").notNull().default("unreviewed"),

  attorneyApproved: boolean("attorney_approved").notNull().default(false),
  presentationIncluded: boolean("presentation_included").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ───────────────  CLIENT CONTEXT  ─────────────── */

export const clientContextEntries = pgTable("client_context_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),

  content: text("content").notNull(),
  category: text("category").notNull().default("uncategorized"),
  sourceType: text("source_type").notNull().default("attorney"),
  sourceName: text("source_name"),
  eventDate: date("event_date"),

  verified: boolean("verified").notNull().default(false),
  aiUsable: boolean("ai_usable").notNull().default(true),
  confidential: boolean("confidential").notNull().default(false),

  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  relatedTimelineEventIds: jsonb("related_timeline_event_ids").$type<string[]>().notNull().default([]),
  relatedEvidenceIds: jsonb("related_evidence_ids").$type<string[]>().notNull().default([]),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ───────────────  STORY POINTS  ─────────────── */

export const storyPoints = pgTable("story_points", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),

  title: text("title").notNull(),
  description: text("description").notNull(),
  eventDate: date("event_date"),
  startDate: date("start_date"),
  endDate: date("end_date"),

  category: text("category").notNull().default("other"),
  beforeState: text("before_state"),
  afterState: text("after_state"),
  impactAmount: integer("impact_amount"),
  impactCurrency: text("impact_currency"),

  sourceContextIds: jsonb("source_context_ids").$type<string[]>().notNull().default([]),
  evidenceIds: jsonb("evidence_ids").$type<string[]>().notNull().default([]),
  relatedMedicalEventIds: jsonb("related_medical_event_ids").$type<string[]>().notNull().default([]),

  evidenceStrength: text("evidence_strength").notNull().default("missing"),
  significance: text("significance").notNull().default("medium"),

  aiGenerated: boolean("ai_generated").notNull().default(false),
  attorneyApproved: boolean("attorney_approved").notNull().default(false),
  presentationIncluded: boolean("presentation_included").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ───────────────  EVIDENCE  ─────────────── */

export const evidenceItems = pgTable("evidence_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),

  title: text("title").notNull(),
  category: text("category").notNull().default("other"),
  description: text("description").notNull().default(""),

  sourceDocumentUrl: text("source_document_url"),
  sourcePage: integer("source_page"),
  sourceExcerpt: text("source_excerpt"),

  eventDate: date("event_date"),
  providerOrAuthor: text("provider_or_author"),

  relatedTimelineEventIds: jsonb("related_timeline_event_ids").$type<string[]>().notNull().default([]),
  relatedStoryPointIds: jsonb("related_story_point_ids").$type<string[]>().notNull().default([]),

  strength: text("strength").notNull().default("moderate"),
  verificationStatus: text("verification_status").notNull().default("unreviewed"),
  reviewStatus: text("review_status").notNull().default("not-reviewed"),

  attorneyNotes: text("attorney_notes"),
  aiAnalysis: text("ai_analysis"),

  includedInPresentation: boolean("included_in_presentation").notNull().default(false),
  confidential: boolean("confidential").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ───────────────  EVIDENCE COMPOSITIONS  ─────────────── */

export const evidenceCompositions = pgTable("evidence_compositions", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),

  claimTitle: text("claim_title").notNull(),
  claimDescription: text("claim_description").notNull().default(""),

  supportingEvidenceIds: jsonb("supporting_evidence_ids").$type<string[]>().notNull().default([]),
  contradictingEvidenceIds: jsonb("contradicting_evidence_ids").$type<string[]>().notNull().default([]),
  missingEvidenceItems: jsonb("missing_evidence_items").$type<string[]>().notNull().default([]),

  aiReasoning: text("ai_reasoning").notNull().default(""),
  attorneyReasoning: text("attorney_reasoning").notNull().default(""),
  counterargument: text("counterargument").notNull().default(""),
  attorneyResponse: text("attorney_response").notNull().default(""),

  strengthScore: integer("strength_score").notNull().default(50),
  riskLevel: text("risk_level").notNull().default("moderate"),

  reviewStatus: text("review_status").notNull().default("draft"),
  includedInPresentation: boolean("included_in_presentation").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ───────────────  GENERATED NARRATIVES (STORY PAGE)  ─────────────── */

export const generatedNarratives = pgTable("generated_narratives", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),

  type: text("type").notNull(),
  aiDraft: text("ai_draft").notNull().default(""),
  attorneyVersion: text("attorney_version"),

  sourceEventIds: jsonb("source_event_ids").$type<string[]>().notNull().default([]),
  sourceContextIds: jsonb("source_context_ids").$type<string[]>().notNull().default([]),
  sourceEvidenceIds: jsonb("source_evidence_ids").$type<string[]>().notNull().default([]),

  status: text("status").notNull().default("draft"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ───────────────  PRESENTATIONS  ─────────────── */

export const presentations = pgTable("presentations", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),

  title: text("title").notNull().default("Untitled presentation"),
  purpose: text("purpose").notNull().default("trial"),
  audience: text("audience").notNull().default("jury"),
  status: text("status").notNull().default("draft"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const presentationSlides = pgTable("presentation_slides", {
  id: uuid("id").defaultRandom().primaryKey(),
  presentationId: uuid("presentation_id")
    .notNull()
    .references(() => presentations.id, { onDelete: "cascade" }),

  order: integer("order").notNull().default(0),
  templateType: text("template_type").notNull().default("content"),
  title: text("title").notNull().default(""),

  elements: jsonb("elements").$type<PresentationElement[]>().notNull().default([]),
  presenterNotes: text("presenter_notes"),
  attorneyApproved: boolean("attorney_approved").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export interface PresentationElement {
  type: "heading" | "body" | "bullets" | "stat" | "quote" | "image";
  text?: string;
  items?: string[];
  label?: string;
  value?: string;
  sourceRecordNumbers?: number[];
}
