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
  TrendingDown,
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
  if (!riskSummary) {
    return null;
  }

  const config = STATUS_CONFIG[riskSummary.status] || STATUS_CONFIG.caution;
  const Icon = config.icon;
  const riskPercent = Math.round(riskSummary.overall_score * 100);

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

          {/* Risk Score Gauge */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="text-3xl font-bold text-foreground">{riskPercent}%</div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Risk Score</p>
          </div>
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
