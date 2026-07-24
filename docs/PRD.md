# Updated Product Requirements Document

## CaseIQ — From Medical Timeline to Courtroom Case Story

## 1. Current product baseline

The current CaseIQ prototype already provides a strong foundation:

* One medical chronology can be loaded from Excel.
* Medical events are displayed on a horizontal timeline.
* Events can be filtered by period, specialty, body part, provider, facility, and record type.
* Treatment gaps are visually identified.
* The interface displays headline metrics such as event count, treatment days, gaps, and phases.
* Selecting an event displays the date, provider, record type, source, and medical summary.
* Initial placeholders exist for:

  * Story generation
  * Five biggest moments
  * Stress testing
  * AI questions
* The visual style is restrained and professional.

The next version should **extend this product rather than replace it**.

The central shift is:

> CaseIQ currently visualizes a medical chronology. The next version must create, manage, and present the complete client story.

---

# 2. Source data currently available

The supplied Excel workbook contains one sheet, **Medical Chronology**, with 137 medical records across 47 unique encounter dates.

The chronology covers approximately:

* First encounter: 7 December 2024
* Last encounter: 5 May 2026
* 47 unique treatment dates
* 137 source records

The current columns are:

```text
Encounter Date
Primary Provider
Facility
Body Parts
Medicine Type
Record Type
Summary
Link To Pdf
```

The prototype currently displays 130 events, so the developer should verify why seven workbook rows are not represented. Possible causes include filtering, excluded rows, deduplication, parsing failure, or blank/invalid records. This should not be silently assumed.

The dataset contains, among others:

* 67 encounter notes
* 12 imaging reports
* 9 administrative records
* Physical therapy notes and evaluations
* Operative records
* Progress notes
* Patient education and discharge materials

The most frequent treatment categories include:

* Orthopedic
* Physical Therapy
* Emergency Medicine
* Radiology
* Internal Medicine
* Anesthesiology

The current Excel provides **medical information only**. It does not contain structured fields for:

* Client biography
* Life before the incident
* Hobbies
* Family responsibilities
* Employment losses
* Financial losses
* Missed life events
* Witness evidence
* Attorney interpretation
* Evidentiary strength
* Presentation content
* Case status
* Multiple clients

These elements must therefore be stored separately and linked to the imported chronology.

---

# 3. Product objective

Build a polished, multi-page legal case workspace where an attorney can:

1. Manage multiple clients and cases.
2. Import and visualize structured medical chronology data.
3. Continuously add unstructured information about the client.
4. Add life events and story points to the same timeline.
5. Review and organize supporting evidence.
6. Edit an AI-generated evidence composition.
7. Generate an editable courtroom presentation.
8. present the timeline interactively, including zooming into source evidence.
9. Export a jury-ready presentation to PDF and, later, PowerPoint.

The medical timeline remains the visual center of the product, but it becomes one part of a larger case workspace.

---

# 4. Recommended navigation architecture

The current single-page layout should become a proper application shell.

## Global navigation

```text
CaseIQ
├── Cases
├── Active Cases
├── Recent Cases
└── Settings
```

## Case-level navigation

After selecting a case:

```text
Overview
Timeline
Client Context
Evidence
Evidence Composition
Story
Presentation
Documents
Ask the Record
```

The header must always show:

* Client name
* Matter name or number
* Case status
* Assigned attorney
* Last saved status
* Case switcher

Example:

```text
Caldwell v. [Defendant]
Matter PI-2026-0017
Trial Preparation
Saved 12 seconds ago
```

The current buttons for **Exhibit**, **API Key**, and **New Case** can remain, but they should be repositioned within a clearer application structure.

---

# 5. Phase 1 — Preserve and improve the existing timeline

## 5.1 Existing medical event mapping

Map the Excel fields as follows:

| Excel field      | Application field   |
| ---------------- | -------------------- |
| Encounter Date   | `eventDate`         |
| Primary Provider | `providers[]`       |
| Facility         | `facility`          |
| Body Parts       | `bodyParts[]`       |
| Medicine Type    | `specialty`         |
| Record Type      | `recordType`        |
| Summary          | `summary`           |
| Link To Pdf      | `sourceDocumentUrl` |

