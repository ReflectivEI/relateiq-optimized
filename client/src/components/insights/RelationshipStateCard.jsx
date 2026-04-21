/**
 * RelationshipStateCard.jsx
 * Displays current relationship state, trend, and confidence
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const STATE_CONFIG = {
  volatile: {
    label: "Volatile",
    color: "bg-red-50 border-red-200",
    textColor: "text-red-800",
    icon: "⚠️",
    description: "High tension — immediate de-escalation needed",
  },
  strained: {
    label: "Strained",
    color: "bg-orange-50 border-orange-200",
    textColor: "text-orange-800",
    icon: "⚡",
    description: "Navigating friction — repair focus recommended",
  },
  stable: {
    label: "Stable",
    color: "bg-blue-50 border-blue-200",
    textColor: "text-blue-800",
    icon: "⚓",
    description: "Balanced foundation — continue growth",
  },
  improving: {
    label: "Improving",
    color: "bg-green-50 border-green-200",
    textColor: "text-green-800",
    icon: "📈",
    description: "Positive momentum building",
  },
  initializing: {
    label: "Initializing",
    color: "bg-slate-50 border-slate-200",
    textColor: "text-slate-700",
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
      <Minus className="w-5 h-5 text-slate-400" />
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
            <div className="text-3xl font-bold text-slate-700">
              {(intelligence.confidence * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">confidence</p>
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