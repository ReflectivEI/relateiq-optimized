import React, { useState, useEffect, useRef } from "react";
import { api } from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Loader2, RefreshCw, ArrowLeftRight, TrendingUp, AlertTriangle,
  Heart, Zap, ChevronDown, ChevronUp, Lightbulb, ShieldCheck,
  BookOpen, MessageCircle, CalendarCheck, HelpCircle, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  buildInsightsPrompt,
  buildDynamicUpdatePrompt,
  buildContextInsightsPrompt,
} from "@/lib/prompts";
import { buildContextObject } from "@/lib/aiCoachService";
import AskCoachDrawer from "@/components/ai/AskCoachDrawer";
import ExportBar from "@/components/ai/ExportBar";
import AIProgressLog from "@/components/insights/AIProgressLog";
import AskAIFollowUp from "@/components/insights/AskAIFollowUp";
import InsightTierBanner from "@/components/profile/InsightTierBanner";
import { safeInvokeLLM, buildFallbackContextInsights, validateContextInsightsOutput, validateDeepInsightsOutput, normalizeContextInsights, normalizeDeepInsights, CreditLimitError } from "@/lib/aiSafe";
import DataSourceBadge from "@/components/ui/DataSourceBadge";
import AILoadingState from "@/components/ui/AILoadingState";
import FallbackBadge from "@/components/ui/FallbackBadge";
import PrivacyBanner from "@/components/ui/PrivacyBanner";
import CreditLimitBanner from "@/components/ui/CreditLimitBanner";
import ResponseExportBar from "@/components/export/ResponseExportBar";
import NotesPanel from "@/components/notes/NotesPanel";
import { synthesizeRelationshipIntelligence, getStateTrend } from "@/lib/relationshipIntelligenceEngine";
import RelationshipStateCard from "@/components/insights/RelationshipStateCard";
import PatternDriftTracker from "@/components/insights/PatternDriftTracker";
import InsightTimeline from "@/components/insights/InsightTimeline";
import { computePatternProfile } from "@/lib/patternEngine";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import {
  containsForeignParticipantNames,
  getForeignParticipantNames,
  isPerspectiveInActivePair,
  getRelationshipTerms,
  presentRelationshipText,
} from "@/lib/relationshipParticipants";

const CONFIDENCE_CONFIG = {
  early_signal: { label: "Early Signal", color: "bg-orange-100 text-orange-700 border-orange-200" },
  moderate: { label: "Moderate Confidence", color: "bg-blue-100 text-blue-700 border-blue-200" },
  high: { label: "High Confidence", color: "bg-green-100 text-green-700 border-green-200" },
};

// ─── SOURCE DATA PANEL ────────────────────────────────────────────────────────

const SOURCE_ITEMS = [
  { key: "coach", icon: MessageCircle, label: "AI Coach sessions" },
  { key: "tools", icon: Zap, label: "Smart Tools entries" },
  { key: "checkins", icon: CalendarCheck, label: "Weekly Check-Ins" },
  { key: "questionnaire", icon: HelpCircle, label: "Questionnaire answers" },
];

function buildEntryText(entry) {
  return [
    entry.perspective,
    entry.core_insight,
    entry.scenario,
    ...(entry.behavioral_patterns || []),
    ...(entry.relationship_dynamics || []),
    ...(entry.risk_flags || []),
    ...(entry.strengths || []),
    entry.note,
    ...(entry.recommended_actions || []),
    entry.full_output_json,
  ]
    .filter(Boolean)
    .join("\n");
}

function isEntryVisibleForParticipants(entry, hiddenParticipantNames) {
  const haystack = buildEntryText(entry);
  if (!haystack) return true;
  return !containsForeignParticipantNames(haystack, hiddenParticipantNames);
}

function buildDynamicText(dynamic) {
  return [
    dynamic?.ai_dynamic_summary,
    dynamic?.context_insights_json,
    dynamic?.deep_insights_json,
    dynamic?.recommendation_snapshot,
  ]
    .filter(Boolean)
    .join("\n");
}

function isDynamicVisibleForParticipants(dynamic, hiddenParticipantNames) {
  return !containsForeignParticipantNames(buildDynamicText(dynamic), hiddenParticipantNames);
}

function DataAvailableBar({ tonyResponses, drewResponses, sessions, checkIns }) {
  const coachCount = sessions.filter((s) => s.tool_type === "coach").length;
  const toolsCount = sessions.filter((s) => s.tool_type !== "coach").length;
  const totalQ = tonyResponses.length + drewResponses.length;
  const total = coachCount + toolsCount + checkIns.length + totalQ;

  const items = [
    { key: "coach", count: coachCount },
    { key: "tools", count: toolsCount },
    { key: "checkins", count: checkIns.length },
    { key: "questionnaire", count: totalQ },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
      <span className="font-medium uppercase tracking-wide text-[10px]">Data available:</span>
      {total === 0 ? (
        <span className="text-muted-foreground/60 italic">No data yet — start with AI Coach or a Check-In</span>
      ) : (
        items.filter((i) => i.count > 0).map((item) => {
          const def = SOURCE_ITEMS.find((s) => s.key === item.key);
          return (
            <span key={item.key} className="flex items-center gap-1">
              <def.icon className="w-3 h-3" />
              {item.count} {def.label.split(" ").slice(-1)[0]}
            </span>
          );
        })
      )}
    </div>
  );
}

