/**
 * PredictiveOutcomeBlock — Shows predicted outcomes based on predictiveEngine.
 * Fully deterministic, no AI calls.
 */
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, CheckCircle2 } from "lucide-react";
import { predictOutcome } from "@/lib/predictiveEngine";
import { cn } from "@/lib/utils";

function riskLabel(prediction) {
  if (!prediction) return "Unknown";
  const base = prediction.risk_level === "high" ? "High" : prediction.risk_level === "medium" ? "Medium" : "Low";
  return Number.isFinite(prediction.risk_score) ? `${base} (${prediction.risk_score}/100)` : base;
}

export default function PredictiveOutcomeBlock({ speaker, speakingTo, situation, speakerProfile, targetProfile, speakerTraits, targetTraits }) {
  const actorTraits = speakerTraits || speakerProfile?.trait_weights || {};
  const counterpartTraits = targetTraits || targetProfile?.trait_weights || {};

  const predictions = [
    {
      scenario: "If you say nothing",
      prediction: predictOutcome({
        actor: speaker,
        target: speakingTo,
        scenarioText: "avoidance: " + situation,
          actorTraits,
          targetTraits: counterpartTraits,
      }),
      icon: TrendingDown,
      color: "text-red-600 dark:text-red-300",
      bg: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800/70",
    },
    {
      scenario: "If you respond emotionally",
      prediction: predictOutcome({
        actor: speaker,
        target: speakingTo,
        scenarioText: "reactive: " + situation,
          actorTraits,
          targetTraits: counterpartTraits,
      }),
      icon: TrendingDown,
      color: "text-orange-600 dark:text-orange-300",
      bg: "bg-orange-50 border-orange-200 dark:bg-orange-950/25 dark:border-orange-800/70",
    },
    {
      scenario: "If you use this guidance",
      prediction: predictOutcome({
        actor: speaker,
        target: speakingTo,
        scenarioText: "intentional: " + situation,
          actorTraits,
          targetTraits: counterpartTraits,
      }),
      icon: CheckCircle2,
      color: "text-green-700 dark:text-green-300",
      bg: "bg-green-50 border-green-200 dark:bg-green-950/25 dark:border-green-800/70",
    },
  ];

  return (
    <Card className="border border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Predicted Outcomes</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">Based on your patterns and traits</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {predictions.map((p, i) => {
          const Icon = p.icon;
          return (
            <div key={i} className={cn("rounded-lg border p-3 space-y-1.5", p.bg)}>
              <div className="flex items-center gap-2">
                <Icon className={cn("w-4 h-4", p.color)} />
                <p className="text-sm font-semibold text-foreground">{p.scenario}</p>
              </div>
              <p className="text-sm text-foreground/90">{p.prediction?.predicted_behavior || "Conflict escalation likely"}</p>
              <p className="text-xs text-foreground/75 italic">
                Risk: {p.prediction?.risk_level === "high" ? "🔴" : p.prediction?.risk_level === "medium" ? "🟡" : "🟢"} {riskLabel(p.prediction)}
              </p>
              {Array.isArray(p.prediction?.methodologies) && p.prediction.methodologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {p.prediction.methodologies.slice(0, 3).map((method) => (
                    <span
                      key={`${p.scenario}-${method.id}`}
                      className="rounded-full border border-foreground/15 bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/75"
                    >
                      {method.label}
                    </span>
                  ))}
                </div>
              )}
              {p.prediction?.evidence_rationale && (
                <p className="text-[11px] leading-5 text-foreground/70">{p.prediction.evidence_rationale}</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}