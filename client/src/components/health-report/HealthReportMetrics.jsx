/**
 * HealthReportMetrics.jsx — Top-level stat cards for the weekly health report
 */
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ActivitySquare, BrainCircuit, MessageSquareText, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const MOOD_SCORE = { great: 5, good: 4, okay: 3, tough: 2, difficult: 1 };

function moodTrend(checkIns) {
  if (checkIns.length < 2) return "neutral";
  const recent = checkIns.slice(0, 3).map((c) => MOOD_SCORE[c.mood] || 3);
  const older = checkIns.slice(3, 6).map((c) => MOOD_SCORE[c.mood] || 3);
  if (!older.length) return "neutral";
  const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
  const avgOlder = older.reduce((a, b) => a + b, 0) / older.length;
  if (avgRecent > avgOlder + 0.4) return "up";
  if (avgRecent < avgOlder - 0.4) return "down";
  return "neutral";
}

function avgMoodLabel(checkIns) {
  if (!checkIns.length) return "—";
  const scored = checkIns.map((c) => MOOD_SCORE[c.mood] || 3);
  const avg = scored.reduce((a, b) => a + b, 0) / scored.length;
  if (avg >= 4.5) return "Great";
  if (avg >= 3.5) return "Good";
  if (avg >= 2.5) return "Okay";
  if (avg >= 1.5) return "Tough";
  return "Difficult";
}

export default function HealthReportMetrics({ checkIns, reflections, coachSessions }) {
  const trend = moodTrend(checkIns);
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-teal-500" : trend === "down" ? "text-red-500" : "text-muted-foreground";

  const metrics = [
    {
      label: "Overall Tone",
      value: avgMoodLabel(checkIns),
      sub: "from recent check-ins",
      icon: <TrendIcon className={cn("w-4 h-4", trendColor)} />,
      color: "border-primary/20",
    },
    {
      label: "Check-Ins",
      value: checkIns.length,
      sub: "weekly snapshots logged",
      icon: <ActivitySquare className="w-4 h-4 text-primary" />,
      color: "border-primary/20",
    },
    {
      label: "Reflections",
      value: reflections.length,
      sub: "journal-style entries",
      icon: <MessageSquareText className="w-4 h-4 text-primary" />,
      color: "border-primary/20",
    },
    {
      label: "Coach Sessions",
      value: coachSessions.length,
      sub: "conversations",
      icon: <BrainCircuit className="w-4 h-4 text-primary" />,
      color: "border-primary/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((m) => (
        <Card key={m.label} className={cn("enterprise-panel border-2", m.color)}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{m.label}</p>
              {m.icon}
            </div>
            <p className="text-2xl font-bold font-display text-foreground mt-1">{m.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{m.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
