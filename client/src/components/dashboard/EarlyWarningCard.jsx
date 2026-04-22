/**
 * EarlyWarningCard — Early Warning System dashboard component.
 * Shows risk signals, overall risk score, and micro-repair suggestions.
 * Collapsible sections for each repair.
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import MetricExplainer from "@/components/ui/MetricExplainer";
import ReferencePill from "@/components/ui/ReferencePill";

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

function MicroRepairCollapsible({ repair }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = CATEGORY_ICONS[repair.category] || Lightbulb;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#0e6f72]/35 bg-white shadow-[0_1px_0_rgba(14,111,114,0.04)]">
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
                  <ReferencePill key={fw} referenceId={fw} />
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
    <Card className={cn("border-2", config.border, "bg-[#deeff0] shadow-sm")}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3 flex-1">
            <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", config.color)} />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                Early Warning System
              </CardTitle>
              <p className="mt-2 text-base text-muted-foreground">{riskSummary.message}</p>
              {riskSummary.days_ahead > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Prediction window: {riskSummary.timeline}</span>
                </div>
              )}
            </div>
          </div>

          <MetricExplainer
            label={`${riskPercent}% risk score`}
            title="Relationship risk score"
            summary={`${riskPercent}% is a short-horizon early warning score. Higher numbers mean the system is seeing more active tension signals across recent check-ins, sessions, and repair patterns.`}
            calculation={`${riskSummary.breakdown?.scoring_method} The score combines ${riskSummary.breakdown?.signal_count || 0} detected signal${(riskSummary.breakdown?.signal_count || 0) === 1 ? "" : "s"} and weights them by severity, recency, and pattern overlap.`}
            source={strongestSignal ? `The strongest current driver is ${strongestSignal.label}. The current reading covers the next ${riskSummary.timeline}.` : `This score is based on recent check-ins, sessions, and repair behavior within the ${riskSummary.timeline} window.`}
            coachingTips={coachingTips}
          >
            <button
              type="button"
              className="enterprise-hover-raise flex shrink-0 flex-col items-center justify-center rounded-2xl border border-[#0e6f72]/35 bg-white px-5 py-4 text-center transition-all hover:bg-[#e8f7f6] hover:shadow-sm"
            >
              <div className="text-4xl font-bold text-foreground">{riskPercent}%</div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Risk Score</p>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                <ArrowUpRight className="h-3.5 w-3.5" />
                What this means
              </span>
            </button>
          </MetricExplainer>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Risk Signals */}
        {riskSummary.signals && riskSummary.signals.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Detected Signals</p>
            <div className="space-y-1.5">
              {riskSummary.signals.map((signal) => (
                <div
                  key={signal.id}
                  className={cn(
                    "enterprise-hover-raise flex items-start gap-2 rounded-2xl border p-4 text-xs shadow-[0_1px_0_rgba(14,111,114,0.03)]",
                    signal.severity === "high"
                      ? "border-red-200 bg-white text-red-700"
                      : "border-[#0e6f72]/35 bg-white text-[#14263f]"
                  )}
                >
                  <AlertCircle className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", signal.severity === "high" ? "text-red-600" : "text-[#0e6f72]")} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{signal.label}</p>
                    <p className="text-[11px] opacity-80">{signal.description}</p>
                  </div>
                  <MetricExplainer
                    label={`${Math.round(signal.risk_score * 100)}%`}
                    title={`${signal.label} score`}
                    summary={`This percentage reflects how strongly ${signal.label.toLowerCase()} is contributing to the current risk picture.`}
                    calculation={`The score is derived from recent check-in language, repair history, and pattern overlap. Signals become stronger when they recur, cluster together, or appear close in time.`}
                    source={signal.description}
                    coachingTips={(riskSummary.repairs || []).slice(0, 2).map((repair) => repair.actions?.[0]?.action).filter(Boolean)}
                  />
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
              {riskSummary.repairs.map((repair) => (
                <MicroRepairCollapsible key={repair.risk_id} repair={repair} />
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
