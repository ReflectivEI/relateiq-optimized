/**
 * RelationshipStateCard.jsx
 * Displays current relationship state, trend, and confidence
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import MetricExplainer from "@/components/ui/MetricExplainer";

const STATE_CONFIG = {
  volatile: {
    label: "Volatile",
    color: "bg-red-50 border-red-200 dark:bg-red-950/25 dark:border-red-800/70",
    textColor: "text-red-800 dark:text-red-300",
    icon: "⚠️",
    description: "High tension — immediate de-escalation needed",
  },
  strained: {
    label: "Strained",
    color: "bg-orange-50 border-orange-200 dark:bg-orange-950/25 dark:border-orange-800/70",
    textColor: "text-orange-800 dark:text-orange-300",
    icon: "⚡",
    description: "Navigating friction — repair focus recommended",
  },
  stable: {
    label: "Stable",
    color: "bg-blue-50 border-blue-200 dark:bg-blue-950/25 dark:border-blue-800/70",
    textColor: "text-blue-800 dark:text-blue-300",
    icon: "⚓",
    description: "Balanced foundation — continue growth",
  },
  improving: {
    label: "Improving",
    color: "bg-green-50 border-green-200 dark:bg-green-950/25 dark:border-green-800/70",
    textColor: "text-green-800 dark:text-green-300",
    icon: "📈",
    description: "Positive momentum building",
  },
  initializing: {
    label: "Initializing",
    color: "bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700",
    textColor: "text-slate-700 dark:text-slate-200",
    icon: "🔄",
    description: "Gathering data...",
  },
};

export default function RelationshipStateCard({ intelligence, trend = "→" }) {
  const config = STATE_CONFIG[intelligence.relationship_state] || STATE_CONFIG.initializing;

  const trendIcon =
    trend === "↑ improving" ? (
      <TrendingUp className="w-5 h-5 text-green-600" />
    ) : trend === "↓ declining" ? (
      <TrendingDown className="w-5 h-5 text-red-600" />
    ) : (
      <Minus className="w-5 h-5 text-slate-400 dark:text-slate-300" />
    );

  return (
    <Card className={`border-2 ${config.color}`}>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <span className="text-3xl">{config.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className={`font-display text-2xl font-bold ${config.textColor}`}>
                  {config.label}
                </h2>
                <div className="flex items-center gap-1">{trendIcon}</div>
              </div>
              <p className={`text-sm ${config.textColor}`}>{config.description}</p>
            </div>
          </div>
          <div className="text-right">
            <MetricExplainer
              label={`${(intelligence.confidence * 100).toFixed(0)}% confidence`}
              title="What this confidence score means"
              summary="This percentage reflects how much real relationship data the system has available to support the current state reading."
              calculation={`The current engine scales confidence upward as more cross-page evidence accumulates, capped to avoid overstating certainty. Data points used: ${intelligence.metrics?.data_points || 0}.`}
              source={`Average mood signal: ${Number(intelligence.metrics?.avg_mood || 0).toFixed(1)} / 5. Repair success rate: ${Math.round((intelligence.metrics?.repair_success_rate || 0) * 100)}%.`}
            >
              <button type="button" className="rounded-xl px-2 py-1 text-right transition-colors hover:bg-white/60 dark:hover:bg-background/60">
                <div className="text-3xl font-bold text-slate-700 dark:text-slate-100">
                  {(intelligence.confidence * 100).toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground">confidence</p>
              </button>
            </MetricExplainer>
          </div>
        </div>

        <div className="pt-2 border-t border-current/10">
          <p className="text-sm font-semibold text-foreground mb-1">Focus:</p>
          <p className="text-sm text-muted-foreground">{intelligence.recommended_focus}</p>
        </div>
      </CardContent>
    </Card>
  );
}
