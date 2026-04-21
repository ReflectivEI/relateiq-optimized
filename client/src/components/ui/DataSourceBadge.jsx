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

  const formatted = active.map((s, index) => {
    const phrase = `${s.count} ${s.label}`;
    if (active.length === 1) return phrase;
    if (index === active.length - 1) return `and ${phrase}`;
    return phrase;
  }).join(active.length > 2 ? ", " : " ");

  return (
    <div className={cn("rounded-2xl border border-border/50 bg-white px-4 py-3", className)}>
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/15 bg-primary/5">
          <Database className="h-3.5 w-3.5 text-primary shrink-0" />
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Data Sources</p>
          <p className="text-sm leading-6 text-foreground">
            This profile summary is grounded in {formatted}.
          </p>
        </div>
      </div>
    </div>
  );
}
