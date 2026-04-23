import React from "react";
import { cn } from "@/lib/utils";
import { UserRound, ArrowRightLeft } from "lucide-react";
import { getPerspectiveLabels } from "@/lib/relationshipParticipants";

export default function PerspectiveToggle({ value, onChange, options, labels = {}, participants = ["Tony", "Drew"] }) {
  const resolvedLabels = { ...getPerspectiveLabels(participants), ...labels };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "enterprise-option-pill",
            value === opt && "enterprise-option-pill-active"
          )}
        >
          {opt.includes("→") ? (
            <ArrowRightLeft className={cn("h-4 w-4", value === opt ? "text-white" : "text-primary")} />
          ) : (
            <UserRound className={cn("h-4 w-4", value === opt ? "text-white" : "text-primary")} />
          )}
          {resolvedLabels[opt] || opt}
        </button>
      ))}
    </div>
  );
}
