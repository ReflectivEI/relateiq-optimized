/**
 * RepairOpportunity — proactive repair script panel.
 * Appears automatically after a Coach session when the AI detects
 * a high-stress pattern or activated trigger.
 */
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartHandshake, ChevronDown, ChevronUp, X, Copy, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const LABEL_COLORS = {
  "Soft & Grounding":   "bg-green-100 text-green-700 border-green-200",
  "Direct & Honest":    "bg-blue-100 text-blue-700 border-blue-200",
  "Open & Curious":     "bg-purple-100 text-purple-700 border-purple-200",
};

function ScriptCard({ script, expanded, onToggle }) {
  const color = LABEL_COLORS[script.label] || "bg-slate-100 text-slate-700 border-slate-200";

  const handleCopy = () => {
    navigator.clipboard.writeText(script.script);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="rounded-xl border border-border/50 bg-background/60 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Badge className={cn("text-[10px] border font-normal shrink-0", color)}>
            {script.label}
          </Badge>
          {!expanded && (
            <p className="text-sm text-foreground truncate max-w-[260px]">"{script.script}"</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            title="Copy script"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border/30">
              <blockquote className="mt-3 text-sm text-foreground leading-relaxed italic border-l-2 border-primary/30 pl-3">
                "{script.script}"
              </blockquote>
              {script.why && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground not-italic">Why this works:</span> {script.why}
                </p>
              )}
              <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={handleCopy}>
                <Copy className="w-3 h-3" /> Copy this script
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RepairOpportunity({ repair, speaker, onDismiss }) {
  const [expanded, setExpanded] = useState(null);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!repair || !repair.repair_needed || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        className="rounded-xl border border-rose-200 bg-rose-50/40 overflow-hidden"
      >
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-start justify-between px-5 pt-4 pb-3 text-left"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
              <HeartHandshake className="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Repair Opportunity Detected</p>
              <p className="text-xs text-muted-foreground mt-0.5">{repair.emotional_tone}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            <span
              onClick={(event) => {
                event.stopPropagation();
                handleDismiss();
              }}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </span>
          </div>
        </button>

        {open && (
          <>
            {repair.pattern_detected && (
              <div className="mx-5 mb-3 px-3 py-2 rounded-lg bg-background/60 border border-border/40 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Pattern detected:</span> {repair.pattern_detected}
                </p>
              </div>
            )}

            <div className="px-5 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                3 repair scripts for {speaker} — tap to expand
              </p>
              {(repair.scripts || []).map((script, i) => (
                <ScriptCard
                  key={i}
                  script={script}
                  expanded={expanded === i}
                  onToggle={() => setExpanded(expanded === i ? null : i)}
                />
              ))}
            </div>

            {repair.avoid && (
              <div className="mx-5 mt-3 mb-4 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Avoid right now:</span> {repair.avoid}
                </p>
              </div>
            )}

            <div className="px-5 pb-4">
              <button onClick={handleDismiss} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Dismiss
              </button>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
