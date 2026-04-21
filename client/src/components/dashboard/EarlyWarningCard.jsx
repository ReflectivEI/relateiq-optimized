/**
 * EarlyWarningCard — Early Warning System dashboard component.
 * Shows risk signals, overall risk score, and micro-repair suggestions.
 * Collapsible sections for each repair.
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  AlertCircle,
  Zap,
  ChevronDown,
  ChevronUp,
  Heart,
  Users,
  Lightbulb,
  CheckCircle2,
  Clock,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  healthy: {
    icon: CheckCircle2,
    color: "text-[#0e6f72]",
    bg: "bg-[#e8f7f6]",
    border: "border-[#0e6f72]/20",
    label: "No Emerging Risks",
  },
  caution: {
    icon: AlertCircle,
    color: "text-[#0e6f72]",
    bg: "bg-[#e8f7f6]",
    border: "border-[#0e6f72]/20",
    label: "Monitor Patterns",
  },
  elevated: {
    icon: Zap,
    color: "text-[#0e6f72]",
    bg: "bg-[#e8f7f6]",
    border: "border-[#0e6f72]/20",
    label: "Elevated Risk",
  },
  high_risk: {
    icon: AlertTriangle,
    color: "text-red-700",
    bg: "bg-[#f7efef]",
    border: "border-red-200",
    label: "High Risk",
  },
};

const CATEGORY_ICONS = {
  connection: Heart,
  gratitude: Lightbulb,
  presence: Users,
  repair: Zap,
  safety: AlertCircle,
  reciprocity: Users,
};

function MicroRepairCollapsible({ repair, index }) {
  const [expanded, setExpanded] = useState(index === 0);
  const Icon = CATEGORY_ICONS[repair.category] || Lightbulb;

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/15 bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#eef4fb] hover:bg-[#e8f0fa] transition-colors text-left"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Icon className="w-4 h-4 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{repair.title}</p>
            <p className="text-xs text-muted-foreground">{repair.why}</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 py-3 border-t border-primary/10 space-y-3 bg-white">
          {/* Actions */}
          <div className="space-y-2">
            {repair.actions.map((a) => (
              <div key={a.step} className="flex gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-semibold shrink-0">
                  {a.step}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{a.action}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 italic">{a.tone}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Frameworks */}
          {repair.frameworks && repair.frameworks.length > 0 && (
            <div className="pt-2 border-t border-border/30 space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Frameworks</p>
              <div className="flex flex-wrap gap-1.5">
                {repair.frameworks.map((fw) => (
                  <Badge key={fw} variant="outline" className="text-[10px] border-primary/20 bg-primary/5 text-primary">
                    {fw}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EarlyWarningCard({ riskSummary }) {
  const [showScoreDetails, setShowScoreDetails] = useState(false);

  if (!riskSummary) {
    return null;
  }

  const config = STATUS_CONFIG[riskSummary.status] || STATUS_CONFIG.caution;
  const Icon = config.icon;
  const riskPercent = Math.round(riskSummary.overall_score * 100);
  const strongestSignal = riskSummary.breakdown?.strongest_signal;
  const averageSignalPercent = Math.round((riskSummary.breakdown?.average_signal_score || 0) * 100);
  const scoreGuidance =
    riskPercent >= 70
      ? "This score is elevated. The goal is to bring it down quickly by repairing the strongest active signals."
      : riskPercent >= 40
      ? "This score is moderate. It means tension is forming, but it is still very workable with early repair."
      : "This score is relatively contained. Keep reinforcing the patterns that are protecting the relationship.";
  const coachingTips = (riskSummary.repairs || [])
    .slice(0, 3)
    .map((repair) => repair.actions?.[0]?.action)
    .filter(Boolean);

  return (
    <Card className={cn("border-2", config.border, config.bg)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3 flex-1">
            <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", config.color)} />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                Early Warning System
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{riskSummary.message}</p>
              {riskSummary.days_ahead > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Prediction window: {riskSummary.timeline}</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowScoreDetails((value) => !value)}
            className="flex shrink-0 flex-col items-center justify-center rounded-2xl border border-primary/15 bg-white/70 px-4 py-3 text-center transition-colors hover:border-primary/30 hover:bg-white"
          >
            <div className="text-3xl font-bold text-foreground">{riskPercent}%</div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Risk Score</p>
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
              <Info className="h-3 w-3" />
              {showScoreDetails ? "Hide details" : "What this means"}
            </span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {showScoreDetails && (
          <div className="rounded-[1.2rem] border border-primary/20 bg-white/90 p-4 space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                What This Score Means
              </p>
              <p className="text-sm leading-7 text-foreground">
                {scoreGuidance} Because this is a risk score, improving it means bringing the percentage down over time.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-primary/15 bg-[#eef4fb] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Strongest Signal
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {strongestSignal?.label || "No active signal"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {strongestSignal ? `${Math.round(strongestSignal.risk_score * 100)}% weight in current score` : "Nothing is materially elevating risk right now."}
                </p>
              </div>
              <div className="rounded-2xl border border-primary/15 bg-[#eef4fb] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Average Signal Weight
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">{averageSignalPercent}%</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Based on all currently detected early-warning signals.
                </p>
              </div>
              <div className="rounded-2xl border border-primary/15 bg-[#eef4fb] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Prediction Window
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">{riskSummary.timeline}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  This is a near-term read, not a permanent judgment about the relationship.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Where It Comes From
              </p>
              <p className="text-sm leading-7 text-foreground">
                {riskSummary.breakdown?.scoring_method} Right now the score is being driven by{" "}
                <span className="font-semibold">
                  {riskSummary.breakdown?.signal_count || 0} detected signal
                  {(riskSummary.breakdown?.signal_count || 0) === 1 ? "" : "s"}
                </span>
                {strongestSignal ? `, with ${strongestSignal.label.toLowerCase()} as the main driver.` : "."}
              </p>
            </div>

            {coachingTips.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Best Ways To Improve It
                </p>
                <div className="space-y-2">
                  {coachingTips.map((tip) => (
                    <div key={tip} className="flex gap-2 rounded-2xl border border-primary/15 bg-[#e8f7f6] p-3 text-sm leading-6 text-foreground">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Risk Signals */}
        {riskSummary.signals && riskSummary.signals.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detected Signals</p>
            <div className="space-y-1.5">
              {riskSummary.signals.map((signal) => (
                <div
                  key={signal.id}
                  className={cn(
                    "flex items-start gap-2 p-2.5 rounded-lg border text-xs",
                    signal.severity === "high"
                      ? "bg-white border-red-200 text-red-700"
                      : "bg-white border-primary/15 text-[#14263f]"
                  )}
                >
                  <AlertCircle className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", signal.severity === "high" ? "text-red-600" : "text-[#0e6f72]")} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{signal.label}</p>
                    <p className="text-[11px] opacity-80">{signal.description}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] shrink-0",
                      signal.severity === "high"
                        ? "border-red-300 bg-red-50 text-red-700"
                        : "border-primary/20 bg-primary/5 text-primary"
                    )}
                  >
                    {Math.round(signal.risk_score * 100)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Micro-Repairs */}
        {riskSummary.repairs && riskSummary.repairs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Preventative Micro-Repairs
            </p>
            <div className="space-y-2">
              {riskSummary.repairs.map((repair, i) => (
                <MicroRepairCollapsible key={repair.risk_id} repair={repair} index={i} />
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground/70 pt-1">
              Start with the first repair. Small, consistent actions prevent escalation.
            </p>
          </div>
        )}

        {/* Healthy State */}
        {riskSummary.status === "healthy" && (
          <div className="text-center py-3">
            <p className="text-sm text-foreground font-medium">✓ Relationship patterns look healthy</p>
            <p className="text-xs text-muted-foreground mt-1">Continue regular check-ins to maintain stability.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
