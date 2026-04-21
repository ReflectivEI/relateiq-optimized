/**
 * PredictiveOutcomeBlock — Shows predicted outcomes based on predictiveEngine.
 * Fully deterministic, no AI calls.
 */
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, CheckCircle2 } from "lucide-react";
import { predictOutcome } from "@/lib/predictiveEngine";
import { cn } from "@/lib/utils";

export default function PredictiveOutcomeBlock({ speaker, speakingTo, situation, speakerProfile, targetProfile }) {
  const speakerTraits = speakerProfile?.trait_weights || {};
  const targetTraits = targetProfile?.trait_weights || {};

  const predictions = [
    {
      scenario: "If you say nothing",
      prediction: predictOutcome({
        actor: speaker,
        target: speakingTo,
        scenarioText: "avoidance: " + situation,
        actorTraits: speakerTraits,
        targetTraits: targetTraits,
      }),
      icon: TrendingDown,
      color: "text-red-500",
      bg: "bg-red-50 border-red-200",
    },
    {
      scenario: "If you respond emotionally",
      prediction: predictOutcome({
        actor: speaker,
        target: speakingTo,
        scenarioText: "reactive: " + situation,
        actorTraits: speakerTraits,
        targetTraits: targetTraits,
      }),
      icon: TrendingDown,
      color: "text-orange-500",
      bg: "bg-orange-50 border-orange-200",
    },
    {
      scenario: "If you use this guidance",
      prediction: predictOutcome({
        actor: speaker,
        target: speakingTo,
        scenarioText: "intentional: " + situation,
        actorTraits: speakerTraits,
        targetTraits: targetTraits,
      }),
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50 border-green-200",
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
              <p className="text-sm text-foreground/80">{p.prediction?.predicted_behavior || "Conflict escalation likely"}</p>
              <p className="text-xs text-muted-foreground italic">
                Risk: {p.prediction?.risk_level === "high" ? "🔴 High" : p.prediction?.risk_level === "medium" ? "🟡 Medium" : "🟢 Low"}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}