/**
 * CoachOutputModes — Multi-output mode selector for Coach responses.
 * Selects specialized coaching views (full explainability, robust summary,
 * adaptive action plan, and dynamic script guidance).
 */
import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MODES = [
  { id: "full", label: "Full Guidance", tooltip: "Complete guidance with all sections" },
  { id: "explain", label: "Explain", tooltip: "Why this guidance was generated and what evidence it is based on" },
  { id: "60second", label: "60-Second", tooltip: "Compressed but complete briefing of the full guidance" },
  { id: "action", label: "Action Steps", tooltip: "Tailored, scenario-specific execution plan" },
  { id: "script", label: "What to Say", tooltip: "Dynamic scripts for likely response paths" },
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