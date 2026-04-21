/**
 * PatternEvolutionList — shows which behavioral patterns have appeared most
 * frequently across all saved insights, and which are newly emerging vs recurring.
 */
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertTriangle } from "lucide-react";

function countPatterns(entries) {
  const counts = {};
  entries.forEach((e) => {
    (e.behavioral_patterns || []).forEach((p) => {
      const key = p.toLowerCase().slice(0, 60);
      if (!counts[key]) counts[key] = { text: p, count: 0 };
      counts[key].count++;
    });
  });
  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function countRisks(entries) {
  const counts = {};
  entries.forEach((e) => {
    (e.risk_flags || []).forEach((r) => {
      const key = r.toLowerCase().slice(0, 60);
      if (!counts[key]) counts[key] = { text: r, count: 0 };
      counts[key].count++;
    });
  });
  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export default function PatternEvolutionList({ entries }) {
  if (!entries || entries.length < 2) return null;

  const patterns = countPatterns(entries);
  const risks = countRisks(entries);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="border border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-primary" />
            Recurring Patterns
          </CardTitle>
          <p className="text-xs text-muted-foreground">Most frequently detected across all saved analyses</p>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {patterns.map((p, i) => (
            <div key={i} className="flex items-start justify-between gap-2">
              <p className="text-xs text-foreground leading-relaxed flex-1">{p.text}</p>
              <Badge
                variant="outline"
                className={`text-[10px] shrink-0 ${p.count >= 3 ? "border-primary/40 text-primary" : ""}`}
              >
                x{p.count}
              </Badge>
            </div>
          ))}
          {patterns.length === 0 && (
            <p className="text-xs text-muted-foreground">No patterns yet. Generate more analyses to see trends.</p>
          )}
        </CardContent>
      </Card>

      <Card className="border border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Recurring Risks
          </CardTitle>
          <p className="text-xs text-muted-foreground">Risk flags that keep appearing over time</p>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {risks.map((r, i) => (
            <div key={i} className="flex items-start justify-between gap-2">
              <p className="text-xs text-foreground leading-relaxed flex-1">{r.text}</p>
              <Badge
                variant="outline"
                className={`text-[10px] shrink-0 ${r.count >= 3 ? "border-orange-400/60 text-orange-600" : ""}`}
              >
                x{r.count}
              </Badge>
            </div>
          ))}
          {risks.length === 0 && (
            <p className="text-xs text-muted-foreground">No recurring risks yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}