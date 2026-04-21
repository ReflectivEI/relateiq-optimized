/**
 * DataSourceBadge — shows exactly which real data points informed the AI output.
 * Placed beneath any AI-generated result to build trust that it's personal, not generic.
 */
import React from "react";
import { Database } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DataSourceBadge({ sources = [], className }) {
  const active = sources.filter((s) => s.count > 0);
  if (active.length === 0) return null;

  return (
    <div className={cn("flex items-start gap-2 px-3 py-2.5 rounded-lg bg-muted/40 border border-border/40", className)}>
      <Database className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        <span className="text-[11px] text-muted-foreground font-medium mr-1">Based on your data:</span>
        {active.map((s) => (
          <span key={s.label} className="text-[11px] text-muted-foreground">
            {s.count} {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}