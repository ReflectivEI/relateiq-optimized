import React from "react";
import { Search, Lightbulb, Zap, ClipboardList, CheckSquare2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MODES = [
  { key: "deep", label: "In-Depth", icon: Search },
  { key: "explain", label: "Explain", icon: Lightbulb },
  { key: "recap", label: "60s Recap", icon: Zap },
  { key: "summary", label: "Summary", icon: ClipboardList },
  { key: "action", label: "Action Plan", icon: CheckSquare2 },
];

export default function AnalysisModeSelector({ value, onChange, disabled }) {
  return (
    <div className="flex flex-wrap gap-2">
      {MODES.map((m) => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          className={cn(
            "enterprise-option-pill",
            value === m.key && "enterprise-option-pill-active",
            disabled && m.key !== value && "opacity-70"
          )}
          title={disabled && m.key !== value ? "Generate an analysis first, then switch modes instantly" : ""}
        >
          <m.icon className={cn("h-4 w-4", value === m.key ? "text-white" : "text-primary")} />
          {m.label}
        </button>
      ))}
    </div>
  );
}