function ModeCard({ icon: Icon, title, badge, description, sources, locked, onClick, loading, active }) {
  const colorway = title === "Context Insights"
    ? {
        card: "border-[#14263f]/25 bg-[#eef4fb]",
        iconWrap: "bg-white border-[#14263f]/20",
        icon: "text-[#14263f]",
      }
    : {
        card: "border-[#0e6f72]/25 bg-[#e8f7f6]",
        iconWrap: "bg-white border-[#0e6f72]/20",
        icon: "text-[#0e6f72]",
      };

  return (
    <Card
      className={`border-2 transition-all ${colorway.card} ${locked ? "opacity-60" : "cursor-pointer hover:shadow-sm"} ${active ? "ring-2 ring-primary/20" : ""}`}
      onClick={!locked ? onClick : undefined}
    >
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${colorway.iconWrap}`}>
            <Icon className={`w-4 h-4 ${locked ? "text-muted-foreground" : colorway.icon}`} />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-semibold text-sm text-[#14263f]">{title}</span>
            {badge && <Badge variant="outline" className="text-[10px] shrink-0">{badge}</Badge>}
          </div>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        {sources && (
          <div className="space-y-1.5">
            {sources.map((s) => (
              <div key={s.key} className="flex items-center gap-2 text-xs text-muted-foreground">
                <s.icon className="w-3.5 h-3.5 shrink-0" />
                {s.label}
              </div>
            ))}
          </div>
        )}
        {locked && (
          <p className="text-xs text-muted-foreground/60 italic">
            Head to Profiles → generate profiles for both people to unlock this mode.
          </p>
        )}
        {!locked && (
          <Button
            type="button"
            size="sm"
            className="mt-2 w-full gap-2"
            onClick={(event) => {
              event.stopPropagation();
              onClick?.();
            }}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {loading ? "Generating…" : `Generate ${title}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── CONTEXT INSIGHTS VIEW ────────────────────────────────────────────────────

function ContextInsightsView({ insights, ctx, contentRef, insightId, participants, relationshipLabel, activeRelationship }) {
  const conf = CONFIDENCE_CONFIG[insights.confidence_level] || CONFIDENCE_CONFIG.early_signal;

  return (
    <div className="space-y-5" ref={contentRef}>
      <div className="flex items-center gap-3 flex-wrap">
        <Badge className={`${conf.color} border font-normal`}>{conf.label}</Badge>
        {insights.confidence_explanation && (
          <p className="text-xs text-muted-foreground">{insights.confidence_explanation}</p>
        )}
      </div>

      {/* What the system sees */}
      <Card className="bg-primary/5 border-primary/15">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
            <Lightbulb className="w-4 h-4" /> What The System Is Seeing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-foreground leading-relaxed">{presentRelationshipText(insights.what_system_sees, participants, activeRelationship)}</p>
          {insights.what_this_means && (
            <p className="text-sm text-muted-foreground leading-relaxed pt-2 border-t border-primary/10">{presentRelationshipText(insights.what_this_means, participants, activeRelationship)}</p>
          )}
          {ctx && (
            <AskAIFollowUp
              ctx={ctx}
              sectionTitle="What The System Is Seeing"
              sectionContent={`${presentRelationshipText(insights.what_system_sees, participants, activeRelationship)}\n\n${presentRelationshipText(insights.what_this_means || "", participants, activeRelationship)}`}
            />
          )}
        </CardContent>
      </Card>

      {/* Emerging Patterns */}
      {insights.emerging_patterns?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-400" /> Emerging Patterns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {insights.emerging_patterns.map((p, i) => (
              <div key={i} className="p-3 rounded-lg bg-orange-50 border border-orange-100">
                <p className="text-sm font-semibold text-foreground">{presentRelationshipText(p.title, participants, activeRelationship)}</p>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{presentRelationshipText(p.description, participants, activeRelationship)}</p>
              </div>
            ))}
            {ctx && (
              <AskAIFollowUp
                ctx={ctx}
                sectionTitle="Emerging Patterns"
                sectionContent={insights.emerging_patterns.map((p) => `${presentRelationshipText(p.title, participants, activeRelationship)}: ${presentRelationshipText(p.description, participants, activeRelationship)}`).join("\n")}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Signals grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Early Signals — {participants[0]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {(insights.signals_tony || []).map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary mt-0.5 shrink-0">✦</span>
                <span className="text-foreground">{presentRelationshipText(s, participants, activeRelationship)}</span>
              </div>
            ))}
            {ctx && <AskAIFollowUp ctx={ctx} sectionTitle={`Early Signals — ${participants[0]}`} sectionContent={(insights.signals_tony || []).map((item) => presentRelationshipText(item, participants, activeRelationship)).join("\n")} className="mt-2" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Early Signals — {participants[1]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {(insights.signals_drew || []).map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary mt-0.5 shrink-0">✦</span>
                <span className="text-foreground">{presentRelationshipText(s, participants, activeRelationship)}</span>
              </div>
            ))}
            {ctx && <AskAIFollowUp ctx={ctx} sectionTitle={`Early Signals — ${participants[1]}`} sectionContent={(insights.signals_drew || []).map((item) => presentRelationshipText(item, participants, activeRelationship)).join("\n")} className="mt-2" />}
          </CardContent>
        </Card>
      </div>

      {/* Together */}
      {insights.signals_together?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" /> {relationshipLabel} Together
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {insights.signals_together.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-primary mt-0.5 shrink-0">✦</span>
                <span className="text-foreground">{presentRelationshipText(s, participants, activeRelationship)}</span>
              </div>
            ))}
            {ctx && <AskAIFollowUp ctx={ctx} sectionTitle={`${relationshipLabel} Together`} sectionContent={insights.signals_together.map((item) => presentRelationshipText(item, participants, activeRelationship)).join("\n")} className="mt-2" />}
          </CardContent>
        </Card>
      )}

      {/* What seems to help / Friction */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.what_seems_to_help?.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500" /> What Seems to Help
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {insights.what_seems_to_help.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                  <span className="text-foreground">{presentRelationshipText(s, participants, activeRelationship)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        {insights.friction_sources?.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" /> What May Be Causing Friction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {insights.friction_sources.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-orange-500 mt-0.5 shrink-0">△</span>
                  <span className="text-foreground">{presentRelationshipText(s, participants, activeRelationship)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* What to try next */}
      {insights.what_to_try_next?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> What to Try Next
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {insights.what_to_try_next.map((r, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm">
                <span className="bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-medium">{i + 1}</span>
                <span className="text-foreground">{presentRelationshipText(r, participants, activeRelationship)}</span>
              </div>
            ))}
            {ctx && <AskAIFollowUp ctx={ctx} sectionTitle="What to Try Next" sectionContent={insights.what_to_try_next.map((item) => presentRelationshipText(item, participants, activeRelationship)).join("\n")} className="mt-2" />}
          </CardContent>
        </Card>
      )}

      {/* How to strengthen */}
      {insights.how_to_strengthen?.length > 0 && (
        <Card className="border-dashed border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">How to Make These Insights Stronger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            {insights.how_to_strengthen.map((s, i) => (
              <p key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-muted-foreground/40 mt-0.5 shrink-0">→</span>{presentRelationshipText(s, participants, activeRelationship)}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {ctx && (
        <DataSourceBadge sources={[
          { label: "questionnaire answers", count: (ctx.tonyResponseCount || 0) + (ctx.drewResponseCount || 0) },
          { label: "coach sessions", count: ctx.sessionCount || 0 },
          { label: "check-ins", count: ctx.checkInCount || 0 },
        ]} />
      )}

      {ctx && (
        <>
          <ResponseExportBar
            contentRef={contentRef}
            content={{
              whatSystemSees: presentRelationshipText(insights.what_system_sees, participants, activeRelationship),
              whatThisMeans: presentRelationshipText(insights.what_this_means, participants, activeRelationship),
              emergingPatterns: (insights.emerging_patterns || []).map((item) => `${presentRelationshipText(item.title, participants, activeRelationship)}: ${presentRelationshipText(item.description, participants, activeRelationship)}`),
              signalsTony: (insights.signals_tony || []).map((item) => presentRelationshipText(item, participants, activeRelationship)),
              signalsDrew: (insights.signals_drew || []).map((item) => presentRelationshipText(item, participants, activeRelationship)),
              signalsTogether: (insights.signals_together || []).map((item) => presentRelationshipText(item, participants, activeRelationship)),
              whatSeemsToHelp: (insights.what_seems_to_help || []).map((item) => presentRelationshipText(item, participants, activeRelationship)),
              frictionSources: (insights.friction_sources || []).map((item) => presentRelationshipText(item, participants, activeRelationship)),
              whatToTryNext: (insights.what_to_try_next || []).map((item) => presentRelationshipText(item, participants, activeRelationship)),
            }}
            filename="context-insights.pdf"
            title="Context Insights"
          />
          <ExportBar ctx={ctx} content={[
            presentRelationshipText(insights.what_system_sees, participants, activeRelationship),
            presentRelationshipText(insights.what_this_means, participants, activeRelationship),
            `\nEarly Signals — ${participants[0]}:\n${(insights.signals_tony || []).map(s => `• ${presentRelationshipText(s, participants, activeRelationship)}`).join("\n")}`,
            `\nEarly Signals — ${participants[1]}:\n${(insights.signals_drew || []).map(s => `• ${presentRelationshipText(s, participants, activeRelationship)}`).join("\n")}`,
            `\nWhat to Try Next:\n${(insights.what_to_try_next || []).map((r, i) => `${i + 1}. ${presentRelationshipText(r, participants, activeRelationship)}`).join("\n")}`,
          ].join("\n\n")} />
        </>
      )}

      <NotesPanel section="insights" relatedItemId={insightId} personName={`${participants[0]}_${participants[1]}`} />
    </div>
  );
}

// ─── DEEP INSIGHTS VIEW ───────────────────────────────────────────────────────

function DeepInsightsView({ insights, ctx, contentRef, insightId, participants, relationshipLabel, terms, activeRelationship }) {
  return (
    <div className="space-y-6" ref={contentRef}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="bg-primary/5 border-primary/15">
          <CardContent className="p-8 text-center space-y-3">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20">
              <span className="font-display text-3xl font-bold text-primary">{insights.compatibility_score}</span>
            </div>
            <p className="font-display text-lg font-semibold text-foreground">{presentRelationshipText(insights.compatibility_label, participants, activeRelationship)}</p>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">{presentRelationshipText(insights.growth_summary, participants, activeRelationship)}</p>
            {ctx && (
              <div className="pt-2">
                <AskAIFollowUp
                  ctx={ctx}
                  sectionTitle="Compatibility Score"
                  sectionContent={`Score: ${insights.compatibility_score} — ${presentRelationshipText(insights.compatibility_label, participants, activeRelationship)}\n${presentRelationshipText(insights.growth_summary, participants, activeRelationship)}`}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {ctx && (
        <>
          <ResponseExportBar
            contentRef={contentRef}
            content={JSON.parse(JSON.stringify(insights), (key, value) => (typeof value === "string" ? presentRelationshipText(value, participants, activeRelationship) : value))}
            filename="deep-insights.pdf"
            title={`Deep ${relationshipLabel} Analysis`}
          />
          <ExportBar ctx={ctx} content={`Compatibility Score: ${insights.compatibility_score}/100 — ${presentRelationshipText(insights.compatibility_label, participants, activeRelationship)}\n\n${presentRelationshipText(insights.growth_summary, participants, activeRelationship)}\n\nStrengths:\n${insights.strengths?.map(s => `• ${presentRelationshipText(s, participants, activeRelationship)}`).join("\n")}\n\nRisk Areas:\n${insights.risk_areas?.map(r => `• ${presentRelationshipText(r, participants, activeRelationship)}`).join("\n")}\n\nRecommendations:\n${insights.recommendations?.map((r, i) => `${i + 1}. ${presentRelationshipText(r, participants, activeRelationship)}`).join("\n")}`} />
        </>
      )}

      <NotesPanel section="insights" relatedItemId={insightId} personName={`${participants[0]}_${participants[1]}`} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" /> Relationship Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {insights.strengths?.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm">
                <span className="text-primary mt-0.5">✦</span>
                <span className="text-foreground">{presentRelationshipText(s, participants, activeRelationship)}</span>
              </div>
            ))}
            {ctx && <AskAIFollowUp ctx={ctx} sectionTitle="Relationship Strengths" sectionContent={(insights.strengths || []).map((item) => presentRelationshipText(item, participants, activeRelationship)).join("\n")} className="mt-2" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" /> Conflict Risk Areas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {insights.risk_areas?.map((r, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm">
                <span className="text-orange-500 mt-0.5">△</span>
                <span className="text-foreground">{presentRelationshipText(r, participants, activeRelationship)}</span>
              </div>
            ))}
            {ctx && <AskAIFollowUp ctx={ctx} sectionTitle="Conflict Risk Areas" sectionContent={(insights.risk_areas || []).map((item) => presentRelationshipText(item, participants, activeRelationship)).join("\n")} className="mt-2" />}
          </CardContent>
        </Card>
      </div>

      {insights.conflict_loops?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-400" /> Recurring Conflict Loops
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {insights.conflict_loops.map((loop, i) => (
                <div key={i} className="px-3 py-2 rounded-lg bg-orange-50 border border-orange-100 text-sm text-foreground">{presentRelationshipText(loop, participants, activeRelationship)}</div>
              ))}
            {ctx && <AskAIFollowUp ctx={ctx} sectionTitle="Recurring Conflict Loops" sectionContent={insights.conflict_loops.map((item) => presentRelationshipText(item, participants, activeRelationship)).join("\n")} className="mt-2" />}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4" /> {participants[0]} vs {participants[1]} Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Category</th>
                  <th className="text-left py-2.5 px-3 font-medium text-primary">{participants[0]}</th>
                  <th className="text-left py-2.5 px-3 font-medium text-accent-foreground">{participants[1]}</th>
                  <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Insight</th>
                </tr>
              </thead>
              <tbody>
                {insights.comparison_table?.map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2.5 px-3 font-medium text-foreground">{row.category}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{presentRelationshipText(row.tony, participants, activeRelationship)}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{presentRelationshipText(row.drew, participants, activeRelationship)}</td>
                    <td className="py-2.5 px-3"><Badge variant="outline" className="text-xs font-normal">{presentRelationshipText(row.insight, participants, activeRelationship)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {ctx && (
            <AskAIFollowUp
              ctx={ctx}
              sectionTitle={`${terms.counterpart} Comparison`}
              sectionContent={((insights.comparison_table || [])
                .map((row) =>
                  [
                    row?.category,
                    presentRelationshipText(row?.tony, participants, activeRelationship),
                    presentRelationshipText(row?.drew, participants, activeRelationship),
                    presentRelationshipText(row?.insight, participants, activeRelationship),
                  ]
                    .filter(Boolean)
                    .join(" | "),
                )
                .join("\n")) || "No comparison rows are available yet."}
              className="mt-4"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Predictive Dynamics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {insights.predictions?.map((p, i) => (
            <div key={i} className="p-3 rounded-lg bg-muted/40 border border-border/40 text-sm text-foreground leading-relaxed">{presentRelationshipText(p, participants, activeRelationship)}</div>
          ))}
          {ctx && <AskAIFollowUp ctx={ctx} sectionTitle="Predictive Dynamics" sectionContent={(insights.predictions || []).map((item) => presentRelationshipText(item, participants, activeRelationship)).join("\n")} className="mt-1" />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {insights.recommendations?.map((r, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm">
              <span className="bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-medium">{i + 1}</span>
              <span className="text-foreground">{presentRelationshipText(r, participants, activeRelationship)}</span>
            </div>
          ))}
          {ctx && <AskAIFollowUp ctx={ctx} sectionTitle="Recommendations" sectionContent={(insights.recommendations || []).map((item) => presentRelationshipText(item, participants, activeRelationship)).join("\n")} className="mt-2" />}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function Insights() {
  const { activeRelationshipId, activeRelationship, participants, relationshipLabel, relationships } = useRelationshipAuth();
  const [contextInsights, setContextInsights] = useState(null);
  const [deepInsights, setDeepInsights] = useState(null);
  const [insightsCtx, setInsightsCtx] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState(null); // "context" | "deep"
  const [activeTab, setActiveTab] = useState("context");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [creditError, setCreditError] = useState(false);
  const contentRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-insights", activeRelationshipId],
    queryFn: () => api.entities.UserProfile.list(),
  });

  const { data: tonyResponses = [] } = useQuery({
    queryKey: ["responses-insights-tony", activeRelationshipId, participants[0]],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: participants[0] }),
  });

  const { data: drewResponses = [] } = useQuery({
    queryKey: ["responses-insights-drew", activeRelationshipId, participants[1]],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: participants[1] }),
  });

  const { data: relationshipDynamics = [] } = useQuery({
    queryKey: ["relationship-dynamic", activeRelationshipId],
    queryFn: () => api.entities.RelationshipDynamic.list("-created_date", 1),
  });

  const { data: recentSessions = [] } = useQuery({
    queryKey: ["sessions-insights", activeRelationshipId],
    queryFn: () => api.entities.CoachSession.list("-created_date", 50),
  });

  const { data: recentCheckIns = [] } = useQuery({
    queryKey: ["checkins-insights", activeRelationshipId],
    queryFn: () => api.entities.CheckIn.list("-created_date", 50),
  });

  const { data: repairEntries = [] } = useQuery({
    queryKey: ["repairs-insights", activeRelationshipId],
    queryFn: () => api.entities.RepairEntry.list("-created_date", 20),
  });

  const { data: triggers = [] } = useQuery({
    queryKey: ["triggers-insights", activeRelationshipId],
    queryFn: () => api.entities.TriggerEntry.list(),
  });

  const { data: insightEntries = [] } = useQuery({
    queryKey: ["insight-entries", activeRelationshipId],
    queryFn: () => api.entities.InsightEntry.list("-created_date", 10),
  });

  const tonyProfile = profiles.find((p) => p.person_name === participants[0]);
  const drewProfile = profiles.find((p) => p.person_name === participants[1]);
  const bothReady = tonyProfile && drewProfile;
  const terms = getRelationshipTerms(activeRelationship);

  const hiddenParticipantNames = useMemo(() => {
    return getForeignParticipantNames(relationships, participants);
  }, [relationships, participants]);

  const safeRelationshipDynamics = useMemo(
    () => relationshipDynamics.filter((dynamic) => isDynamicVisibleForParticipants(dynamic, hiddenParticipantNames)),
    [relationshipDynamics, hiddenParticipantNames],
  );

  const existingDynamic = safeRelationshipDynamics[0] || null;

  // Compute relationship intelligence
  const patternScores = {
    tony: computePatternProfile(participants[0], tonyResponses),
    drew: computePatternProfile(participants[1], drewResponses),
  };

  const relationshipIntelligence = synthesizeRelationshipIntelligence({
    participants,
    relationshipTerms: terms,
    profiles,
    patternScores,
    recentCoachSessions: recentSessions,
    recentCheckIns,
    repairEntries,
    triggers,
  });

  const trend = getStateTrend(relationshipIntelligence, null);
  const safeInsightEntries = useMemo(
    () =>
      insightEntries.filter(
        (entry) =>
          isPerspectiveInActivePair(entry.perspective, participants) &&
          isEntryVisibleForParticipants(entry, hiddenParticipantNames),
      ),
    [insightEntries, hiddenParticipantNames, participants],
  );

  // Total data available — used to decide whether to auto-generate
  const totalData = tonyResponses.length + drewResponses.length + recentSessions.length + recentCheckIns.length;
  // All queries must have settled before we decide to restore or generate
  const dataLoaded =
    profiles !== undefined &&
    tonyResponses !== undefined &&
    drewResponses !== undefined &&
    recentSessions !== undefined &&
    recentCheckIns !== undefined &&
    relationshipDynamics !== undefined;

  const makeCtx = (sectionTitle, output) => ({
    ...buildContextObject({
      page: "Insights",
      sectionTitle,
      scope: `${participants[0]}+${participants[1]}`,
      sourceInputs: { sessions: recentSessions.length, checkIns: recentCheckIns.length },
      originalOutput: output,
      profiles,
      tonyResponses,
      drewResponses,
      sessions: recentSessions,
      checkIns: recentCheckIns,
      relationshipDynamic: existingDynamic,
    }),
    tonyResponseCount: tonyResponses.length,
    drewResponseCount: drewResponses.length,
    sessionCount: recentSessions.length,
    checkInCount: recentCheckIns.length,
  });

  const generateContextInsights = async () => {
    setLoading(true);
    setLoadingMode("context");
    setCreditError(false);

    let result;
    try {
      result = await safeInvokeLLM({
      prompt: buildContextInsightsPrompt({
        tonyProfile, drewProfile, tonyResponses, drewResponses,
        sessions: recentSessions, checkIns: recentCheckIns,
        relationshipDynamic: existingDynamic,
        relationshipTerms: terms,
        relationshipLabel,
      }),
      model: "claude_sonnet_4_6",
      partnerLanguage: { personName: participants[0], partnerName: participants[1], replacePronouns: false },
      response_json_schema: {
        type: "object",
        properties: {
          what_system_sees: { type: "string" },
          what_this_means: { type: "string" },
          signals_tony: { type: "array", items: { type: "string" } },
          signals_drew: { type: "array", items: { type: "string" } },
          signals_together: { type: "array", items: { type: "string" } },
          what_seems_to_help: { type: "array", items: { type: "string" } },
          friction_sources: { type: "array", items: { type: "string" } },
          what_to_try_next: { type: "array", items: { type: "string" } },
          emerging_patterns: {
            type: "array",
            items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } } },
          },
          confidence_level: { type: "string" },
          confidence_explanation: { type: "string" },
          how_to_strengthen: { type: "array", items: { type: "string" } },
        },
      },
      }, 35000, null, validateContextInsightsOutput);
    } catch (err) {
      if (err instanceof CreditLimitError) { setCreditError(true); setLoading(false); setLoadingMode(null); return; }
      throw err;
    }

    // Fallback if timed out
    if (!result) {
      result = buildFallbackContextInsights(tonyResponses, drewResponses, recentSessions, recentCheckIns);
    }

    // Always normalize — guarantees all fields are renderable
    result = normalizeContextInsights(result);

    // Persist context insights to RelationshipDynamic so they survive refresh
    const contextPayload = {
      ai_dynamic_summary: result.what_system_sees,
      compatibility_patterns: result.signals_together || [],
      shared_strengths: result.what_seems_to_help || [],
      risk_areas: result.friction_sources || [],
      improvements_over_time: result.what_to_try_next || [],
      last_analyzed: new Date().toISOString(),
      // Store full context JSON so it can be restored on reload
      context_insights_json: JSON.stringify(result),
    };
    if (existingDynamic) {
      await api.entities.RelationshipDynamic.update(existingDynamic.id, contextPayload);
    } else {
      await api.entities.RelationshipDynamic.create(contextPayload);
    }
    queryClient.invalidateQueries({ queryKey: ["relationship-dynamic", activeRelationshipId] });

    setContextInsights(result);
    setInsightsCtx(makeCtx("Context-Based Insights", result.what_system_sees));
    setActiveTab("context");
    setLastUpdated(new Date());
    setLoading(false);
    setLoadingMode(null);
  };

  // On page load: restore from DB or generate once — deterministic, no ref guards needed.
  // Runs only when ALL queries have settled and we have no insights yet and are not loading.
  useEffect(() => {
    if (!dataLoaded || loading || contextInsights || deepInsights) return;

    if (existingDynamic?.context_insights_json) {
      try {
        const cached = normalizeContextInsights(JSON.parse(existingDynamic.context_insights_json));
        setContextInsights(cached);
        setInsightsCtx(makeCtx("Context-Based Insights", cached.what_system_sees));
        setActiveTab("context");
      } catch (_) {
        // corrupt cache — don't auto-generate (let user click manually)
      }
      if (existingDynamic?.deep_insights_json) {
        try {
          setDeepInsights(normalizeDeepInsights(JSON.parse(existingDynamic.deep_insights_json)));
        } catch (_) { /* corrupt cache — ignore */ }
      }
      return;
    }

    // Don't auto-generate on load — let user click to trigger (avoids burning credits silently)
  }, [dataLoaded]); // eslint-disable-line

  const generateDeepInsights = async () => {
    setLoading(true);
    setLoadingMode("deep");
    setCreditError(false);

    const deepFallback = {
      compatibility_score: 72,
      compatibility_label: "Strong Foundation with Active Growth Edges",
      strengths: ["Mutual commitment to self-awareness and growth", "13-year shared history and deep knowledge of each other"],
      risk_areas: [`Processing tempo mismatch — ${participants[0]} withdraws, ${participants[1]} pursues`],
      conflict_loops: ["Pursuer-distancer cycle triggered by silence"],
      shared_strengths: ["Investment in relationship tools", "Willingness to reflect"],
      comparison_table: [],
      predictions: [`When ${participants[0]} needs processing time and doesn't communicate it, ${participants[1]}'s anxiety may escalate — creating a cycle.`],
      recommendations: [`Agree on a time-limited processing signal ${participants[0]} can use in the moment.`],
      growth_summary: `${participants[0]} and ${participants[1]} are two self-aware people with a meaningful shared history and a real commitment to growth. The deepest work right now is around tempo — learning to negotiate processing needs before tension escalates within this ${terms.bond}.`,
    };
    const dynamicFallback = {
      compatibility_patterns: [], mismatch_patterns: [], conflict_loops: [],
      shared_strengths: [], risk_areas: [], improvements_over_time: [],
      ai_dynamic_summary: "",
    };

    let insightResult, dynamicResult;
    try {
      [insightResult, dynamicResult] = await Promise.all([
      safeInvokeLLM({
        prompt: buildInsightsPrompt({
          tonyProfile,
          drewProfile,
          tonyResponses,
          drewResponses,
          relationshipDynamic: existingDynamic,
          relationshipTerms: terms,
          relationshipLabel,
        }),
        model: "claude_sonnet_4_6",
        partnerLanguage: { personName: participants[0], partnerName: participants[1], replacePronouns: false },
        response_json_schema: {
          type: "object",
          properties: {
            compatibility_score: { type: "number" },
            compatibility_label: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            risk_areas: { type: "array", items: { type: "string" } },
            conflict_loops: { type: "array", items: { type: "string" } },
            shared_strengths: { type: "array", items: { type: "string" } },
            comparison_table: { type: "array", items: { type: "object", properties: { category: { type: "string" }, tony: { type: "string" }, drew: { type: "string" }, insight: { type: "string" } } } },
            predictions: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            growth_summary: { type: "string" },
          },
        },
      }, 40000, deepFallback, validateDeepInsightsOutput),
      safeInvokeLLM({
        prompt: buildDynamicUpdatePrompt({
          tonyProfile,
          drewProfile,
          recentSessions,
          recentCheckIns,
          relationshipTerms: terms,
          relationshipLabel,
        }),
        model: "gpt_5_mini",
        partnerLanguage: { personName: participants[0], partnerName: participants[1], replacePronouns: false },
        response_json_schema: {
          type: "object",
          properties: {
            compatibility_patterns: { type: "array", items: { type: "string" } },
            mismatch_patterns: { type: "array", items: { type: "string" } },
            conflict_loops: { type: "array", items: { type: "string" } },
            shared_strengths: { type: "array", items: { type: "string" } },
            risk_areas: { type: "array", items: { type: "string" } },
            improvements_over_time: { type: "array", items: { type: "string" } },
            ai_dynamic_summary: { type: "string" },
          },
        },
      }, 20000, dynamicFallback),
    ]);
    } catch (err) {
      if (err instanceof CreditLimitError) { setCreditError(true); setLoading(false); setLoadingMode(null); return; }
      throw err;
    }

    const dynamicPayload = {
      ...dynamicResult,
      last_analyzed: new Date().toISOString(),
      deep_insights_json: JSON.stringify(insightResult),
    };
    if (existingDynamic) {
      await api.entities.RelationshipDynamic.update(existingDynamic.id, dynamicPayload);
    } else {
      await api.entities.RelationshipDynamic.create(dynamicPayload);
    }

    setDeepInsights(normalizeDeepInsights(insightResult));
    setInsightsCtx(makeCtx(`Deep ${relationshipLabel} Analysis`, JSON.stringify(insightResult, null, 2)));
    setActiveTab("deep");
    setLoading(false);
    setLoadingMode(null);
    queryClient.invalidateQueries({ queryKey: ["relationship-dynamic", activeRelationshipId] });
  };

  const defaultCtx = makeCtx(`${relationshipLabel} Analysis`, null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Insights</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {terms.type === "romantic" ? "Relationship" : "Connection"} intelligence generated for {relationshipLabel} from everything the system knows — sessions, check-ins, questionnaire answers, and lived situations.
        </p>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground/60 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}, {lastUpdated.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        )}
        {existingDynamic?.last_analyzed && !lastUpdated && (
          <p className="text-xs text-muted-foreground/60 mt-1">
            Last updated: {new Date(existingDynamic.last_analyzed).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        )}
      </div>

      <PrivacyBanner />

      {creditError && <CreditLimitBanner />}

      {/* Intelligence tier */}
      <InsightTierBanner
        tonyProfile={tonyProfile}
        drewProfile={drewProfile}
        tonyResponses={tonyResponses}
        drewResponses={drewResponses}
        participants={participants}
        relationshipNoun={terms.bond}
      />

      {/* Data available bar */}
      <DataAvailableBar
        tonyResponses={tonyResponses}
        drewResponses={drewResponses}
        sessions={recentSessions}
        checkIns={recentCheckIns}
      />

      {/* Mode Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ModeCard
          icon={Zap}
          title="Context Insights"
          description={`Best for a fast, broad read of this ${terms.bond} using sessions, tools, check-ins, and questionnaire patterns already in the system.`}
          sources={SOURCE_ITEMS}
          active={activeTab === "context"}
          loading={loadingMode === "context"}
          onClick={generateContextInsights}
        />
        <ModeCard
          icon={BookOpen}
          title="Full Deep Insights"
          description={bothReady
            ? `Use this for the deeper ${terms.counterpart} comparison: shared strengths, risks, recurring loops, predictions, and grounded next steps.`
            : `A deeper ${terms.bond} analysis is still available now. It becomes more precise as both ${participants[0]} and ${participants[1]} complete more profile data.`}
          locked={false}
          active={activeTab === "deep"}
          loading={loadingMode === "deep"}
          onClick={generateDeepInsights}
        />
      </div>

      {/* Waiting for other-person notice — shown when only one person has questionnaire data */}
      {(tonyResponses.length === 0 || drewResponses.length === 0) && !loading && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-muted/40 border border-border/40">
          <Heart className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Waiting for {terms.counterpart} data:</strong>{" "}
            {tonyResponses.length === 0 ? participants[0] : participants[1]} hasn't completed any questionnaire answers yet.
            Combined insights will deepen significantly once both people in this {terms.bond} have contributed data.
          </p>
        </div>
      )}

      {/* Relationship Intelligence Summary (always show) */}
      {dataLoaded && (
        <div className="space-y-4">
          <RelationshipStateCard intelligence={relationshipIntelligence} trend={trend} />
          
          {/* Top risks and strengths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relationshipIntelligence.top_3_risks.length > 0 && (
              <Card className="border-2 border-[#14263f]/20 bg-[#eef4fb]">
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#14263f]">Top Risks</p>
                  {relationshipIntelligence.top_3_risks.map((risk, i) => (
                    <p key={i} className="text-sm text-[#14263f]">• {risk}</p>
                  ))}
                </CardContent>
              </Card>
            )}
            {relationshipIntelligence.top_3_strengths.length > 0 && (
              <Card className="border-2 border-[#0e6f72]/20 bg-[#e8f7f6]">
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#0e6f72]">Top Strengths</p>
                  {relationshipIntelligence.top_3_strengths.map((strength, i) => (
                    <p key={i} className="text-sm text-[#14263f]">• {strength}</p>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Pattern drift */}
          <PatternDriftTracker recentSessions={recentSessions} patternScores={patternScores} />

          {/* Timeline */}
          <InsightTimeline sessions={recentSessions} repairs={repairEntries} insights={safeInsightEntries} participants={participants} activeRelationship={activeRelationship} />
        </div>
      )}

      {/* Empty hero state */}
      {!contextInsights && !deepInsights && !loading && (
        <Card className="border-2 border-primary/15 bg-white">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-xl font-semibold text-foreground">Relationship Intelligence, Available Now</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                RelateIQ can generate meaningful insights at any time — from AI Coach conversations, Smart Tool sessions, Weekly Check-Ins, and any questionnaire answers already provided.
              </p>
              <p className="text-xs text-muted-foreground/70">
                Complete questionnaire data deepens and sharpens insights over time, but it is not required to begin.
              </p>
            </div>
            <Button onClick={generateContextInsights} className="gap-2">
              <Zap className="w-4 h-4" /> Generate Context Insights
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      <AILoadingState active={loading} mode="insights" />
      <AIProgressLog active={loading} mode={loadingMode || "context"} />

      {/* Previous dynamic summary (only shown when no fresh results) */}
      {existingDynamic?.ai_dynamic_summary && !contextInsights && !deepInsights && !loading && (
        <Card className="border-primary/10 bg-primary/3">
          <CardContent className="p-5">
            <p className="text-xs text-primary font-medium mb-1.5 uppercase tracking-wide">Last Analysis</p>
            <p className="text-sm text-foreground leading-relaxed">{presentRelationshipText(existingDynamic.ai_dynamic_summary, participants, activeRelationship)}</p>
          </CardContent>
        </Card>
      )}

      {/* Profiles notice - softer messaging */}
      {!bothReady && (contextInsights || !loading) && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border/40">
          <Lightbulb className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Deeper {terms.bond} intelligence</strong> becomes available as both profiles are completed. Both Context and Deep Insights are available now — they'll improve with more data.
          </p>
        </div>
      )}

      {/* Results */}
      {(contextInsights || deepInsights) && !loading && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="context" disabled={!contextInsights}>
              Context Insights
              {contextInsights && (
                <Badge className={`ml-2 text-[10px] border ${(CONFIDENCE_CONFIG[contextInsights.confidence_level] || CONFIDENCE_CONFIG.early_signal).color}`}>
                  {(CONFIDENCE_CONFIG[contextInsights.confidence_level] || CONFIDENCE_CONFIG.early_signal).label}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="deep" disabled={!deepInsights}>Deep Analysis</TabsTrigger>
          </TabsList>

          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8 text-xs"
              onClick={generateContextInsights}
              disabled={loading}
            >
              {loadingMode === "context" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Refresh Context Insights
            </Button>
            <Button
              size="sm"
              className="gap-1.5 h-8 text-xs"
              onClick={generateDeepInsights}
              disabled={loading}
            >
              {loadingMode === "deep" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Refresh Deep Insights
            </Button>
          </div>

          <TabsContent value="context" className="mt-6 space-y-4">
            {contextInsights && (
              <>
                {contextInsights.confidence_explanation?.includes("Fallback") && <FallbackBadge />}
                <ContextInsightsView insights={contextInsights} ctx={insightsCtx} contentRef={contentRef} insightId={existingDynamic?.id} participants={participants} relationshipLabel={relationshipLabel} activeRelationship={activeRelationship} />
              </>
            )}
          </TabsContent>
          <TabsContent value="deep" className="mt-6">
            {deepInsights && <DeepInsightsView insights={deepInsights} ctx={insightsCtx} contentRef={contentRef} insightId={existingDynamic?.id} participants={participants} relationshipLabel={relationshipLabel} terms={terms} activeRelationship={activeRelationship} />}
          </TabsContent>
        </Tabs>
      )}

      <AskCoachDrawer ctx={insightsCtx || defaultCtx} />
    </div>
  );
}
