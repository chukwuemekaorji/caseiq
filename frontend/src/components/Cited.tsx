import type { MedicalEvent } from "../types";

interface Props {
  text: string;
  events: MedicalEvent[];
  onCite: (rowIndex: number) => void;
}

/** Turns "[row 42]" into a clickable chip that jumps to that record. */
export default function Cited({ text, events, onCite }: Props) {
  const known = new Set(events.map((event) => event.rowIndex));
  const parts = text.split(/(\[rows?\s*[\d,\s]+\])/gi);

  return (
    <>
      {parts.map((part, index) => {
        const match = part.match(/^\[rows?\s*([\d,\s]+)\]$/i);
        if (!match) return <span key={index}>{part}</span>;

        const rows = match[1]
          .split(",")
          .map((row) => parseInt(row.trim(), 10))
          .filter((row) => !Number.isNaN(row));

        return (
          <span key={index} className="mx-0.5 inline-flex gap-1">
            {rows.map((row) => (
              <button
                key={row}
                onClick={() => onCite(row)}
                disabled={!known.has(row)}
                className={`align-baseline border px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
                  known.has(row)
                    ? "cursor-pointer border-teal/40 text-teal hover:bg-teal hover:text-film"
                    : "cursor-not-allowed border-amber/40 text-amber"
                }`}
                title={known.has(row) ? `Go to row ${row}` : `Row ${row} is not in this file`}
              >
                {row}
              </button>
            ))}
          </span>
        );
      })}
    </>
  );
}