Each imported row should retain:

* Original row number
* Import batch ID
* Raw source values
* Import timestamp
* Parsing status

This makes it possible to debug missing or malformed events.

## 5.2 Timeline event model

```typescript
type TimelineEvent = {
  id: string;
  caseId: string;

  eventDate: string;
  endDate?: string;

  eventType: "medical" | "life-impact" | "financial" | "legal";
  title: string;
  summary: string;

  providers?: string[];
  facility?: string;
  bodyParts?: string[];
  specialty?: string;
  recordType?: string;

  sourceType:
    | "excel-import"
    | "client-context"
    | "attorney-entry"
    | "document"
    | "ai-suggestion";

  sourceDocumentId?: string;
  sourceDocumentUrl?: string;
  sourcePage?: number;
  sourceExcerpt?: string;

  significance: "minor" | "moderate" | "major";
  evidenceStrength: "strong" | "moderate" | "weak" | "missing";
  verificationStatus: "unreviewed" | "verified" | "disputed";

  attorneyApproved: boolean;
  presentationIncluded: boolean;

  originalRowNumber?: number;
  importBatchId?: string;

  createdAt: string;
  updatedAt: string;
};
```

---

# 6. Timeline hover legend

The dots currently require clearer context.

Hovering over any timeline dot must display a tooltip.

## Medical event tooltip

```text
PHYSICAL THERAPY PROGRESS NOTE

March 14, 2025
Fremont Total Rehab
Holly Knisely, PT

Left shoulder and neck pain remained 4/10.
Sleep remained disturbed and grip weakness persisted.

Evidence: Source medical record
Status: Verified
Click to inspect
```

## Story event tooltip

```text
STOPPED COACHING YOUTH FOOTBALL

April 2025
Life Impact — Hobbies and Family

The client reports being unable to stand through practice
or demonstrate exercises because of shoulder and neck pain.

Evidence: Client statement only
Status: Needs supporting evidence
Click to inspect
```

## Tooltip requirements

Display:

* Event category
* Event title
* Date
* Provider or source
* One-to-three-line summary
* Evidence strength
* Verification state
* Source availability
* "Click to inspect"

Tooltips should remain compact and should not obscure the rest of the timeline.

---

# 7. Timeline visual legend

Add a persistent legend above or below the timeline.

## Event category indicators

* Medical event
* Life-impact event
* Financial event
* Legal milestone
* Attorney-created event
* AI-suggested event

## Status indicators

* Green: verified or strongly supported
* Amber: incomplete or partially supported
* Red: contradicted, missing, or high-risk
* Grey: unreviewed
* Blue or neutral accent: medical event category

Do not use red and green for decorative styling. They should communicate status only.

Do not rely on color alone; include icons, patterns, or labels.

---

# 8. Add story points directly to the timeline

The current timeline represents treatment density but not the consequences of the injury.

The updated timeline should provide multiple aligned lanes.

```text
Medical Treatment
Life Impact
Work and Financial Impact
Legal Milestones
Evidence
```

All lanes share the same date axis.

## Example

```text
DEC 2024              MAR 2025                JUL 2025

MEDICAL
Accident → ER → Orthopedics → PT → MRI → Surgery

LIFE IMPACT
Unable to drive → Stopped coaching → Required household help

WORK/FINANCIAL
Medical leave → Reduced hours → Lost overtime income
```

## Story point model

```typescript
type StoryPoint = {
  id: string;
  caseId: string;

  title: string;
  description: string;

  date?: string;
  startDate?: string;
  endDate?: string;

  category:
    | "work"
    | "financial"
    | "family"
    | "hobby"
    | "mobility"
    | "sleep"
    | "mental-health"
    | "daily-life"
    | "independence"
    | "other";

  beforeState?: string;
  afterState?: string;

  impactAmount?: number;
  impactCurrency?: string;

  sourceContextIds: string[];
  evidenceIds: string[];
  relatedMedicalEventIds: string[];

  evidenceStrength: "strong" | "moderate" | "weak" | "missing";
  significance: "low" | "medium" | "high";

  aiGenerated: boolean;
  attorneyApproved: boolean;
  presentationIncluded: boolean;

  createdAt: string;
  updatedAt: string;
};
```

