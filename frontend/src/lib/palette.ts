import type { Severity } from "../types";

export const SEVERITY_COLOR: Record<Severity, string> = {
  critical: "#0B1520",
  major: "#1B4F63",
  moderate: "#3E7C91",
  routine: "#8A939B",
  admin: "#B8C0C6",
};

export const SEVERITY_RADIUS: Record<Severity, number> = {
  critical: 7,
  major: 5.5,
  moderate: 4.5,
  routine: 3.5,
  admin: 2.5,
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Surgery / admission",
  major: "Imaging / injection / ER",
  moderate: "Consultation / assessment",
  routine: "Routine care",
  admin: "Administrative",
};