"use client";

import { motion } from "framer-motion";

export default function PresentingBuddy({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 170" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="110" cy="158" rx="90" ry="8" fill="#0B1520" opacity="0.08" />

      {/* easel / board */}
      <rect x="118" y="20" width="90" height="66" rx="6" fill="#F4F6F7" stroke="#0B1520" strokeWidth="2" />
      <rect x="128" y="30" width="70" height="8" rx="2" fill="#0B1520" opacity="0.7" />
      <motion.rect
        x="130" y="46" width="14" height="30" rx="2" fill="#FF6B6B"
        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} style={{ originY: "76px" }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
      />
      <motion.rect
        x="150" y="36" width="14" height="40" rx="2" fill="#2DD4A7"
        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} style={{ originY: "76px" }}
        transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
      />
      <motion.rect
        x="170" y="54" width="14" height="22" rx="2" fill="#FFC145"
        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} style={{ originY: "76px" }}
        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
      />
      <rect x="158" y="86" width="4" height="34" fill="#8A939B" />
      <path d="M138 120 L182 120 L172 130 L148 130 Z" fill="#8A939B" />

      {/* legs */}
      <rect x="42" y="118" width="16" height="40" rx="8" fill="#1B4F63" />
      <rect x="68" y="118" width="16" height="40" rx="8" fill="#1B4F63" />

      {/* body */}
      <rect x="34" y="70" width="60" height="58" rx="28" fill="#8B5CF6" />

      {/* pointing arm, angled toward the board */}
      <motion.g
        style={{ originX: "88px", originY: "84px" }}
        animate={{ rotate: [0, -10, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="86" y="76" width="40" height="14" rx="7" fill="#8B5CF6" />
      </motion.g>

      {/* other arm at side */}
      <rect x="24" y="84" width="14" height="40" rx="7" fill="#8B5CF6" />

      {/* head */}
      <circle cx="64" cy="46" r="26" fill="#FF6B6B" />
      <circle cx="55" cy="44" r="3.2" fill="#0B1520" />
      <circle cx="73" cy="44" r="3.2" fill="#0B1520" />
      <path d="M55 55 Q64 61 73 55" stroke="#0B1520" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}
