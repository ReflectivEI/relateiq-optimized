/**
 * AIProgressLog — muted on-screen activity log shown while AI is generating.
 * Shows step-by-step progress with a percentage so users know it's working.
 */
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

const CONTEXT_STEPS = [
  { pct: 5,  msg: "Gathering AI Coach sessions…" },
  { pct: 18, msg: "Loading check-in history…" },
  { pct: 30, msg: "Reading questionnaire responses…" },
  { pct: 42, msg: "Pulling profile data…" },
  { pct: 55, msg: "Analyzing relationship patterns…" },
  { pct: 68, msg: "Cross-referencing triggers and signals…" },
  { pct: 80, msg: "Generating early insights…" },
  { pct: 90, msg: "Structuring output…" },
  { pct: 97, msg: "Almost there…" },
];

const DEEP_STEPS = [
  { pct: 5,  msg: "Loading full questionnaire data…" },
  { pct: 15, msg: "Building behavioral profiles…" },
  { pct: 28, msg: "Running compatibility analysis…" },
  { pct: 42, msg: "Detecting conflict patterns…" },
  { pct: 56, msg: "Mapping trait dynamics…" },
  { pct: 68, msg: "Generating predictive insights…" },
  { pct: 78, msg: "Running dynamic update…" },
  { pct: 88, msg: "Building comparison table…" },
  { pct: 95, msg: "Finalizing deep analysis…" },
];

export default function AIProgressLog({ active, mode = "context" }) {
  const [stepIdx, setStepIdx] = useState(0);
  const steps = mode === "deep" ? DEEP_STEPS : CONTEXT_STEPS;

  useEffect(() => {
    if (!active) { setStepIdx(0); return; }
    setStepIdx(0);
    const intervals = steps.map((_, i) => {
      // Space steps roughly evenly over ~25 seconds for context, ~40s for deep
      const baseMs = mode === "deep" ? 4500 : 2800;
      return setTimeout(() => setStepIdx(i), i * baseMs);
    });
    return () => intervals.forEach(clearTimeout);
  }, [active, mode]);

  const current = steps[Math.min(stepIdx, steps.length - 1)];

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          className="rounded-xl border border-border/40 bg-muted/30 px-4 py-3 space-y-2"
        >
          <div className="flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 text-primary animate-spin shrink-0" />
            <span className="text-xs text-muted-foreground">{current.msg}</span>
            <span className="ml-auto text-xs font-medium text-primary tabular-nums">{current.pct}%</span>
          </div>
          <div className="h-1 rounded-full bg-border/50 overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${current.pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}