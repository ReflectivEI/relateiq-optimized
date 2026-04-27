/**
 * PredictionCard — renders a predictOutcome() result.
 * Sections: predicted behavior, emotional state, risk, misinterpretation,
 * preemptive action, drivers (expandable), trace panel (expandable).
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SendPartnerPill from "@/components/ui/SendPartnerPill";
import { ChevronDown, ChevronUp, AlertTriangle, Brain, Eye, Zap, ShieldCheck, Route } from "lucide-react";
import { cn } from "@/lib/utils";

const RISK_STYLES = {
  low:    { badge: "border-teal-500 bg-[#14263f] text-white", bar: "bg-primary"  },
  medium: { badge: "border-teal-500 bg-white text-[#14263f]", bar: "bg-primary" },
  high:   { badge: "border-red-500 bg-white text-red-700", bar: "bg-red-500" },
};

function Section({ icon: Icon, label, children, accent = "text-primary" }) {
  return (
    <div className="space-y-1.5">
      <div className={cn("flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider", accent)}>
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="text-sm text-foreground leading-relaxed">{children}</div>
    </div>
  );
}

function DriverBar({ driver }) {
  const pct = Math.round((driver.score / 10) * 100);
  const color = pct >= 70 ? "bg-primary" : pct >= 50 ? "bg-yellow-500" : "bg-slate-400";
  return (
    <div className="space-y-1 py-2 border-b border-border/30 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-foreground">{driver.trait}</span>
        <span className="text-[10px] tabular-nums text-muted-foreground">{driver.score}/10</span>
      </div>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug">{driver.influence}</p>
    </div>
  );
}

function TraceRow({ label, children }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

export default function PredictionCard({ prediction }) {
  const [driversOpen, setDriversOpen] = useState(false);
  const [traceOpen, setTraceOpen] = useState(false);

  if (!prediction) return null;

  const risk = RISK_STYLES[prediction.risk_level] || RISK_STYLES.medium;
  const trace = prediction.trace || {};

  const readableSections = [
    {
      title: "Predicted Behavior",
      subtitle: "What the model expects the actor to do first",
      icon: Zap,
      content: prediction.predicted_behavior,
      accent: "text-primary",
    },
    {
      title: "Emotional State",
      subtitle: "How the actor is likely to be feeling internally",
      icon: Eye,
      content: prediction.emotional_state,
      accent: "text-primary",
    },
    {
      title: "Likely Misinterpretation",
      subtitle: "What the other person may assume if nothing changes",
      icon: AlertTriangle,
      content: prediction.likely_misinterpretation,
      accent: "text-primary",
    },
    {
      title: "Recommended Preemptive Action",
      subtitle: "The cleanest move to lower risk before the conversation escalates",
      icon: ShieldCheck,
      content: prediction.recommended_preemptive_action,
      accent: "text-primary",
    },
  ];

  return (
    <Card className="enterprise-panel border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            Prediction: {prediction.actor} → {prediction.target}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs border font-medium", risk.badge)}>
              {prediction.risk_level === "high" ? "High Risk" : prediction.risk_level === "medium" ? "Medium Risk" : "Low Risk"}
            </Badge>
            {prediction.scenario_label && (
              <Badge variant="outline" className="text-[10px]">{prediction.scenario_label}</Badge>
            )}
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Deterministic · No AI · {new Date(prediction.computed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
        <div className="pt-2">
          <SendPartnerPill
            content={prediction}
            title={`Prediction: ${prediction.actor} to ${prediction.target}`}
            sourceLabel="Analysis Prediction"
            className="h-7 px-3 text-xs"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-4">
          {readableSections.map((section) => (
            <div key={section.title} className="enterprise-panel-muted rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <section.icon className={cn("h-4 w-4", section.accent)} />
                <p className="text-sm font-semibold text-foreground">{section.title}</p>
              </div>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {section.subtitle}
              </p>
              <p className="mt-2.5 text-[15px] leading-6 text-foreground">{section.content}</p>
            </div>
          ))}
        </div>

        {/* Drivers — expandable */}
        {prediction.drivers?.length > 0 && (
          <div className="rounded-[1.1rem] border border-border/50 overflow-hidden">
            <button
              onClick={() => setDriversOpen(!driversOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
            >
              <span className="text-xs font-semibold text-foreground">What is driving this?</span>
              {driversOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {driversOpen && (
              <div className="px-4 pb-3 pt-1">
                {prediction.drivers.map((d, i) => (
                  <DriverBar key={i} driver={d} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Trace Panel — expandable */}
        <div className="rounded-[1.1rem] border border-border/50 overflow-hidden">
          <button
            onClick={() => setTraceOpen(!traceOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Route className="w-3.5 h-3.5" />
              Rule Trace
            </span>
            {traceOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {traceOpen && (
            <div className="px-4 pb-4 pt-3 space-y-4 text-sm">

              <TraceRow label="Scenario Matched">
                <p className="text-foreground">{trace.scenario_matched} <span className="text-muted-foreground">({trace.scenario_id})</span></p>
                <p className="text-muted-foreground">Category: {trace.scenario_category} · Match confidence: {Math.round((trace.scenario_confidence || 0) * 100)}%</p>
              </TraceRow>

              {trace.trigger_words_found?.length > 0 && (
                <TraceRow label="Trigger Words Found">
                  <div className="flex flex-wrap gap-1 mt-1">
                    {trace.trigger_words_found.map((w, i) => (
                      <span key={i} className="rounded-full border border-teal-500/35 bg-[#14263f] px-2 py-1 text-[11px] font-semibold text-white">{w}</span>
                    ))}
                  </div>
                </TraceRow>
              )}

              {trace.behavior_rules_applied?.length > 0 && (
                <TraceRow label="Behavior Rules Applied">
                  {trace.behavior_rules_applied.map((r, i) => (
                    <p key={i} className="text-foreground/80"><span className="text-primary">[{r.id}]</span> {r.description}</p>
                  ))}
                </TraceRow>
              )}

              {trace.emotional_rules_applied?.length > 0 && (
                <TraceRow label="Emotional State Rules Applied">
                  {trace.emotional_rules_applied.map((r, i) => (
                    <p key={i} className="text-foreground/80"><span className="text-purple-500">[{r.id}]</span> {r.description}</p>
                  ))}
                </TraceRow>
              )}

              {trace.misinterp_rules_applied?.length > 0 && (
                <TraceRow label="Misinterpretation Rules Applied">
                  {trace.misinterp_rules_applied.map((r, i) => (
                    <p key={i} className="text-foreground/80"><span className="text-orange-500">[{r.id}]</span> {r.description}</p>
                  ))}
                </TraceRow>
              )}

              {trace.preemptive_rules_applied?.length > 0 && (
                <TraceRow label="Preemptive Action Rules Applied">
                  {trace.preemptive_rules_applied.map((r, i) => (
                    <p key={i} className="text-foreground/80"><span className="text-green-600">[{r.id}]</span> {r.description}</p>
                  ))}
                </TraceRow>
              )}

              <TraceRow label="Risk Computation Factors">
                {trace.risk_computation?.factors_considered?.map((f, i) => (
                  <p key={i} className="text-foreground/70">{f}</p>
                ))}
                <p className="mt-1 font-semibold text-foreground">→ Result: {trace.risk_computation?.result}</p>
              </TraceRow>

              {trace.all_scenario_matches?.length > 1 && (
                <TraceRow label="Other Scenario Candidates">
                  {trace.all_scenario_matches.slice(1).map((m, i) => (
                    <p key={i} className="text-muted-foreground">{m.label} ({m.confidence})</p>
                  ))}
                </TraceRow>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
