/**
 * InsightTimeline.jsx
 * Chronological relationship events: Coach sessions, repairs, insights, major shifts
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Wrench, LineChart, AlertCircle, Clock3 } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

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

function formatEvent(event) {
  if (event.type === "coach") {
    const body = cleanText(event.description);
    const lowered = body.toLowerCase();
    let title = "Coach Guidance";
    if (lowered.includes("reconnect") || lowered.includes("repair")) title = "Reconnection Guidance";
    else if (lowered.includes("misunderstood")) title = "Misunderstanding Support";
    else if (lowered.includes("conflict") || lowered.includes("tension")) title = "Conflict Coaching";
    else if (lowered.includes("trigger") || lowered.includes("overwhelmed")) title = "Regulation Coaching";
    return {
      title,
      description: body && body.toLowerCase() !== "hi"
        ? body
        : `A short coaching request was opened for ${event.meta}.`,
    };
  }

  if (event.type === "repair") {
    return {
      title: "Repair Session",
      description: event.description || "A repair attempt was logged.",
    };
  }

  if (event.type === "insight") {
    return {
      title: "Generated Insight",
      description: cleanText(event.description) || "A new insight was added to the relationship timeline.",
    };
  }

  return {
    title: event.title,
    description: cleanText(event.description) || "No description available.",
  };
}

export default function InsightTimeline({
  sessions = [],
  repairs = [],
  insights = [],
  maxItems = 8,
}) {
  const preview = (value, fallback = "No description available") => {
    const text = typeof value === "string" ? value.trim() : "";
    if (!text) return fallback;
    return text.length > 60 ? `${text.substring(0, 60)}...` : text;
  };

  // Combine all events
  const events = [
    ...sessions.map((s) => ({
      type: "coach",
      title: `Coach: ${s.speaker} → ${s.speaking_to}`,
      description: preview(s.situation, "Coach session recorded"),
      date: new Date(s.created_date),
      meta: `${s.speaker} → ${s.speaking_to}`,
      id: s.id,
    })),
    ...repairs.map((r) => ({
      type: "repair",
      title: `Repair: ${r.owner}`,
      description: r.situation_type || "Repair attempted",
      date: new Date(r.created_date),
      outcome: r.outcome_rating,
      meta: r.owner,
      id: r.id,
    })),
    ...insights.map((i) => ({
      type: "insight",
      title: `Insight: ${i.perspective}`,
      description: preview(i.core_insight, "Insight generated"),
      date: new Date(i.created_date),
      meta: i.perspective,
      id: i.id,
    })),
  ];

  // Sort by date descending, limit
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
        {timeline.map((event, idx) => {
          const Icon = ICON_MAP[event.type] || MessageCircle;
          const styles = CARD_STYLES[idx % 2];
          const formatted = formatEvent(event);

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`border-2 ${styles.card}`}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${styles.iconWrap}`}>
                    <Icon className={`w-4 h-4 ${styles.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="font-semibold text-sm text-foreground">{formatted.title}</p>
                      <p className="text-xs text-muted-foreground">{event.meta}</p>
                    </div>
                    <p className="mt-1 text-sm text-[#14263f]">{formatted.description}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground/80">
                      <Clock3 className="h-3 w-3" />
                      {format(event.date, "MMM d, h:mm a")}
                    </p>
                    {event.outcome && (
                      <p className="text-xs font-medium mt-1 text-green-700">
                        Outcome: {event.outcome}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
