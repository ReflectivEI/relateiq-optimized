import React from "react";
import { cn } from "@/lib/utils";

const LABELS = {
  "Tony": "Tony (Individual)",
  "Drew": "Drew (Individual)",
  "Tony→Drew": "Tony → Drew",
  "Drew→Tony": "Drew → Tony",
};

export default function PerspectiveToggle({ value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
            value === opt
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-card border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-accent/30"
          )}
        >
          {LABELS[opt] || opt}
        </button>
      ))}
    </div>
  );
}