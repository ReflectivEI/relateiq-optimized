/**
 * FrameworkCard — displays a single framework with explanation.
 * Shows: name, why applied, how it applies.
 * Expandable: "Explain the Science" reveals full explanation.
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SendPartnerPill from "@/components/ui/SendPartnerPill";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const COLOR_MAP = {
  blue: "border-blue-200 bg-blue-50",
  purple: "border-purple-200 bg-purple-50",
  green: "border-green-200 bg-green-50",
  orange: "border-orange-200 bg-orange-50",
  pink: "border-pink-200 bg-pink-50",
  gray: "border-slate-200 bg-slate-50",
};

const ICON_COLOR_MAP = {
  blue: "text-blue-600",
  purple: "text-purple-600",
  green: "text-green-600",
  orange: "text-orange-600",
  pink: "text-pink-600",
  gray: "text-slate-600",
};

export default function FrameworkCard({ framework }) {
  const [expanded, setExpanded] = useState(false);

  const colorClass = COLOR_MAP[framework.color] || COLOR_MAP.gray;
  const iconColorClass = ICON_COLOR_MAP[framework.color] || ICON_COLOR_MAP.gray;

  return (
    <Card className={cn("border", colorClass)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            <BookOpen className={cn("w-4 h-4 mt-0.5 shrink-0", iconColorClass)} />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold">{framework.framework}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{framework.why_applied}</p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0"
          >
            {expanded ? (
              <ChevronUp className={cn("w-4 h-4", iconColorClass)} />
            ) : (
              <ChevronDown className={cn("w-4 h-4", iconColorClass)} />
            )}
          </button>
        </div>
        <div className="pt-2">
          <SendPartnerPill
            content={{
              framework: framework.framework,
              whyApplied: framework.why_applied,
              howItApplies: framework.how_it_applies,
              explanation: framework.explanation,
            }}
            title={framework.framework}
            sourceLabel="Framework"
            className="h-7 px-3 text-xs"
          />
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-3">
          <div className="space-y-2 text-xs leading-relaxed">
            <p className="font-semibold text-foreground">How It Applies:</p>
            <p className="text-muted-foreground">{framework.how_it_applies}</p>
          </div>

          {framework.explanation && (
            <div className="rounded-lg bg-background/60 border border-border/50 p-3 text-xs space-y-2">
              <p className="font-semibold text-foreground">The Science:</p>
              <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {framework.explanation.trim()}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}