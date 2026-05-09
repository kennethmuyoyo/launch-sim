"use client";

import { motion } from "motion/react";

/**
 * Ambient field for the landing hero — slow-floating gradient blobs,
 * faint orbital line, faint signal pings. Purely decorative.
 */
export function AmbientField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* electric blob */}
      <motion.div
        aria-hidden
        className="absolute -top-32 left-[10%] h-[520px] w-[520px] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(106,160,255,0.45), transparent 60%)",
          filter: "blur(40px)",
        }}
        animate={{ x: [0, 30, -10, 0], y: [0, -20, 10, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* violet blob */}
      <motion.div
        aria-hidden
        className="absolute top-1/3 right-[5%] h-[460px] w-[460px] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(180,140,255,0.40), transparent 60%)",
          filter: "blur(50px)",
        }}
        animate={{ x: [0, -25, 15, 0], y: [0, 15, -10, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* ember blob */}
      <motion.div
        aria-hidden
        className="absolute bottom-[-8%] left-[35%] h-[420px] w-[420px] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 70% 30%, rgba(255,154,85,0.30), transparent 60%)",
          filter: "blur(60px)",
        }}
        animate={{ x: [0, 20, -10, 0], y: [0, -10, 10, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* orbital ring */}
      <svg
        className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 opacity-40"
        viewBox="0 0 800 800"
        fill="none"
      >
        <defs>
          <radialGradient id="ringFade" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="rgba(255,255,255,0.0)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.18)" />
          </radialGradient>
        </defs>
        <circle cx="400" cy="400" r="380" stroke="url(#ringFade)" strokeWidth="1" />
        <circle cx="400" cy="400" r="280" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <circle cx="400" cy="400" r="180" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="2 6" />
      </svg>
    </div>
  );
}
