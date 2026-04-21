/**
 * DeltaCard — shows structural differences when user switches perspectives.
 * Proves outputs are distinct, not reused or reworded.
 */
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DeltaCard({ delta }) {
  if (!delta || !delta.key_differences?.length) return null;

  const confChange = delta.alignment_score_change;
  const ConfIcon = confChange > 0.05 ? TrendingUp : confChange < -0.05 ? TrendingDown : Minus;
  const confColor = confChange > 0.05 ? "text-green-600" : confChange < -0.05 ? "text-red-500" : "text-muted-foreground";

  return (
    <Card className="border border-primary/20 bg-primary/3">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-primary" />
            Perspective Delta: <span className="font-mono text-primary">{delta.perspectives_compared}</span>
          </div>
          <span className="text-xs font-normal text-muted-foreground">
            Insight overlap: {delta.insight_word_overlap_pct}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          {delta.key_differences.map((d, i) => (
            <div key={i} className="px-3 py-2 rounded-lg bg-card border border-border/50 text-xs text-foreground">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-muted/40 border border-border/40 text-center">
            <p className="text-muted-foreground mb-0.5">Risk Shift</p>
            <p className="font-medium text-foreground">{delta.risk_shift}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/40 border border-border/40 text-center">
            <p className="text-muted-foreground mb-0.5">Confidence Δ</p>
            <p className={cn("font-semibold flex items-center justify-center gap-1", confColor)}>
              <ConfIcon className="w-3 h-3" />
              {confChange > 0 ? "+" : ""}{Math.round(confChange * 100)}%
            </p>
          </div>
          <div className="p-2 rounded-lg bg-muted/40 border border-border/40 text-center">
            <p className="text-muted-foreground mb-0.5">New Risks</p>
            <p className="font-medium text-foreground">{delta.new_risks?.length || 0}</p>
          </div>
        </div>

        {delta.new_risks?.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">New risks in this perspective</p>
            {delta.new_risks.slice(0, 2).map((r, i) => (
              <div key={i} className="px-2 py-1.5 rounded bg-red-50 border border-red-200 text-[11px] text-red-800">{r}</div>
            ))}
          </div>
        )}
        {delta.dropped_risks?.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Risks no longer applicable</p>
            {delta.dropped_risks.slice(0, 2).map((r, i) => (
              <div key={i} className="px-2 py-1.5 rounded bg-muted/40 border border-border/40 text-[11px] text-muted-foreground line-through">{r}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}