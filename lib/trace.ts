import type { DayCluster } from "./analyze";

export interface TraceGeometry {
  ribbon: string;
  spine: string;
  nodes: TraceNode[];
  incidentX: number | null;
  width: number;
  height: number;
  midY: number;
}

export interface TraceNode {
  key: string;
  x: number;
  y: number;
  cluster: DayCluster;
  isPre: boolean;
}

interface Options {
  width: number;
  height: number;
  padX: number;
  maxThickness: number;
}

export function buildTrace(
  clusters: DayCluster[],
  curve: { t: number; value: number }[],
  incidentDate: Date | null,
  opts: Options
): TraceGeometry {
  const { width, height, padX, maxThickness } = opts;
  const midY = height / 2;
  const usable = width - padX * 2;

  if (clusters.length < 2 || !curve.length) {
    return {
      ribbon: "",
      spine: `M ${padX} ${midY} L ${width - padX} ${midY}`,
      nodes: [],
      incidentX: null,
      width,
      height,
      midY,
    };
  }

  const start = clusters[0].date.getTime();
  const end = clusters[clusters.length - 1].date.getTime();
  const span = end - start || 1;
  const xFor = (time: number) => padX + ((time - start) / span) * usable;

  const upper = curve.map((point) => {
    const x = padX + point.t * usable;
    const y = midY - (0.12 + point.value * 0.88) * (maxThickness / 2);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const lower = [...curve].reverse().map((point) => {
    const x = padX + point.t * usable;
    const y = midY + (0.12 + point.value * 0.88) * (maxThickness / 2);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const ribbon = `M ${upper.join(" L ")} L ${lower.join(" L ")} Z`;
  const spine = `M ${padX} ${midY} L ${width - padX} ${midY}`;

  const nodes: TraceNode[] = clusters.map((cluster) => ({
    key: cluster.key,
    x: xFor(cluster.date.getTime()),
    y: midY,
    cluster,
    isPre: incidentDate ? cluster.date < incidentDate : false,
  }));

  const incidentX =
    incidentDate && incidentDate.getTime() >= start && incidentDate.getTime() <= end
      ? xFor(incidentDate.getTime())
      : null;

  return { ribbon, spine, nodes, incidentX, width, height, midY };
}