## Story point creation

An attorney should be able to:

* Add a story event manually.
* Convert a client context note into a story point.
* Accept an AI-suggested story point.
* Link a story point to one or more medical events.
* Link supporting evidence.
* Add a before-versus-after comparison.
* Add a financial value.
* Mark it as a major story moment.
* Include it in the courtroom presentation.

AI-generated story points must remain drafts until approved.

---

# 9. Client Context page

## Purpose

The current dataset only tells the medical story. Attorneys need a place to continuously add everything else they learn about the client.

This should be an ongoing case-intelligence feed, not a long one-time intake form.

## Primary interaction

Provide a large input box:

> Add new information about the client, their life, treatment, work, family, finances, recovery, or current limitations.

The attorney should be able to enter information in natural language.

Example:

> Caldwell used to coach his son's football team every Saturday. Since March, he has stopped attending because he cannot stand for more than twenty minutes. His wife now attends alone.

## Context entry model

```typescript
type ClientContextEntry = {
  id: string;
  caseId: string;

  content: string;

  category:
    | "life-before"
    | "incident"
    | "medical"
    | "work"
    | "financial"
    | "family"
    | "hobbies"
    | "mobility"
    | "mental-health"
    | "daily-life"
    | "current-condition"
    | "future-concern"
    | "witness"
    | "attorney-strategy"
    | "uncategorized";

  sourceType:
    | "client"
    | "attorney"
    | "family"
    | "employer"
    | "witness"
    | "document"
    | "other";

  sourceName?: string;
  eventDate?: string;

  verified: boolean;
  aiUsable: boolean;
  confidential: boolean;

  tags: string[];

  relatedTimelineEventIds: string[];
  relatedEvidenceIds: string[];

  createdBy: string;
  createdAt: string;
  updatedAt: string;
};
```

## Context entry actions

* Edit
* Delete
* Mark verified
* Exclude from AI
* Mark confidential
* Convert to story point
* Convert to financial loss
* Convert to evidence item
* Add to timeline
* Link to medical events
* Attach a document

## AI processing

After a note is saved, AI may suggest:

```text
Potential story point:
Stopped coaching youth football

Potential evidence:
Statement from spouse
Statement from team organizer
Photographs or attendance records

Potential follow-up:
When did Caldwell stop coaching?
Has he attempted to return?
Was coaching paid or voluntary?
```

The attorney chooses which suggestions to accept.

---

# 10. AI context architecture

AI requests must use more than the currently selected medical record.

The case context assembled for an AI task should contain:

```typescript
type CaseAIContext = {
  caseMetadata: Case;
  medicalEvents: TimelineEvent[];
  approvedStoryPoints: StoryPoint[];
  approvedClientContext: ClientContextEntry[];
  evidenceItems: EvidenceItem[];
  evidenceCompositions: EvidenceComposition[];
  approvedNarratives: GeneratedNarrative[];
};
```

Context rules:

* Include only entries with `aiUsable: true`.
* Do not include confidential attorney strategy in jury content.
* Clearly distinguish verified facts from client-reported statements.
* Include source IDs with every generated factual assertion.
* Do not treat an AI inference as a case fact.
* Use retrieval or selective context building instead of inserting the entire case into every request.

---

# 11. The Story section

The existing **Generate Narrative** area should become a complete editable page.

## Outputs

* 30-second case summary
* Medical journey
* Life-impact story
* Financial-impact story
* Five defining moments
* Current condition
* Before-versus-after summary
* Main strengths
* Main vulnerabilities

## Narrative status

Every output must display:

```text
AI Draft
Attorney Edited
Attorney Approved
```

## Narrative model

