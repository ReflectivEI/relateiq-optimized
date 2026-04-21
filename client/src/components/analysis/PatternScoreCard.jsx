/**
 * PatternScoreCard — shows all 8 locked traits with score, confidence,
 * and a per-trait "Why this score?" expandable evidence panel.
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function ScoreBar({ score }) {
  const pct = Math.round((score / 10) * 100);
  const color =
    pct >= 70 ? "bg-primary" :
    pct >= 40 ? "bg-yellow-500" :
    "bg-slate-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums font-mono w-8 text-right text-foreground">{score}/10</span>
    </div>
  );
}

function TraitRow({ traitKey, trait }) {
  const [open, setOpen] = useState(false);
  const confPct = Math.round((trait.confidence || 0) * 100);
  const hasEvidence = trait.evidence?.length > 0;
  const d = trait._debug || {};

  return (
    <div className="space-y-1.5 py-2 border-b border-border/30 last:border-0">
      {/* Trait name + confidence */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-foreground">{trait.label}</span>
        <span className="text-[10px] text-muted-foreground/60 tabular-nums shrink-0">{confPct}% conf.</span>
      </div>

      {/* Score bar */}
      <ScoreBar score={trait.score} />

      {/* "Why this score?" toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[11px] text-primary/60 hover:text-primary transition-colors"
      >
        <HelpCircle className="w-3 h-3" />
        Why this score?
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {/* Evidence panel */}
      {open && (
        <div className="mt-1 rounded-lg bg-muted/30 border border-border/40 p-3 space-y-3 text-[11px]">
          {/* Scoring math */}
          <div className="font-mono text-muted-foreground space-y-0.5">
            <p>baseline = {d.baseline ?? 5}</p>
            <p>Δ delta  = {d.total_delta >= 0 ? "+" : ""}{d.total_delta ?? 0}</p>
            <p className="font-semibold text-foreground">final score = {trait.score}/10</p>
            <p className="text-muted-foreground/50">
              {d.rules_matched ?? 0} rule{d.rules_matched !== 1 ? "s" : ""} triggered
              · {d.rules_with_data ?? 0}/{d.rules_total ?? 0} questions answered
            </p>
          </div>

          {/* Evidence list */}
          {hasEvidence ? (
            <div className="space-y-2">
              <p className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px]">Evidence</p>
              {trait.evidence.map((e, i) => (
                <div key={i} className="rounded bg-background/60 border border-border/30 px-2.5 py-2 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-primary/70">[{e.question_id}]</span>
                    <span className={cn(
                      "font-semibold tabular-nums shrink-0",
                      e.weight > 0 ? "text-green-600" : "text-red-500"
                    )}>
                      {e.weight > 0 ? "+" : ""}{e.weight}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-primary/80 bg-primary/5 rounded px-1.5 py-0.5 inline-block">
                    rule: {e.rule_triggered}
                  </p>
                  {e.answer_snippet && (
                    <p className="text-foreground/70 italic">"{e.answer_snippet}"</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground/60 italic">
              No matching answers found — score reflects the baseline ({d.baseline ?? 5}/10).
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function PatternScoreCard({ profile, person }) {
  if (!profile?.traits) return null;

  return (
    <Card className="border border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>{person}'s Pattern Scores</span>
          <span className="text-xs text-muted-foreground font-normal">{profile.total_responses} responses</span>
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">
          Deterministic · 8 locked traits · rule-based · {profile.computed_at?.slice(0, 10)}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {Object.entries(profile.traits).map(([key, trait]) => (
          <TraitRow key={key} traitKey={key} trait={trait} />
        ))}
      </CardContent>
    </Card>
  );
}