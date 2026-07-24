"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { DayCluster, TreatmentGap } from "../../lib/analyze";
import { buildTrace } from "../../lib/trace";
import { SEVERITY_COLOR, SEVERITY_RADIUS } from "../../lib/palette";

interface Props {
  clusters: DayCluster[];
  curve: { t: number; value: number }[];
  gaps: TreatmentGap[];
  incidentDate: Date | null;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
}

const HEIGHT = 260;
const PAD_X = 56;
const MAX_THICKNESS = 120;

export default function Trace({
  clusters,
  curve,
  gaps,
  incidentDate,
  selectedKey,
  onSelect,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1100);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const geo = useMemo(
    () =>
      buildTrace(clusters, curve, incidentDate, {
        width,
        height: HEIGHT,
        padX: PAD_X,
        maxThickness: MAX_THICKNESS,
      }),
    [clusters, curve, incidentDate, width]
  );

  const gapBands = useMemo(() => {
    if (!clusters.length) return [];
    const start = clusters[0].date.getTime();
    const end = clusters[clusters.length - 1].date.getTime();
    const span = end - start || 1;
    const usable = width - PAD_X * 2;
    return gaps.map((gap) => ({
      id: gap.id,
      days: gap.days,
      x1: PAD_X + ((gap.start.getTime() - start) / span) * usable,
      x2: PAD_X + ((gap.end.getTime() - start) / span) * usable,
    }));
  }, [gaps, clusters, width]);

  const activeKey = hover ?? selectedKey;
  const activeNode = geo.nodes.find((node) => node.key === activeKey) ?? null;

  return (
    <div ref={ref} className="relative w-full select-none">
      <svg width={width} height={HEIGHT} className="overflow-visible">
        <defs>
          <linearGradient id="preGrad" x1="0" x2="1">
            <stop offset="0%" stopColor="#8A939B" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#8A939B" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="postGrad" x1="0" x2="1">
            <stop offset="0%" stopColor="#1B4F63" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#1B4F63" stopOpacity="0.28" />
          </linearGradient>
          <clipPath id="preClip">
            <rect x="0" y="0" width={geo.incidentX ?? 0} height={HEIGHT} />
          </clipPath>
          <clipPath id="postClip">
            <rect
              x={geo.incidentX ?? 0}
              y="0"
              width={width - (geo.incidentX ?? 0)}
              height={HEIGHT}
            />
          </clipPath>
        </defs>

        {gapBands.map((gap, index) => (
          <motion.g
            key={gap.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 + index * 0.08, duration: 0.5 }}
          >
            <rect
              x={gap.x1}
              y={geo.midY - MAX_THICKNESS / 2 - 14}
              width={Math.max(gap.x2 - gap.x1, 1)}
              height={MAX_THICKNESS + 28}
              fill="#C4703A"
              opacity={0.07}
            />
            <line
              x1={gap.x1}
              x2={gap.x2}
              y1={geo.midY}
              y2={geo.midY}
              stroke="#C4703A"
              strokeWidth={1}
              strokeDasharray="3 4"
              opacity={0.6}
            />
            <text
              x={(gap.x1 + gap.x2) / 2}
              y={geo.midY - MAX_THICKNESS / 2 - 20}
              textAnchor="middle"
              className="font-mono"
              fontSize={10}
              fill="#C4703A"
              letterSpacing="0.1em"
            >
              {gap.days}D GAP
            </text>
          </motion.g>
        ))}

        <motion.g
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          animate={{ clipPath: "inset(0 0% 0 0)" }}
          transition={{ duration: 1.0, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {geo.incidentX !== null ? (
            <>
              <path d={geo.ribbon} fill="url(#preGrad)" clipPath="url(#preClip)" />
              <path d={geo.ribbon} fill="url(#postGrad)" clipPath="url(#postClip)" />
            </>
          ) : (
            <path d={geo.ribbon} fill="url(#postGrad)" />
          )}
          <path d={geo.spine} stroke="#0B1520" strokeWidth={0.75} opacity={0.35} fill="none" />
        </motion.g>

        {geo.incidentX !== null && (
          <motion.g
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <line
              x1={geo.incidentX}
              x2={geo.incidentX}
              y1={16}
              y2={HEIGHT - 16}
              stroke="#0B1520"
              strokeWidth={1.5}
            />
            <text
              x={geo.incidentX + 8}
              y={26}
              className="font-mono"
              fontSize={10}
              fill="#0B1520"
              letterSpacing="0.16em"
            >
              INCIDENT
            </text>
          </motion.g>
        )}

        {geo.nodes.map((node, index) => {
          const isActive = node.key === activeKey;
          const radius = SEVERITY_RADIUS[node.cluster.peakSeverity];
          return (
            <motion.circle
              key={node.key}
              cx={node.x}
              cy={node.y}
              r={isActive ? radius + 3 : radius}
              fill={node.isPre ? "#8A939B" : SEVERITY_COLOR[node.cluster.peakSeverity]}
              stroke="#E8ECEF"
              strokeWidth={1.25}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: node.isPre ? 0.55 : 1, scale: 1 }}
              transition={{
                delay: 1.15 + (index / Math.max(geo.nodes.length, 1)) * 0.55,
                duration: 0.35,
                ease: "backOut",
              }}
              className="cursor-pointer"
              onMouseEnter={() => setHover(node.key)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect(selectedKey === node.key ? null : node.key)}
            />
          );
        })}

        {activeNode && (
          <line
            x1={activeNode.x}
            x2={activeNode.x}
            y1={activeNode.y - 12}
            y2={activeNode.y - 52}
            stroke="#0B1520"
            strokeWidth={0.75}
            pointerEvents="none"
          />
        )}
      </svg>

      {activeNode && (
        <div
          className="pointer-events-none absolute z-10 w-72 -translate-x-1/2 border border-ink/15 bg-film px-3 py-2.5 shadow-lg"
          style={{
            left: Math.min(Math.max(activeNode.x, 144), width - 144),
            top: Math.max(activeNode.y - MAX_THICKNESS / 2 - 175, 0),
          }}
        >
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <p className="font-mono text-[11px] text-ink">{activeNode.cluster.date.toLocaleDateString()}</p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-graphite">
              {activeNode.cluster.events.length} record{activeNode.cluster.events.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="space-y-1.5">
            {activeNode.cluster.events.slice(0, 3).map((event) => (
              <div key={event.id} className="border-t border-ink/10 pt-1.5 first:border-0 first:pt-0">
                <p className="font-mono text-[9px] uppercase tracking-widest text-graphite">
                  {event.recordType ?? "Record"}
                </p>
                <p className="line-clamp-2 text-xs leading-snug text-ink/85">{event.summary}</p>
              </div>
            ))}
          </div>
          {activeNode.cluster.events.length > 3 && (
            <p className="mt-1.5 font-mono text-[9px] uppercase tracking-widest text-graphite">
              +{activeNode.cluster.events.length - 3} more · click to see all
            </p>
          )}
        </div>
      )}

      {clusters.length > 1 && (
        <div className="mt-1 flex justify-between px-[56px] font-mono text-[10px] text-graphite">
          <span>{clusters[0].date.toLocaleDateString()}</span>
          <span>{clusters[clusters.length - 1].date.toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );
}