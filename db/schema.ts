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