```typescript
type GeneratedNarrative = {
  id: string;
  caseId: string;

  type:
    | "thirty-second-summary"
    | "medical-story"
    | "life-impact-story"
    | "financial-story"
    | "before-after"
    | "opening-overview"
    | "closing-summary";

  aiDraft: string;
  attorneyVersion: string;

  sourceEventIds: string[];
  sourceContextIds: string[];
  sourceEvidenceIds: string[];

  status: "draft" | "edited" | "approved";

  createdAt: string;
  updatedAt: string;
};
```

Clicking a sentence should ideally show which sources support it.

---

# 12. Evidence list

## Purpose

Create a central inventory of all evidence, including medical records and non-medical evidence added later.

The existing source link on each medical event should remain, but it should connect to a proper evidence workspace.

## Evidence categories

* Medical record
* Imaging
* Operative report
* Expert opinion
* Employment record
* Payroll or income record
* Client statement
* Witness statement
* Photograph
* Video
* Police report
* Insurance record
* Financial document
* Digital evidence
* Other

## Evidence model

```typescript
type EvidenceItem = {
  id: string;
  caseId: string;

  title: string;
  category: EvidenceCategory;
  description: string;

  sourceDocumentId?: string;
  sourceDocumentUrl?: string;
  sourcePage?: number;
  sourceExcerpt?: string;

  date?: string;
  providerOrAuthor?: string;

  relatedTimelineEventIds: string[];
  relatedStoryPointIds: string[];
  relatedClaimIds: string[];

  supportsClaims: string[];
  contradictsClaims: string[];

  strength: "strong" | "moderate" | "weak" | "missing";
  verificationStatus: "unreviewed" | "verified" | "disputed";
  reviewStatus: "not-reviewed" | "in-review" | "approved";

  attorneyNotes?: string;
  aiAnalysis?: string;

  includedInPresentation: boolean;
  confidential: boolean;

  createdAt: string;
  updatedAt: string;
};
```

## Evidence page columns

```text
Status
Evidence
Category
Date
Source
Related story or claim
Strength
Verification
Presentation
```

## Required interactions

* Search
* Filter
* Sort
* Edit
* Open source
* Mark verified
* Mark disputed
* Add notes
* Connect to story point
* Connect to timeline event
* Include in presentation
* Exclude from AI or presentation

---

# 13. Evidence Composition page

This page helps the attorney study how individual evidence items work together.

It should not merely repeat the evidence list.

## Example composition

### Claim

**The collision caused a lasting left shoulder injury.**

### Supporting evidence — green

* Emergency department report documenting shoulder pain
* Orthopedic assessment
* Physical therapy records
* Imaging findings
* Surgical recommendation
* Postoperative restrictions

### Contradicting or risky evidence — red

* Earlier notes reporting lower pain
* Treatment gap
* Pre-existing shoulder symptoms

### Missing evidence — amber

* Explicit causation opinion
* Employer confirmation of physical limitations
* Spouse testimony regarding daily activities

### AI draft reasoning

> The sequence of immediate complaints, continuing treatment, objective findings, and functional limitations supports a continuous causal narrative. However, the treatment gap and absence of an explicit causation opinion may be challenged.

The attorney must be able to edit every section.

## Composition model

```typescript
type EvidenceComposition = {
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

  reviewStatus: "draft" | "reviewed" | "approved";
  includedInPresentation: boolean;

  createdAt: string;
  updatedAt: string;
};
```

---

# 14. Multi-case persistence and switching

The current **New Case** button should become part of complete multi-case management.

## Case data model

```typescript
type Case = {
  id: string;
  firmId: string;

  clientName: string;
  caseName: string;
  matterNumber: string;

  incidentDate: string;
  trialDate?: string;

  assignedAttorney?: string;

  status:
    | "intake"
    | "active-treatment"
    | "discovery"
    | "mediation"
    | "trial-preparation"
    | "trial"
    | "closed";

  profileCompletion: number;
  evidenceCompletion: number;
  presentationStatus: "not-started" | "draft" | "reviewed" | "ready";

  riskStatus: "low" | "moderate" | "high";

  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
};
```

