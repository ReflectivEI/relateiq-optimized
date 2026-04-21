/**
 * InsightTierBanner — shows the current intelligence tier and what unlocks next.
 * Replaces the hard "Needs Profiles" blocker with progressive messaging.
 */
import React from "react";
import { Link } from "react-router-dom";
import { Zap, BookOpen, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InsightTierBanner({ tonyProfile, drewProfile, tonyResponses, drewResponses }) {
  const tonyHasAnswers = tonyResponses.length > 0;
  const drewHasAnswers = drewResponses.length > 0;
  const tonyReady = !!tonyProfile;
  const drewReady = !!drewProfile;
  const bothReady = tonyReady && drewReady;

  let tier, message, cta, ctaPath;

  if (bothReady) {
    tier = 3;
    message = "Full relationship intelligence is active. Deep insights available now.";
  } else if (tonyReady || drewReady) {
    const missingName = tonyReady ? "Drew" : "Tony";
    tier = 2;
    message = `Partial relationship insights available. Full relationship intelligence unlocks when ${missingName}'s profile is complete.`;
    cta = `Build ${missingName}'s profile`;
    ctaPath = "/questionnaire";
  } else if (tonyHasAnswers || drewHasAnswers) {
    tier = 1;
    message = "Individual insights available now. Full relationship intelligence unlocks when both profiles are complete. Your individual insights are available now.";
    cta = "Generate profiles";
    ctaPath = "/profiles";
  } else {
    tier = 0;
    message = "Start with the questionnaire to build your intelligence layer.";
    cta = "Start questionnaire";
    ctaPath = "/questionnaire";
  }

  const tierColors = [
    "bg-muted/50 border-border/40",
    "bg-blue-50 border-blue-200",
    "bg-primary/5 border-primary/20",
    "bg-green-50 border-green-200",
  ];

  const tierIcons = [Zap, Zap, BookOpen, CheckCircle2];
  const TierIcon = tierIcons[tier];

  return (
    <div className={cn("flex items-start gap-3 px-4 py-3 rounded-xl border", tierColors[tier])}>
      <TierIcon className={cn("w-4 h-4 shrink-0 mt-0.5", tier === 3 ? "text-green-600" : tier >= 2 ? "text-primary" : "text-muted-foreground")} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Intelligence Tier {tier + 1}
          </span>
          <span className={cn(
            "text-[10px] px-2 py-0.5 rounded-full font-medium",
            tier === 3 ? "bg-green-100 text-green-700" :
            tier === 2 ? "bg-primary/10 text-primary" :
            tier === 1 ? "bg-blue-100 text-blue-700" :
            "bg-muted text-muted-foreground"
          )}>
            {tier === 3 ? "Full" : tier === 2 ? "Partial" : tier === 1 ? "Individual" : "Not started"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
      </div>
      {cta && ctaPath && (
        <Link to={ctaPath} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0 mt-0.5">
          {cta} <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}