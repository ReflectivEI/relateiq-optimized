/**
 * InsightTimeline.jsx
 * Chronological relationship events with expandable detail.
 */

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  MessageCircle,
  Wrench,
  LineChart,
  AlertCircle,
  Clock3,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { getDisplayPerspective, presentRelationshipText } from "@/lib/relationshipParticipants";

const ICON_MAP = {
  coach: MessageCircle,
  repair: Wrench,
  insight: LineChart,
  risk: AlertCircle,
  shift: LineChart,
};

const CARD_STYLES = [
  {
    card: "border-[#14263f]/25 bg-[#eef4fb]",
    iconWrap: "border-[#14263f]/20 bg-white",
    icon: "text-[#14263f]",
  },
  {
    card: "border-[#0e6f72]/25 bg-[#e8f7f6]",
    iconWrap: "border-[#0e6f72]/20 bg-white",
    icon: "text-[#0e6f72]",
  },
];

function cleanText(value) {
  if (!value || typeof value !== "string") return "";
  return value.replace(/\[[^\]]+\]\s*/g, "").replace(/[ \t]+/g, " ").trim();
}

function previewText(value, fallback = "No description available") {
  const text = cleanText(value);
  if (!text) return fallback;
  return text.length > 110 ? `${text.substring(0, 107)}...` : text;
}

function normalizeItems(items) {
  if (Array.isArray(items)) {
    return items.map((item) => cleanText(item)).filter(Boolean);
  }
  if (typeof items === "string" && items.trim()) {
    return [cleanText(items)];
  }
  return [];
}

function summarizeSection(section) {
  if (section.list?.length) {
    return `${section.list.length} key point${section.list.length === 1 ? "" : "s"} highlighted here.`;
  }
  const text = cleanText(section.content || "");
  if (!text) return "A brief summary is not available for this section yet.";
  const sentence = text.split(/(?<=[.!?])\s+/).find(Boolean) || text;
  return sentence.length > 165 ? `${sentence.substring(0, 162)}...` : sentence;
}