## Case switcher

Place the case name in the header.

Clicking it opens:

* Search
* Recently opened cases
* Pinned cases
* All active cases
* Create new case

Switching a case must update:

* Timeline
* Filters
* Summary
* Evidence
* Story
* Client context
* Presentation
* AI chat context

No state from the previous client may leak into the next case.

---

# 15. Autosave and saved sessions

All attorney-created or edited content must be persisted.

## Save behavior

* Debounce text saves by approximately 1 second.
* Save timeline filters and current zoom level.
* Save the last open page for each case.
* Save presentation editing state.
* Save open evidence composition draft.
* Store local fallback drafts during connection failure.

Display:

```text
Saving…
Saved
Save failed — working from local draft
```

## Session model

```typescript
type UserCaseSession = {
  userId: string;
  caseId: string;

  lastRoute: string;
  selectedTimelineEventId?: string;
  timelineFilters?: Record<string, unknown>;
  timelineZoom?: number;
  timelineScrollPosition?: number;

  lastOpenedAt: string;
};
```

---

# 16. Active Cases overview

Add a proper landing page instead of opening directly into one chronology.

## Top-level metrics

* Active cases
* Cases in trial preparation
* Missing evidence alerts
* Presentations ready
* Cases updated this week

## Case table

```text
Client
Matter
Status
Incident date
Treatment records
Last update
Client context
Evidence
Presentation
Risk
```

## Example indicators

```text
Caldwell
Trial Preparation
137 medical records
Client context: 45% — amber
Evidence: Needs review — red
Presentation: Draft — amber
```

## Quick actions

* Open case
* View timeline
* Continue presentation
* Review missing evidence

---

# 17. UI and UX update

The current visual style is a useful starting point, but the product currently feels like a single analytical page.

The updated interface should retain its professional restraint while improving usability.

## Keep

* Neutral background
* Strong typography
* Minimal use of color
* Timeline as the visual centerpiece
* Compact filters
* Treatment gap visualization
* Source links
* Technical, professional tone

## Improve

* Increase contrast for labels and body text.
* Increase font size in summaries and controls.
* Reduce excessive letter spacing in utility labels.
* Create a stronger active navigation state.
* Separate global navigation from case navigation.
* Add proper page headers and breadcrumbs.
* Use clear cards or sections where hierarchy is needed.
* Add consistent buttons, forms, empty states, and dialogs.
* Make the selected timeline event more prominent.
* Add visible status labels beside red, amber, and green indicators.
* Make the event detail section a side drawer so the timeline remains visible.
* Use skeleton loaders while AI content is generated.
* Add errors, warnings, and confirmation states.

## Recommended stack

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Radix UI
* Lucide icons
* TanStack Query
* React Hook Form
* Zod
* Zustand for transient UI state

For the timeline, preserve the existing implementation where possible. A full rewrite should only happen if the current timeline cannot support lanes, zooming, story events, and interactive presentation mode.

---

# 18. Presentation editor

## Purpose

Allow the attorney to build and edit a jury-facing presentation using the same case data.

The presentation editor should produce both:

* An interactive courtroom experience
* A downloadable fallback document

## Editor layout

### Left panel

Slide thumbnails:

* Add
* Delete
* Duplicate
* Reorder
* Rename

### Center

Editable slide canvas.

### Right panel

Case content library:

* Approved story points
* Timeline events
* Evidence items
* Document excerpts
* Before-and-after comparisons
* Financial losses
* Approved narratives
* Images

## Slide types

* Title
* Client introduction
* Life before the incident
* Incident
* Medical journey
* Interactive timeline
* Key medical event
* Key evidence
* Life impact
* Hobbies lost
* Work impact
* Financial loss
* Family impact
* Before versus after
* Current condition
* Closing summary

---

# 19. AI presentation generator

Add a button:

**Generate Jury Presentation**

## Generation settings

```text
Purpose:
Trial / Mediation / Settlement conference

Audience:
Jury / Judge / Mediator

Duration:
5 / 10 / 20 / 30 minutes

Focus:
Medical journey
Life impact
Financial loss
Causation
Full story

Maximum slides:
User selectable
```

