import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MetricExplainer({
  label,
  triggerClassName = "",
  title = "What this means",
  summary,
  calculation,
  source,
  coachingTips = [],
  children,
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children || (
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-primary/35 bg-card px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:border-primary hover:bg-muted/50 hover:shadow-sm",
              triggerClassName
            )}
          >
            {label}
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] rounded-2xl border border-primary/20 bg-popover p-4 shadow-xl">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/5">
              <Info className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              {label && <p className="text-xs text-muted-foreground">{label}</p>}
            </div>
          </div>
          {summary && <p className="text-sm leading-6 text-muted-foreground">{summary}</p>}
          {calculation && (
            <div className="rounded-2xl border border-border/60 bg-muted/40 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">How it was calculated</p>
              <p className="mt-2 text-sm leading-6 text-foreground">{calculation}</p>
            </div>
          )}
          {source && (
            <div className="rounded-2xl border border-border/60 bg-card p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Where it comes from</p>
              <p className="mt-2 text-sm leading-6 text-foreground">{source}</p>
            </div>
          )}
          {coachingTips.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">How to improve it</p>
              <div className="space-y-2">
                {coachingTips.map((tip) => (
                  <div key={tip} className="flex gap-2 rounded-2xl border border-primary/15 bg-primary/5 p-3 text-sm text-foreground">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="leading-6">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
