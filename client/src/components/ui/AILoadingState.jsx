/**
 * AILoadingState — universal progress indicator for all AI operations.
 * Shows animated step messages, a simulated progress bar, and time estimate.
 */
import React, { useState, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const STEP_SEQUENCES = {
  profile: [
    "Reading your questionnaire responses…",
    "Mapping behavioral patterns…",
    "Analyzing communication style…",
    "Identifying triggers and needs…",
    "Building your behavioral portrait…",
    "Finalizing profile…",
  ],
  insights: [
    "Gathering all available data…",
    "Analyzing session history…",
    "Detecting patterns across check-ins…",
    "Mapping compatibility dynamics…",
    "Generating relationship intelligence…",
    "Finalizing insights…",
  ],
  coach: [
    "Reading situation context…",
    "Loading profile data for both partners…",
    "Analyzing trigger patterns…",
    "Generating personalized guidance…",
    "Building conversation scripts…",
    "Finalizing response…",
  ],
  repair: [
    "Reading situation…",
    "Analyzing conflict patterns…",
    "Identifying repair pathways…",
    "Building personalized scripts…",
    "Finalizing repair strategy…",
  ],
  default: [
    "Analyzing your input…",
    "Mapping patterns…",
    "Generating response…",
    "Finalizing…",
  ],
};

export default function AILoadingState({ active, mode = "default", className, inline = false }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = STEP_SEQUENCES[mode] || STEP_SEQUENCES.default;

  useEffect(() => {
    if (!active) {
      setStep(0);
      setProgress(0);
      return;
    }

    // Advance through steps
    const stepInterval = setInterval(() => {
      setStep((prev) => Math.min(prev + 1, steps.length - 1));
    }, 2200);

    // Smooth progress bar — reaches ~90% over ~15s, never 100% until done
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev + 0.1;
        return prev + (90 - prev) * 0.04;
      });
    }, 300);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [active, steps.length]);

  if (!active) return null;

  if (inline) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
        <span>{steps[step]}</span>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-primary/15 bg-primary/4 p-5 space-y-3", className)}>
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{steps[step]}</p>
          <p className="text-xs text-muted-foreground mt-0.5">This usually takes 5–15 seconds</p>
        </div>
        <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 95)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground/60">
          <span>Step {Math.min(step + 1, steps.length)} of {steps.length}</span>
          <span>{Math.round(Math.min(progress, 95))}%</span>
        </div>
      </div>
    </div>
  );
}