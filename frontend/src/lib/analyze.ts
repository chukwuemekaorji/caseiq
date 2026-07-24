import type { MedicalEvent, Severity } from "../types";

/* ─────────────────────────  SEVERITY  ───────────────────────── */

/**
 * Clinical vocabulary, not case-specific facts. Ordered by weight —
 * first match wins. Attorneys can override any classification in the UI.
 */
const SEVERITY_RULES: { severity: Severity; patterns: RegExp }[] = [
  {
    severity: "critical",
    patterns:
      /\b(operative report|surgery|surgical|arthroplasty|fusion|discectomy|laminectomy|acdf|amputation|craniotomy|admitted|inpatient|hospitali[sz]ation|icu|trauma activation)\b/i,
  },
  {
    severity: "major",
    patterns:
      /\b(mri|ct scan|ct report|computed tomography|emg|myelogram|injection|nerve block|epidural|steroid inject|arthrogram|ambulance|ems|emergency department|emergency room|\ber\b|fracture|herniat|rupture)\b/i,
  },
  {
    severity: "moderate",
    patterns:
      /\b(x-ray|xray|radiograph|imaging|consultation|specialist|orthopedic|neurosurg|independent medical exam|ime|physical therapy evaluation|work ability|disability|referral)\b/i,
  },
  {
    severity: "admin",
    patterns:
      /\b(telephone|phone call|reminder call|voicemail|billing|authori[sz]ation|insurance|medication list|patient education|administrative|records request|no.?show|cancelled|questionnaire)\b/i,
  },
];

export function classifySeverity(event: MedicalEvent): Severity {
  const haystack = `${event.recordType ?? ""} ${event.medicineType ?? ""} ${event.summary.slice(0, 400)}`;
  for (const rule of SEVERITY_RULES) {
    if (rule.patterns.test(haystack)) return rule.severity;
  }
  return "routine";
}

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 5,
  major: 4,
  moderate: 3,
  routine: 2,
  admin: 1,
};

/* ─────────────────────  INCIDENT INFERENCE  ────────────────── */

export interface IncidentGuess {
  date: Date;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  eventCount: number;
}

const ACUTE_SIGNAL =
  /\b(ems|ambulance|emergency department|emergency room|emergency medicine|\ber visit\b|trauma|motor vehicle|mva|collision|rear.?ended|struck by|accident|triage)\b/i;

/**
 * Score the earliest clusters of activity. A crash typically produces a
 * same-day burst including acute-care records. Returns null when no day
 * shows a clear signal — in that case we ask rather than guess.
 */
export function inferIncidentDate(events: MedicalEvent[]): IncidentGuess | null {
  if (!events.length) return null;

  const byDay = new Map<string, MedicalEvent[]>();
  for (const event of events) {
    if (!event.date) continue;
    const key = event.date.toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(event);
  }

  const days = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 12);

  let bestScore = -Infinity;
  let bestGuess: IncidentGuess | null = null;

  for (const [index, [key, dayEvents]] of days.entries()) {
    const text = dayEvents
      .map((event) => `${event.recordType ?? ""} ${event.medicineType ?? ""} ${event.summary.slice(0, 300)}`)
      .join(" ");

    const acuteHits = (text.match(ACUTE_SIGNAL) ?? []).length;
    const hasAcute = ACUTE_SIGNAL.test(text);
    const density = dayEvents.length;

    let score = 0;
    if (hasAcute) score += 50;
    score += Math.min(density, 20) * 2;
    score += Math.max(0, 10 - index) * 1.5;
    score += acuteHits * 5;

    if (score > bestScore) {
      const [year, month, day] = key.split("-").map(Number);
      const reasons: string[] = [];
      if (hasAcute) reasons.push("acute-care records present");
      if (density > 3) reasons.push(`${density} records on this date`);
      if (index === 0) reasons.push("earliest date in the file");

      bestScore = score;
      bestGuess = {
        date: new Date(year, month - 1, day),
        eventCount: density,
        confidence: hasAcute && density > 2 ? "high" : hasAcute || density > 4 ? "medium" : "low",
        reasoning: reasons.join(", ") || "first activity in the record",
      };
    }
  }

  if (!bestGuess || bestScore < 20) return null;
  return {
    date: bestGuess.date,
    confidence: bestGuess.confidence,
    reasoning: bestGuess.reasoning,
    eventCount: bestGuess.eventCount,
  };
}

/* ────────────────────────────  GAPS  ──────────────────────── */

export interface TreatmentGap {
  id: string;
  start: Date;
  end: Date;
  days: number;
  beforeEventId: string;
  afterEventId: string;
}

