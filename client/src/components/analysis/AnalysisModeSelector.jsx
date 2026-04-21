import React from "react";
import { cn } from "@/lib/utils";

const MODES = [
  { key: "deep", label: "In-Depth", icon: "🔍" },
  { key: "explain", label: "Explain", icon: "💡" },
  { key: "recap", label: "60s Recap", icon: "⚡" },
  { key: "summary", label: "Summary", icon: "📋" },
  { key: "action", label: "Action Plan", icon: "✅" },
];

export default function AnalysisModeSelector({ value, onChange, disabled }) {
  return (
    <div className="flex flex-wrap gap-2">
      {MODES.map((m) => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          className={cn(
            "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5",
            value === m.key
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-card border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-accent/30",
            disabled && m.key !== value && "opacity-70"
          )}
          title={disabled && m.key !== value ? "Generate an analysis first, then switch modes instantly" : ""}
        >
          <span>{m.icon}</span>
          {m.label}
          {disabled && m.key !== value && <span className="text-[9px] text-muted-foreground/60">free</span>}
        </button>
      ))}
    </div>
  );
}