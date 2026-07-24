export type Severity = "critical" | "major" | "moderate" | "routine" | "admin";

export interface MedicalEvent {
  id: string;
  /** Case-scoped citation anchor — unique across every file ever imported into this case. */
  recordNumber: number;
  /** Original row in the source workbook. Provenance only — not unique across files. */
  rowIndex: number;
  sourceFileName: string;
  date: Date | null;
  dateRaw: string;
  providers: string[];
  facility: string | null;
  bodyParts: string[];
  medicineType: string | null;
  recordType: string | null;
  summary: string;
  pdfUrl: string | null;
  severity: Severity;
  daysFromIncident: number | null;
  importBatchId?: string;
  parseStatus?: "ok" | "unparsed-date";
}

export interface ParseWarning {
  kind: "missing-column" | "unparsed-date" | "empty-row" | "header-unmapped";
  detail: string;
  count?: number;
}

export interface ParseResult {
  events: MedicalEvent[];
  undated: MedicalEvent[];
  warnings: ParseWarning[];
  columnMap: Record<string, string>;
  totalRows: number;
  fileName: string;
}

/** The outcome of merging one or more ParseResults into a single case-scoped import. */
export interface MergedImport {
  events: MedicalEvent[];
  undated: MedicalEvent[];
  warnings: ParseWarning[];
  totalRows: number;
  fileNames: string[];
}

export interface ImportDiagnostics {
  fileNames: string[];
  totalRows: number;
  importedCount: number;
  skippedCount: number;
}

export interface CaseRecord {
  id: string;
  clientName: string | null;
  caseName: string | null;
  matterNumber: string | null;
  incidentDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CaseDraft {
  clientName: string;
  matterNumber?: string;
}

export interface ClientContextEntry {
  id: string;
  caseId: string;
  content: string;
  category: string;
  sourceType: string;
  sourceName: string | null;
  eventDate: string | null;
  verified: boolean;
  aiUsable: boolean;
  confidential: boolean;
  tags: string[];
  relatedTimelineEventIds: string[];
  relatedEvidenceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContextSuggestion {
  storyPointTitle: string;
  storyPointDescription: string;
  followUpQuestions: string[];
  suggestedEvidence: string[];
}

export type EvidenceStrength = "strong" | "moderate" | "weak" | "missing";
export type VerificationStatus = "unreviewed" | "verified" | "disputed";
export type ReviewStatus = "not-reviewed" | "in-review" | "approved" | "draft" | "reviewed";

export interface StoryPoint {
  id: string;
  caseId: string;
  title: string;
  description: string;
  eventDate: string | null;
  startDate: string | null;
  endDate: string | null;
  category: string;
  beforeState: string | null;
  afterState: string | null;
  impactAmount: number | null;
  impactCurrency: string | null;
  sourceContextIds: string[];
  evidenceIds: string[];
  relatedMedicalEventIds: string[];
  evidenceStrength: EvidenceStrength;
  significance: "low" | "medium" | "high";
  aiGenerated: boolean;
  attorneyApproved: boolean;
  presentationIncluded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceItem {
  id: string;
  caseId: string;
  title: string;
  category: string;
  description: string;
  sourceDocumentUrl: string | null;
  sourcePage: number | null;
  sourceExcerpt: string | null;
  eventDate: string | null;
  providerOrAuthor: string | null;
  relatedTimelineEventIds: string[];
  relatedStoryPointIds: string[];
  strength: EvidenceStrength;
  verificationStatus: VerificationStatus;
  reviewStatus: ReviewStatus;
  attorneyNotes: string | null;
  aiAnalysis: string | null;
  includedInPresentation: boolean;
  confidential: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceComposition {
  id: string;
  caseId: string;
  claimTitle: string;
  claimDescription: string;
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
  missingEvidenceItems: string[];
  aiReasoning: string;
  attorneyReasoning: string;
  counterargument: string;
  attorneyResponse: string;
  strengthScore: number;
  riskLevel: "low" | "moderate" | "high";
  reviewStatus: ReviewStatus;
  includedInPresentation: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NarrativeType =
  | "thirty-second-summary"
  | "medical-story"
  | "life-impact-story"
  | "financial-story"
  | "before-after"
  | "opening-overview"
  | "closing-summary";

export interface GeneratedNarrative {
  id: string;
  caseId: string;
  type: NarrativeType;
  aiDraft: string;
  attorneyVersion: string | null;
  sourceEventIds: string[];
  sourceContextIds: string[];
  sourceEvidenceIds: string[];
  status: "draft" | "edited" | "approved";
  createdAt: string;
  updatedAt: string;
}

export interface PresentationElement {
  type: "heading" | "body" | "bullets" | "stat" | "quote" | "image";
  text?: string;
  items?: string[];
  label?: string;
  value?: string;
  sourceRecordNumbers?: number[];
}

export interface PresentationSlide {
  id: string;
  presentationId: string;
  order: number;
  templateType: string;
  title: string;
  elements: PresentationElement[];
  presenterNotes: string | null;
  attorneyApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Presentation {
  id: string;
  caseId: string;
  title: string;
  purpose: "trial" | "mediation" | "settlement";
  audience: "jury" | "judge" | "mediator";
  status: "draft" | "reviewed" | "approved";
  createdAt: string;
  updatedAt: string;
}