The AI must use only:

* Attorney-approved facts
* Verified evidence
* Approved story points
* Approved narratives

The generator should return a structured presentation, not uneditable HTML.

```typescript
type Presentation = {
  id: string;
  caseId: string;

  title: string;
  purpose: "trial" | "mediation" | "settlement";
  audience: "jury" | "judge" | "mediator";

  status: "draft" | "reviewed" | "approved";

  slides: PresentationSlide[];

  createdAt: string;
  updatedAt: string;
};
```

```typescript
type PresentationSlide = {
  id: string;
  presentationId: string;

  order: number;
  templateType: string;
  title: string;

  elements: PresentationElement[];
  presenterNotes?: string;

  attorneyApproved: boolean;
};
```

---

# 20. Interactive courtroom presentation

The interactive presentation should go beyond PowerPoint.

## Jury View

When the attorney starts **Jury View**:

* Hide navigation and editing controls.
* Use full-screen mode.
* Use large, high-contrast typography.
* Display one idea at a time.
* Allow keyboard and click navigation.
* Allow the timeline to zoom and pan.
* Allow an event to expand into its evidence.
* Allow one-click return to the full timeline.
* Dim non-relevant events.
* Show only attorney-approved material.
* Never show internal notes, AI labels, risk scores, or contradictory evidence unless deliberately included.

## Timeline interaction during presentation

Example flow:

1. Show the complete treatment journey.
2. Select the first emergency encounter.
3. Zoom into the December 2024 records.
4. Display a source excerpt.
5. Return to the timeline.
6. Highlight the treatment gap.
7. Move to the life-impact lane.
8. Show when the client stopped a hobby or stopped working.
9. Show the corresponding medical evidence.
10. End with a before-versus-after summary.

---

# 21. Presentation export

## MVP requirement

* PDF export

## Next requirement

* PowerPoint `.pptx` export

## Suggested libraries

* `pptxgenjs` for PowerPoint
* Browser print or `Playwright` PDF generation
* `pdf-lib` when PDF post-processing is necessary
* SVG or image snapshots for complex timeline states

## Export validation

Before export, verify that:

* Every slide is approved.
* No internal notes are included.
* No confidential client-context entries are shown.
* No unapproved AI claims are present.
* Every evidence excerpt has a source reference.
* Broken document links are flagged.
* Missing images are flagged.
* The presentation does not contain hidden attorney-only content.

---

# 22. Updated page routes

Suggested Next.js routes:

```text
/cases
/cases/new

/cases/[caseId]/overview
/cases/[caseId]/timeline
/cases/[caseId]/context
/cases/[caseId]/evidence
/cases/[caseId]/evidence-composition
/cases/[caseId]/story
/cases/[caseId]/presentation
/cases/[caseId]/documents
/cases/[caseId]/ask
```

Presentation routes:

```text
/cases/[caseId]/presentations
/cases/[caseId]/presentations/new
/presentations/[presentationId]/edit
/presentations/[presentationId]/present
```

---

# 23. Suggested database structure

```text
firms
users
cases
case_members

import_batches
medical_records
timeline_events

client_context_entries
story_points

documents
evidence_items
evidence_compositions

generated_narratives

presentations
presentation_slides
presentation_elements

user_case_sessions
case_activity_log
```

Keep imported medical records separate from normalized timeline events.

```text
medical_records
    ↓ normalized into
timeline_events
```

This protects the source data while allowing attorneys to edit the presentation version without overwriting the imported chronology.

---

# 24. AI functions

```text
POST /api/cases/:caseId/ai/generate-summary
POST /api/cases/:caseId/ai/extract-story-points
POST /api/cases/:caseId/ai/suggest-follow-up-questions
POST /api/cases/:caseId/ai/analyze-evidence
POST /api/cases/:caseId/ai/generate-evidence-composition
POST /api/cases/:caseId/ai/generate-presentation
```

Every AI endpoint should return JSON validated with Zod.

