"use client";

import { motion } from "framer-motion";

export default function WavingBuddy({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 170" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="70" cy="158" rx="42" ry="8" fill="#0B1520" opacity="0.08" />

      {/* legs */}
      <rect x="48" y="112" width="16" height="42" rx="8" fill="#1B4F63" />
      <rect x="76" y="112" width="16" height="42" rx="8" fill="#1B4F63" />

      {/* body */}
      <rect x="38" y="62" width="64" height="62" rx="30" fill="#FF6B6B" />

      {/* static arm (left) */}
      <rect x="30" y="76" width="16" height="46" rx="8" fill="#FF6B6B" />

      {/* waving arm (right), pivoting from the shoulder */}
      <motion.g
        style={{ originX: "96px", originY: "76px" }}
        animate={{ rotate: [0, 28, 8, 28, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
      >
        <rect x="90" y="40" width="16" height="46" rx="8" fill="#FF6B6B" />
        <circle cx="98" cy="36" r="9" fill="#FFC145" />
      </motion.g>

      {/* head */}
      <circle cx="70" cy="40" r="26" fill="#8B5CF6" />
      <circle cx="61" cy="38" r="3.2" fill="#0B1520" />
      <circle cx="79" cy="38" r="3.2" fill="#0B1520" />
      <path d="M60 48 Q70 56 80 48" stroke="#0B1520" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}
