/**
 * InsightTimeline.jsx
 * Chronological relationship events: Coach sessions, repairs, insights, major shifts
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Zap, Heart, TrendingUp, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const ICON_MAP = {
  coach: MessageCircle,
  repair: Heart,
  insight: TrendingUp,
  risk: AlertCircle,
  shift: Zap,
};

const COLOR_MAP = {
  coach: "bg-blue-50 border-blue-200 text-blue-700",
  repair: "bg-green-50 border-green-200 text-green-700",
  insight: "bg-purple-50 border-purple-200 text-purple-700",
  risk: "bg-red-50 border-red-200 text-red-700",
  shift: "bg-orange-50 border-orange-200 text-orange-700",
};

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
      id: s.id,
    })),
    ...repairs.map((r) => ({
      type: "repair",
      title: `Repair: ${r.owner}`,
      description: r.situation_type || "Repair attempted",
      date: new Date(r.created_date),
      outcome: r.outcome_rating,
      id: r.id,
    })),
    ...insights.map((i) => ({
      type: "insight",
      title: `Insight: ${i.perspective}`,
      description: preview(i.core_insight, "Insight generated"),
      date: new Date(i.created_date),
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
          const colorClass = COLOR_MAP[event.type] || "bg-slate-50 border-slate-200 text-slate-700";

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`border-2 ${colorClass}`}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`mt-0.5 p-2 rounded-lg ${colorClass.replace("text-", "bg-").replace("border-", "bg-").replace(" border", "")}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{event.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
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
