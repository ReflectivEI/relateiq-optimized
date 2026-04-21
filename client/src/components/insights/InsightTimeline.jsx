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
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

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
  return value.replace(/\[[^\]]+\]\s*/g, "").replace(/\s+/g, " ").trim();
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

function buildEventDetails(event) {
  if (event.type === "coach") {
    return {
      title: event.titleLabel,
      summary:
        previewText(event.summary, `A short coaching request was opened for ${event.meta}.`),
      sections: [
        {
          title: "Original Situation",
          content: cleanText(event.summary) || `A short coaching request was opened for ${event.meta}.`,
        },
        ...(cleanText(event.aiResponse)
          ? [{ title: "Guidance Given", content: cleanText(event.aiResponse) }]
          : []),
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
          content: cleanText(event.summary) || "Repair attempted.",
        },
        ...(cleanText(event.bestMove)
          ? [{ title: "Best Repair Move", content: cleanText(event.bestMove) }]
          : []),
        ...(normalizeItems(event.whatToAvoid).length > 0
          ? [{ title: "What To Avoid", list: normalizeItems(event.whatToAvoid) }]
          : []),
      ],
    };
  }

  if (event.type === "insight") {
    return {
      title: "Generated Insight",
      summary: previewText(event.summary, "A new insight was added to the relationship timeline."),
      sections: [
        {
          title: "Core Insight",
          content: cleanText(event.summary) || "Insight generated.",
        },
        ...(normalizeItems(event.behavioralPatterns).length > 0
          ? [{ title: "Behavioral Patterns", list: normalizeItems(event.behavioralPatterns) }]
          : []),
        ...(normalizeItems(event.riskFlags).length > 0
          ? [{ title: "Risk Flags", list: normalizeItems(event.riskFlags) }]
          : []),
        ...(normalizeItems(event.strengths).length > 0
          ? [{ title: "Strengths", list: normalizeItems(event.strengths) }]
          : []),
      ],
    };
  }

  return {
    title: event.title,
    summary: previewText(event.summary),
    sections: [{ title: "Details", content: cleanText(event.summary) || "No detail available." }],
  };
}

function TimelineEventCard({ event, index }) {
  const [expanded, setExpanded] = useState(index === 0);
  const Icon = ICON_MAP[event.type] || MessageCircle;
  const styles = CARD_STYLES[index % 2];
  const details = buildEventDetails(event);

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
                <p className="text-xs text-muted-foreground">{event.meta}</p>
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
                    <div key={section.title} className="rounded-2xl border border-primary/15 bg-white/80 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {section.title}
                      </p>
                      {section.content && (
                        <p className="mt-2 text-sm leading-7 text-foreground">{section.content}</p>
                      )}
                      {section.list && (
                        <div className="mt-2 space-y-2">
                          {section.list.map((item) => (
                            <div key={item} className="flex gap-2 text-sm leading-6 text-foreground">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
      <h3 className="font-display text-lg font-semibold text-foreground">Relationship Timeline</h3>
      <div className="space-y-2">
        {timeline.map((event, idx) => (
          <TimelineEventCard key={event.id} event={event} index={idx} />
        ))}
      </div>
    </div>
  );
}