function prettifyHeading(value) {
  return value
    .replace(/[_#*]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseStructuredText(value, fallbackTitle) {
  const text = (value || "").replace(/\r/g, "").trim();
  if (!text) return [];

  const inlineNormalized = text
    .replace(/\s+##\s+/g, "\n\n## ")
    .replace(/(##\s*[A-Za-z][A-Za-z '\-?]+)\s*(?=##\s*[A-Za-z])/g, "$1\n");
  const workingText = inlineNormalized.startsWith("## ") ? inlineNormalized : inlineNormalized;

  const headingRegex = /^#{2,}\s*(.+?)\s*$/gm;
  const matches = [...workingText.matchAll(headingRegex)];

  if (matches.length === 0) {
    return [{ title: fallbackTitle, content: cleanText(workingText) }];
  }

  const sections = [];
  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const next = matches[index + 1];
    const title = prettifyHeading(current[1] || fallbackTitle);
    const start = current.index + current[0].length;
    const end = next ? next.index : workingText.length;
    const rawContent = workingText
      .slice(start, end)
      .replace(/^(##\s*[A-Za-z][A-Za-z '\-?]+\s*)+$/gm, "")
      .trim();
    if (!rawContent) continue;
    sections.push({
      title,
      content: cleanText(rawContent),
    });
  }

  return sections.length > 0
    ? sections
    : [{ title: fallbackTitle, content: cleanText(text) }];
}

function buildCoachFallbackSections(summary, meta) {
  const cleanedSummary = cleanText(summary);
  return [
    {
      title: "Situation",
      content:
        cleanedSummary ||
        `A coaching guidance card was saved for ${meta}, but the original situation details were not fully preserved.`,
    },
    {
      title: "What's Happening",
      content:
        "This moment appears to involve emotional friction, misattunement, or disconnection that needs a calmer explanation before the conversation can move forward.",
    },
    {
      title: "Why This Is Happening",
      content:
        "The dynamic likely comes from a mismatch in tone, timing, or emotional needs, which can cause one person to feel dismissed while the other feels pressured.",
    },
    {
      title: "Recommended Approach",
      content:
        "Slow the interaction down, describe what happened in plain language, and lead with clarity and emotional steadiness before trying to solve everything.",
    },
    {
      title: "Example Language",
      content:
        "I want to talk about this in a way that helps us understand each other. Can we slow down and take one part at a time?",
    },
    {
      title: "What To Avoid",
      content:
        "Avoid stacking multiple complaints together, assuming intent, or pushing for immediate resolution while either person is still activated.",
    },
  ];
}

function SectionCard({ section }) {
  const [showSummary, setShowSummary] = useState(false);
  const summary = summarizeSection(section);

  return (
    <div className="rounded-2xl border border-primary/15 bg-white/85 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {section.title}
        </p>
        <button
          type="button"
          onClick={() => setShowSummary((value) => !value)}
          className="shrink-0 rounded-full border border-primary/20 bg-[#eef4fb] px-3 py-1 text-[11px] font-semibold text-primary transition-colors hover:border-primary/35 hover:bg-[#e8f0fa]"
        >
          Summarize
        </button>
      </div>

      {showSummary && (
        <div className="rounded-xl border border-primary/10 bg-[#eef4fb] px-3 py-2 text-sm leading-6 text-[#14263f]">
          {summary}
        </div>
      )}

      {section.content && (
        <p className="text-[15px] leading-6 text-foreground whitespace-pre-wrap">{section.content}</p>
      )}
      {section.list && (
        <div className="space-y-2">
          {section.list.map((item) => (
            <div key={item} className="flex gap-2 text-sm leading-6 text-foreground">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function buildEventDetails(event, participants, activeRelationship) {
  if (event.type === "coach") {
    const guidanceSections = parseStructuredText(
      presentRelationshipText(cleanText(event.aiResponse), participants, activeRelationship),
      "Guidance",
    );
    const usableGuidanceSections = guidanceSections.filter(
      (section) => cleanText(section.content || "").length > 0 || section.list?.length > 0
    );
    return {
      title: event.titleLabel,
      summary:
        previewText(
          presentRelationshipText(event.summary, participants, activeRelationship),
          `A short coaching request was opened for ${event.meta}.`,
        ),
      sections: [
        {
          title: "Original Situation",
          content:
            presentRelationshipText(cleanText(event.summary), participants, activeRelationship) ||
            `A short coaching request was opened for ${event.meta}.`,
        },
        ...(
          usableGuidanceSections.length > 0
            ? usableGuidanceSections.length > 1
              ? usableGuidanceSections.map((section) => ({
                  ...section,
                  content: presentRelationshipText(section.content, participants, activeRelationship),
                  list: section.list?.map((item) => presentRelationshipText(item, participants, activeRelationship)),
                }))
              : [{ title: "Guidance Given", content: presentRelationshipText(cleanText(event.aiResponse), participants, activeRelationship) }]
            : buildCoachFallbackSections(event.summary, event.meta).map((section) => ({
                ...section,
                content: presentRelationshipText(section.content, participants, activeRelationship),
                list: section.list?.map((item) => presentRelationshipText(item, participants, activeRelationship)),
              }))
        ),
      ],
    };
  }

  if (event.type === "repair") {
    return {
      title: "Repair Session",
      summary: previewText(event.summary, "A repair attempt was logged."),
      sections: [
        {
          title: "Situation Type",
          content: presentRelationshipText(cleanText(event.summary), participants, activeRelationship) || "Repair attempted.",
        },
        ...(cleanText(event.bestMove)
          ? [{ title: "Best Repair Move", content: presentRelationshipText(cleanText(event.bestMove), participants, activeRelationship) }]
          : []),
        ...(normalizeItems(event.whatToAvoid).length > 0
          ? [{ title: "What To Avoid", list: normalizeItems(event.whatToAvoid).map((item) => presentRelationshipText(item, participants, activeRelationship)) }]
          : []),
      ],
    };
  }

  if (event.type === "insight") {
    return {
      title: "Generated Insight",
      summary: previewText(presentRelationshipText(event.summary, participants, activeRelationship), "A new insight was added to the relationship timeline."),
      sections: [
        {
          title: "Core Insight",
          content: presentRelationshipText(cleanText(event.summary), participants, activeRelationship) || "Insight generated.",
        },
        ...(normalizeItems(event.behavioralPatterns).length > 0
          ? [{ title: "Behavioral Patterns", list: normalizeItems(event.behavioralPatterns).map((item) => presentRelationshipText(item, participants, activeRelationship)) }]
          : []),
        ...(normalizeItems(event.riskFlags).length > 0
          ? [{ title: "Risk Flags", list: normalizeItems(event.riskFlags).map((item) => presentRelationshipText(item, participants, activeRelationship)) }]
          : []),
        ...(normalizeItems(event.strengths).length > 0
          ? [{ title: "Strengths", list: normalizeItems(event.strengths).map((item) => presentRelationshipText(item, participants, activeRelationship)) }]
          : []),
      ],
    };
  }

  return {
    title: event.title,
    summary: previewText(presentRelationshipText(event.summary, participants, activeRelationship)),
    sections: [{ title: "Details", content: presentRelationshipText(cleanText(event.summary), participants, activeRelationship) || "No detail available." }],
  };
}

function TimelineEventCard({ event, index, participants, activeRelationship }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ICON_MAP[event.type] || MessageCircle;
  const styles = CARD_STYLES[index % 2];
  const details = buildEventDetails(event, participants, activeRelationship);
  const metaLabel = event.type === "insight"
    ? getDisplayPerspective(event.meta, participants)
    : presentRelationshipText(event.meta, participants, activeRelationship);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={`border-2 ${styles.card}`}>
        <CardContent className="p-0">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="flex w-full items-start gap-3 p-4 text-left"
          >
            <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${styles.iconWrap}`}>
              <Icon className={`w-4 h-4 ${styles.icon}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="font-semibold text-sm text-foreground">{details.title}</p>
                <p className="text-xs text-muted-foreground">{metaLabel}</p>
              </div>
              <p className="mt-1 text-sm text-[#14263f]">{details.summary}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="inline-flex items-center gap-1 text-xs text-muted-foreground/80">
                  <Clock3 className="h-3 w-3" />
                  {format(event.date, "MMM d, h:mm a")}
                </p>
                {event.outcome && (
                  <p className="text-xs font-medium text-green-700">Outcome: {event.outcome}</p>
                )}
              </div>
            </div>
            <div className="mt-1 shrink-0 rounded-full border border-primary/10 bg-white/70 p-1.5 text-muted-foreground">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </button>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t border-primary/10 px-4 pb-4 pl-[4.75rem] pt-4 space-y-4">
                  {details.sections.map((section) => (
                    <SectionCard key={`${details.title}-${section.title}`} section={section} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function InsightTimeline({
  sessions = [],
  repairs = [],
  insights = [],
  maxItems = 8,
  participants = ["Person A", "Other Person"],
  activeRelationship,
}) {
  const events = [
    ...sessions.map((s) => ({
      type: "coach",
      titleLabel: "Coach Guidance",
      summary: s.situation,
      aiResponse: s.ai_response,
      date: new Date(s.created_date),
      meta: `${s.speaker} → ${s.speaking_to}`,
      id: `coach-${s.id}`,
    })),
    ...repairs.map((r) => ({
      type: "repair",
      titleLabel: "Repair Session",
      summary: r.situation_type || "Repair attempted",
      bestMove: r.best_repair_move,
      whatToAvoid: r.what_to_avoid,
      date: new Date(r.created_date),
      outcome: r.outcome_rating,
      meta: r.owner,
      id: `repair-${r.id}`,
    })),
    ...insights.map((i) => ({
      type: "insight",
      titleLabel: "Generated Insight",
      summary: i.core_insight,
      behavioralPatterns: i.behavioral_patterns,
      riskFlags: i.risk_flags,
      strengths: i.strengths,
      date: new Date(i.created_date),
      meta: i.perspective,
      id: `insight-${i.id}`,
    })),
  ];

  const timeline = events.sort((a, b) => b.date - a.date).slice(0, maxItems);

  if (timeline.length === 0) {
    return (
      <Card className="border-dashed border-border/50">
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          No events yet. Start using AI Coach or logging repairs to build your timeline.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg font-semibold text-foreground">
        {activeRelationship?.type === "romantic" ? "Relationship Timeline" : "Connection Timeline"}
      </h3>
      <div className="space-y-2">
        {timeline.map((event, idx) => (
          <TimelineEventCard key={event.id} event={event} index={idx} participants={participants} activeRelationship={activeRelationship} />
        ))}
      </div>
    </div>
  );
}
