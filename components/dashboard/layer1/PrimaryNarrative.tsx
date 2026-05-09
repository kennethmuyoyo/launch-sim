"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

type Props = {
  text: string;
  /** Show the typing caret once the latest text settles. */
  active?: boolean;
};

/**
 * One-line emotional synthesis. Re-types whenever `text` changes so the
 * narrative feels like it's being written by the system in real time.
 *
 * The inner Typer remounts on each text change (via `key`), which means the
 * typing animation gets fresh useState defaults rather than imperative resets
 * inside an effect.
 */
export function PrimaryNarrative({ text, active = true }: Props) {
  return (
    <div className="space-y-2">
      <div className="text-eyebrow-bright">primary narrative</div>
      <AnimatePresence mode="wait">
        <motion.div
          key={text}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
        >
          <Typer text={text} active={active} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Typer({ text, active }: { text: string; active: boolean }) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      const next = text.slice(0, i);
      setShown(next);
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
      }
    }, 18);
    return () => clearInterval(id);
  }, [text]);

  return (
    <p className="text-2xl sm:text-3xl md:text-[34px] font-medium leading-[1.25] tracking-tight text-ink-0 text-balance max-w-[60ch]">
      <span className="text-ink-3 align-top text-2xl mr-1">“</span>
      {shown}
      {(!done || active) && <span className="caret align-baseline" />}
      <span className="text-ink-3 align-top text-2xl ml-1">”</span>
    </p>
  );
}
