/**
 * HealthReportMetrics.jsx — Top-level stat cards for the weekly health report
 */
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
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
  const trendColor = trend === "up" ? "text-green-400" : trend === "down" ? "text-red-400" : "text-muted-foreground";

  const metrics = [
    {
      label: "Avg Mood",
      value: avgMoodLabel(checkIns),
      sub: "past check-ins",
      icon: <TrendIcon className={cn("w-4 h-4", trendColor)} />,
      color: trend === "up" ? "border-green-400/30" : trend === "down" ? "border-red-400/30" : "border-border",
    },
    {
      label: "Check-Ins",
      value: checkIns.length,
      sub: "total logged",
      color: "border-primary/30",
    },
    {
      label: "Reflections",
      value: reflections.length,
      sub: "daily answers",
      color: "border-blue-400/30",
    },
    {
      label: "Coach Sessions",
      value: coachSessions.length,
      sub: "conversations",
      color: "border-purple-400/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((m) => (
        <Card key={m.label} className={cn("border-2", m.color)}>
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