export function findGaps(
  events: MedicalEvent[],
  incidentDate: Date | null,
  thresholdDays = 60
): TreatmentGap[] {
  const relevant = events
    .filter((event) => event.date && (!incidentDate || event.date >= incidentDate))
    .filter((event) => event.severity !== "admin");

  const gaps: TreatmentGap[] = [];
  for (let index = 1; index < relevant.length; index++) {
    const previous = relevant[index - 1];
    const current = relevant[index];
    const days = Math.round((current.date!.getTime() - previous.date!.getTime()) / 86_400_000);
    if (days >= thresholdDays) {
      gaps.push({
        id: `gap-${previous.id}-${current.id}`,
        start: previous.date!,
        end: current.date!,
        days,
        beforeEventId: previous.id,
        afterEventId: current.id,
      });
    }
  }
  return gaps.sort((a, b) => b.days - a.days);
}

/* ──────────────────────  DAYS & DENSITY  ──────────────────── */

export function applyIncidentDate(events: MedicalEvent[], incidentDate: Date | null): MedicalEvent[] {
  return events.map((event) => ({
    ...event,
    daysFromIncident:
      event.date && incidentDate
        ? Math.round((event.date.getTime() - incidentDate.getTime()) / 86_400_000)
        : null,
  }));
}

export interface DayCluster {
  key: string;
  date: Date;
  events: MedicalEvent[];
  peakSeverity: Severity;
  intensity: number;
}

export function clusterByDay(events: MedicalEvent[]): DayCluster[] {
  const byDay = new Map<string, MedicalEvent[]>();
  for (const event of events) {
    if (!event.date) continue;
    const key = event.date.toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(event);
  }

  return [...byDay.entries()]
    .map(([key, dayEvents]) => {
      const peak = dayEvents.reduce<Severity>(
        (currentPeak, event) =>
          SEVERITY_WEIGHT[event.severity] > SEVERITY_WEIGHT[currentPeak] ? event.severity : currentPeak,
        "admin"
      );
      const intensity = dayEvents.reduce((sum, event) => sum + SEVERITY_WEIGHT[event.severity], 0);
      const [year, month, day] = key.split("-").map(Number);
      return { key, date: new Date(year, month - 1, day), events: dayEvents, peakSeverity: peak, intensity };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Smoothed intensity curve for the trace. Samples the case span at a fixed
 * resolution and spreads each day's intensity over a window, so the line
 * swells around dense treatment and thins across quiet stretches.
 */
export function buildIntensityCurve(
  clusters: DayCluster[],
  samples = 240,
  windowDays = 21
): { t: number; value: number }[] {
  if (clusters.length < 2) return [];
  const start = clusters[0].date.getTime();
  const end = clusters[clusters.length - 1].date.getTime();
  const span = end - start || 1;

  const points: { t: number; value: number }[] = [];
  for (let index = 0; index < samples; index++) {
    const t = index / (samples - 1);
    const at = start + t * span;
    let value = 0;
    for (const cluster of clusters) {
      const distDays = Math.abs(cluster.date.getTime() - at) / 86_400_000;
      if (distDays > windowDays) continue;
      value += cluster.intensity * (1 - distDays / windowDays);
    }
    points.push({ t, value });
  }

  const max = Math.max(...points.map((point) => point.value), 1);
  return points.map((point) => ({ t: point.t, value: point.value / max }));
}

/* ───────────────────────  TOP MOMENTS  ─────────────────────── */

export function findKeyMoments(events: MedicalEvent[], count = 5): MedicalEvent[] {
  const scored = events.map((event) => {
    let score = SEVERITY_WEIGHT[event.severity] * 10;
    if (event.daysFromIncident !== null && event.daysFromIncident >= 0 && event.daysFromIncident < 3) {
      score += 15;
    }
    score += Math.min(event.summary.length / 200, 5);
    if (event.bodyParts.length > 2) score += 3;
    return { event, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((item) => item.event)
    .sort((a, b) => a.date!.getTime() - b.date!.getTime());
}

/* ────────────────────────  PHASES  ─────────────────────────── */

export interface TreatmentPhase {
  label: string;
  start: Date;
  end: Date;
  eventCount: number;
}

/** Splits the post-incident record at the largest quiet stretches. */
export function derivePhases(clusters: DayCluster[], gaps: TreatmentGap[]): TreatmentPhase[] {
  if (!clusters.length) return [];
  const boundaries = gaps.slice(0, 3).map((gap) => gap.start.getTime()).sort((a, b) => a - b);

  const phases: TreatmentPhase[] = [];
  let bucket: DayCluster[] = [];
  let cut = 0;

  for (const cluster of clusters) {
    bucket.push(cluster);
    if (cut < boundaries.length && cluster.date.getTime() >= boundaries[cut]) {
      phases.push(makePhase(bucket, phases.length));
      bucket = [];
      cut++;
    }
  }
  if (bucket.length) phases.push(makePhase(bucket, phases.length));
  return phases;
}

function makePhase(bucket: DayCluster[], index: number): TreatmentPhase {
  const names = ["Acute care", "Active treatment", "Continued care", "Long-term management"];
  return {
    label: names[Math.min(index, names.length - 1)],
    start: bucket[0].date,
    end: bucket[bucket.length - 1].date,
    eventCount: bucket.reduce((total, cluster) => total + cluster.events.length, 0),
  };
}