Example story-point response:

```typescript
const StoryPointSuggestionSchema = z.object({
  title: z.string(),
  category: z.enum([
    "work",
    "financial",
    "family",
    "hobby",
    "mobility",
    "sleep",
    "mental-health",
    "daily-life",
    "independence",
    "other"
  ]),
  date: z.string().nullable(),
  description: z.string(),
  beforeState: z.string().nullable(),
  afterState: z.string().nullable(),
  supportingSourceIds: z.array(z.string()),
  missingEvidence: z.array(z.string()),
  confidence: z.number().min(0).max(1)
});
```

---

# 25. Revised development priorities

## Priority 0 — Stabilize the current dataset

* Verify why the app shows 130 events while the workbook contains 137 records.
* Preserve the existing timeline.
* Confirm all source links.
* Add import error reporting.
* Store raw row numbers and import batch IDs.

## Priority 1 — Demo-critical product structure

* Multi-page application shell
* Active Cases page
* Case switcher
* Persistent cases and sessions
* Cleaner UI hierarchy
* Timeline hover tooltips
* Red, amber, and green status indicators

## Priority 2 — Complete client story

* Client Context page
* Unstructured entry input
* Story point extraction
* Life-impact timeline lane
* Work and financial timeline lane
* Story point approval flow

## Priority 3 — Evidence intelligence

* Evidence list
* Evidence editing
* Links between evidence, story points, and medical events
* Evidence Composition page
* Claim strength and risk indicators

## Priority 4 — Court presentation

* Presentation editor
* AI presentation generator
* Interactive Jury View
* Timeline zoom during presentation
* Evidence excerpt display
* PDF export

## Post-demo

* PowerPoint export
* Similar successful cases
* Moot Court AI
* Collaboration
* Role permissions
* Version history
* Audit reports

---

# 26. Updated demo scenario using Caldwell

The existing Caldwell chronology should remain the main demonstration case.

## Suggested demo flow

### 1. Active Cases

Open the Active Cases page and select Caldwell.

Show that the firm can manage multiple cases rather than one isolated timeline.

### 2. Overview

Display:

* 137 imported medical records
* 47 unique treatment dates
* Current phase
* Treatment gaps
* Missing client context
* Evidence review status
* Presentation status

### 3. Timeline

Show the current medical timeline.

Hover over a medical dot to reveal the tooltip.

Turn on the **Life Impact** lane.

Show an attorney-created event such as:

> Stopped coaching his child's sports team.

Connect that event to relevant treatment records.

### 4. Client Context

Add a free-form note about work, family, or a lost hobby.

Show AI suggesting:

* A new story point
* Supporting evidence
* Follow-up questions

Approve the story point and show it appear on the timeline.

### 5. Evidence Composition

Open one claim and show:

* Supporting evidence in green
* Missing evidence in amber
* Contradicting information in red
* Editable AI reasoning

### 6. Presentation

Click **Generate Jury Presentation**.

Open Jury View.

Show the complete timeline, zoom into one medical event, reveal the source excerpt, return to the timeline, and highlight the corresponding life disruption.

### 7. Export

Show the PDF export action.

---

# 27. Acceptance criteria

The next version is successful when:

* All valid Caldwell workbook rows are imported or explicitly reported as excluded.
* The attorney can create and switch between multiple cases.
* Work remains saved after refreshing the browser.
* An Active Cases page displays the status of all matters.
* The selected case is always visible in the header.
* Attorneys can add unstructured client information.
* Client context can be converted into a story point.
* Medical events and life-impact events appear on the same timeline.
* Hovering over every timeline dot displays an informative tooltip.
* The timeline has a visible category and status legend.
* Evidence can be searched, reviewed, edited, and linked.
* Evidence compositions can be edited and approved.
* Red, amber, and green indicators communicate clear statuses.
* Attorneys can generate and edit a jury presentation.
* Jury View supports full-screen timeline zoom and evidence inspection.
* A presentation can be exported as PDF.
* No unapproved AI content or confidential attorney notes appear in jury-facing output.
