/**
 * TracePanel.jsx — Transparency Layer
 * Shows "How this was generated" for every AI output
 * Displays patterns, traits, rules, frameworks used.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TracePanel({ trace, metadata = {} }) {
  const [expanded, setExpanded] = useState(false);

  if (!trace || trace.length === 0) return null;

  const successSteps = trace.filter((t) => !t.step.includes("error"));
  const errorStep = trace.find((t) => t.step.includes("error"));

  return (
    <Card className="mt-4 border-border/40 bg-muted/20">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">How this was generated</h3>
          <Badge variant="outline" className="text-[10px]">
            {successSteps.length} steps
          </Badge>
          {errorStep && <Badge variant="destructive" className="text-[10px]">Error</Badge>}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <CardContent className="pt-0 pb-4 space-y-3 border-t border-border/40">
          {/* Timeline */}
          <div className="space-y-2">
            {trace.map((step, i) => {
              const isError = step.step.includes("error");
              const isComplete = step.step.includes("ready") || step.step.includes("computed");

              return (
                <div key={i} className="flex gap-3">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center pt-0.5">
                    <div
                      className={cn(
                        "w-2.5 h-2.5 rounded-full border-2",
                        isError ? "bg-red-500 border-red-600" : "bg-primary border-primary",
                      )}
                    />
                    {i < trace.length - 1 && <div className="w-0.5 h-6 bg-border/30" />}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <p className={cn("text-xs font-semibold", isError ? "text-red-700" : "text-foreground")}>
                      {step.message}
                    </p>
                    {step.data && (
                      <details className="mt-1">
                        <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground">
                          View details
                        </summary>
                        <pre className="mt-1 p-2 bg-background/50 rounded text-[9px] text-muted-foreground overflow-x-auto whitespace-pre-wrap break-words">
                          {step.data}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Metadata */}
          {metadata.patterns && (
            <div className="pt-2 border-t border-border/30 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Patterns Used</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(metadata.patterns)
                  .filter(([, v]) => v > 0.5)
                  .map(([key, value]) => (
                    <Badge key={key} variant="secondary" className="text-[10px]">
                      {key} ({Math.round(value * 100)}%)
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          {metadata.frameworks && metadata.frameworks.length > 0 && (
            <div className="pt-2 border-t border-border/30 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Frameworks Applied</p>
              <div className="flex flex-wrap gap-1.5">
                {metadata.frameworks.map((fw) => (
                  <Badge key={fw} variant="outline" className="text-[10px]">
                    {fw}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {metadata.perspective && (
            <div className="pt-2 border-t border-border/30 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Perspective</p>
              <p className="text-xs text-foreground font-mono">{metadata.perspective}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}