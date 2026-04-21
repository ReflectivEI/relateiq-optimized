/**
 * CoachOutputModes — Multi-output mode selector for Coach responses.
 * Transform base response without additional AI calls.
 */
import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MODES = [
  { id: "full", label: "Full Guidance", tooltip: "Complete guidance with all sections" },
  { id: "explain", label: "Explain", tooltip: "Simplified explanation" },
  { id: "60second", label: "60-Second", tooltip: "Quick summary" },
  { id: "action", label: "Action Steps", tooltip: "Concrete steps only" },
  { id: "script", label: "What to Say", tooltip: "Conversation script" },
];

export default function CoachOutputModes({ mode, onModeChange }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Output Format</p>
      <Tabs value={mode} onValueChange={onModeChange}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {MODES.map((m) => (
            <TabsTrigger key={m.id} value={m.id} className="text-xs" title={m.tooltip}>
              {m.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}