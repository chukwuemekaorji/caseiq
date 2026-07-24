import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { clearKey, getKey, setKey } from "../../lib/ai";

export default function KeyModal({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState("");
  const existing = getKey();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg border border-ink/20 bg-film p-8"
      >
        <button onClick={onClose} className="absolute right-5 top-5 text-graphite">
          <X size={18} />
        </button>

        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-graphite">
          Model access
        </p>
        <h3 className="mb-4 font-display text-3xl uppercase">Anthropic API key</h3>
        <p className="mb-6 text-sm leading-relaxed text-ink/70">
          Held in this browser tab only, cleared when the tab closes. It is never
          stored on a server and never leaves your machine except in requests to
          Anthropic. Get a key at{" "}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noreferrer"
            className="text-teal underline"
          >
            console.anthropic.com
          </a>
          .
        </p>

        {existing && (
          <p className="mb-4 font-mono text-xs text-teal">
            A key is set (…{existing.slice(-6)}).
          </p>
        )}

        <input
          type="password"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="sk-ant-…"
          className="mb-4 w-full border border-ink/30 bg-transparent px-3 py-2.5 font-mono text-sm"
        />

        <div className="flex gap-3">
          <button
            disabled={!value.trim()}
            onClick={() => {
              setKey(value);
              onClose();
            }}
            className="bg-ink px-6 py-2.5 font-mono text-xs uppercase tracking-widest text-film disabled:opacity-30"
          >
            Save key
          </button>
          {existing && (
            <button
              onClick={() => {
                clearKey();
                onClose();
              }}
              className="border border-ink/30 px-4 py-2.5 font-mono text-xs uppercase tracking-widest"
            >
              Clear
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}