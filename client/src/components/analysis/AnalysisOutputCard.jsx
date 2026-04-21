import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTION_STYLES = {
  "Behavioral Patterns": "bg-blue-50 border-blue-200 text-blue-800",
  "Relationship Dynamics": "bg-purple-50 border-purple-200 text-purple-800",
  "Risk Flags": "bg-red-50 border-red-200 text-red-800",
  "Strengths": "bg-green-50 border-green-200 text-green-800",
  "Recommended Actions": "bg-teal-50 border-teal-200 text-teal-800",
  "Source Signals": "bg-slate-50 border-slate-200 text-slate-600",
  "Frameworks Applied": "bg-yellow-50 border-yellow-200 text-yellow-800",
  "What's actually happening": "bg-blue-50 border-blue-200 text-blue-800",
  "What this means for the relationship": "bg-purple-50 border-purple-200 text-purple-800",
  "Things to watch out for": "bg-red-50 border-red-200 text-red-800",
  "What's working": "bg-green-50 border-green-200 text-green-800",
  "Top Pattern": "bg-blue-50 border-blue-200 text-blue-800",
  "Key Dynamic": "bg-purple-50 border-purple-200 text-purple-800",
  "Main Risk": "bg-red-50 border-red-200 text-red-800",
  "Top Strength": "bg-green-50 border-green-200 text-green-800",
  "One Action": "bg-teal-50 border-teal-200 text-teal-800",
  "Immediate Steps": "bg-teal-50 border-teal-200 text-teal-800",
  "What to watch for (warnings)": "bg-red-50 border-red-200 text-red-800",
  "What's working in your favor": "bg-green-50 border-green-200 text-green-800",
};

function ConfidenceBar({ score }) {
  const pct = Math.round((score || 0) * 100);
  const color = pct >= 70 ? "bg-green-500" : pct >= 45 ? "bg-yellow-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>Confidence</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-24">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular-nums">{pct}%</span>
    </div>
  );
}

export default function AnalysisOutputCard({ analysis }) {
  if (!analysis?.display) return null;
  const { display, _label, perspective, analysis_type, frameworks_used } = analysis;

  return (
    <Card className="border border-primary/15 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{_label}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{perspective}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(frameworks_used || []).slice(0, 4).map((f) => (
              <Badge key={f} variant="outline" className="text-[10px] px-2 py-0.5">{f}</Badge>
            ))}
          </div>
        </div>
        {/* Core insight / prose headline */}
        <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/15">
          {display.is_prose ? (
            <p className="text-sm text-foreground leading-relaxed">{display.headline}</p>
          ) : (
            <p className="text-sm font-medium text-foreground leading-relaxed">{display.headline}</p>
          )}
        </div>
        {/* Derivation badge — proves no AI call was made for this mode */}
        {analysis._no_ai_call && analysis._mode !== "deep" && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] text-muted-foreground/50 font-mono">
              ✓ Derived from base · No AI call · mode={analysis._mode}
            </span>
          </div>
        )}
        <ConfidenceBar score={display.confidence} />
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {(display.sections || []).map((section) => {
          if (!section.items?.length) return null;
          const style = SECTION_STYLES[section.title] || "bg-muted/30 border-border/40 text-foreground";
          return (
            <div key={section.title} className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{section.title}</h4>
              <div className="space-y-1.5">
                {section.items.map((item, i) => (
                  <div key={i} className={cn("px-3 py-2 rounded-lg border text-xs leading-relaxed", style)}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}