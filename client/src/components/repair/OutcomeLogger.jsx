/**
 * OutcomeLogger — lightweight "Did this help?" follow-up widget.
 * Reusable across AI Coach, Smart Tools, Proactive Repair, etc.
 * Persists outcome to OutcomeLog entity for the continuous learning engine.
 */
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/api/client";
import { CheckCircle2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const OUTCOME_OPTIONS = [
  { value: "helped", label: "It helped", color: "border-green-300 bg-green-50 text-green-700" },
  { value: "neutral", label: "No real change", color: "border-slate-200 bg-slate-50 text-slate-600" },
  { value: "worsened", label: "Made things harder", color: "border-rose-200 bg-rose-50 text-rose-700" },
];

const TENSION_OPTIONS = [
  { value: "reduced", label: "Tension reduced" },
  { value: "same", label: "Same" },
  { value: "increased", label: "Tension increased" },
];

const CONNECTION_OPTIONS = [
  { value: "improved", label: "More connected" },
  { value: "same", label: "Same" },
  { value: "worse", label: "More distant" },
];

export default function OutcomeLogger({
  sourceType,        // "AI Coach" | "Proactive Repair" | "Smart Tools" etc.
  relatedSessionId,  // ID of the session/repair entry
  scope,             // "Tony" | "Drew" | "Tony_Drew"
  recommendationSummary, // short description of what was recommended
  onLogged,          // optional callback after logging
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1); // 1 = tried? 2 = how'd it go? 3 = done
  const [tried, setTried] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [tension, setTension] = useState(null);
  const [connection, setConnection] = useState(null);
  const [natural, setNatural] = useState(null);
  const [tryAgain, setTryAgain] = useState(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await api.entities.OutcomeLog.create({
      source_type: sourceType,
      related_session_id: relatedSessionId || "",
      scope,
      recommendation_given: recommendationSummary || "",
      action_attempted: tried === true,
      outcome_rating: outcome || "neutral",
      tension_change: tension || "same",
      connection_change: connection || "same",
      felt_natural: natural === true,
      user_notes: notes,
      would_try_again: tryAgain === true,
    });
    setSaving(false);
    setDone(true);
    setOpen(false);
    toast.success("Outcome logged — the system learns from this");
    onLogged?.();
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 text-xs text-primary">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Outcome logged — thank you
      </div>
    );
  }

  return (
    <div className="border border-border/40 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/20 transition-colors"
      >
        <span className="text-sm text-muted-foreground font-medium">Did you try this? Log how it went →</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border/30">

              {/* Step 1: Did you try it? */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Did you try this approach?</p>
                <div className="flex gap-2">
                  {[{ v: true, l: "Yes" }, { v: false, l: "Not yet" }].map(({ v, l }) => (
                    <button
                      key={l}
                      onClick={() => { setTried(v); if (!v) setStep(1); else setStep(2); }}
                      className={cn(
                        "flex-1 py-2 rounded-lg border text-sm font-medium transition-all",
                        tried === v ? "border-primary/40 bg-primary/10 text-foreground" : "border-border/50 text-muted-foreground hover:bg-muted/20"
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {tried === true && (
                <>
                  {/* Overall outcome */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-foreground">How did it go overall?</p>
                    <div className="space-y-1.5">
                      {OUTCOME_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          onClick={() => setOutcome(o.value)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-lg border text-sm transition-all",
                            outcome === o.value ? o.color + " font-medium" : "border-border/40 text-muted-foreground hover:bg-muted/20"
                          )}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {outcome && (
                    <>
                      {/* Tension */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-foreground">Tension level after?</p>
                        <div className="flex gap-2">
                          {TENSION_OPTIONS.map((o) => (
                            <button
                              key={o.value}
                              onClick={() => setTension(o.value)}
                              className={cn(
                                "flex-1 py-1.5 rounded-lg border text-xs transition-all",
                                tension === o.value ? "border-primary/40 bg-primary/10 text-foreground font-medium" : "border-border/40 text-muted-foreground hover:bg-muted/20"
                              )}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Connection */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-foreground">Connection after?</p>
                        <div className="flex gap-2">
                          {CONNECTION_OPTIONS.map((o) => (
                            <button
                              key={o.value}
                              onClick={() => setConnection(o.value)}
                              className={cn(
                                "flex-1 py-1.5 rounded-lg border text-xs transition-all",
                                connection === o.value ? "border-primary/40 bg-primary/10 text-foreground font-medium" : "border-border/40 text-muted-foreground hover:bg-muted/20"
                              )}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Felt natural + try again */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-foreground">Felt natural?</p>
                          <div className="flex gap-1.5">
                            {[{ v: true, l: "Yes" }, { v: false, l: "Not really" }].map(({ v, l }) => (
                              <button key={l} onClick={() => setNatural(v)} className={cn("flex-1 py-1.5 rounded-lg border text-xs transition-all", natural === v ? "border-primary/40 bg-primary/10 text-foreground font-medium" : "border-border/40 text-muted-foreground hover:bg-muted/20")}>{l}</button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-foreground">Try again?</p>
                          <div className="flex gap-1.5">
                            {[{ v: true, l: "Yes" }, { v: false, l: "Probably not" }].map(({ v, l }) => (
                              <button key={l} onClick={() => setTryAgain(v)} className={cn("flex-1 py-1.5 rounded-lg border text-xs transition-all", tryAgain === v ? "border-primary/40 bg-primary/10 text-foreground font-medium" : "border-border/40 text-muted-foreground hover:bg-muted/20")}>{l}</button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      <Textarea
                        placeholder="Anything else that happened? (optional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="min-h-[60px] resize-none bg-background/50 text-sm"
                      />
                    </>
                  )}
                </>
              )}

              {tried === false && (
                <p className="text-xs text-muted-foreground italic">Come back and log the outcome when you're ready — the system remembers.</p>
              )}

              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || tried === null}
                className="w-full gap-2"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {saving ? "Saving..." : "Log Outcome"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}