/**
 * SentimentTrendChart.jsx — Mood trend chart across recent check-ins
 */
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp } from "lucide-react";

const MOOD_SCORE = { great: 5, good: 4, okay: 3, tough: 2, difficult: 1 };
const MOOD_LABEL = { 5: "Great", 4: "Good", 3: "Okay", 2: "Tough", 1: "Difficult" };

export default function SentimentTrendChart({ checkIns }) {
  if (checkIns.length < 2) return null;

  // Build per-person trend data (last 8 check-ins, chronological)
  const tony = checkIns.filter((c) => c.person_name === "Tony").slice(0, 8).reverse();
  const drew = checkIns.filter((c) => c.person_name === "Drew").slice(0, 8).reverse();

  // Merge by week label
  const weeks = new Set([...tony.map((c) => c.week_label), ...drew.map((c) => c.week_label)]);
  const data = Array.from(weeks)
    .slice(-8)
    .map((week) => {
      const t = tony.find((c) => c.week_label === week);
      const d = drew.find((c) => c.week_label === week);
      return {
        week: week?.replace("Week of ", "").split(",")[0] || "—",
        Tony: t ? MOOD_SCORE[t.mood] : null,
        Drew: d ? MOOD_SCORE[d.mood] : null,
      };
    });

  return (
    <Card className="enterprise-panel border-2 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="w-4 h-4 text-primary" />
          Sentiment Trend
        </CardTitle>
        <p className="text-xs text-muted-foreground">Mood scores over recent check-ins (5 = great, 1 = difficult)</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis domain={[1, 5]} tickCount={5} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => MOOD_LABEL[v] || ""} />
            <Tooltip
              formatter={(val, name) => [MOOD_LABEL[val] || val, name]}
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
            />
            <ReferenceLine y={3} stroke="hsl(var(--border))" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="Tony" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            <Line type="monotone" dataKey="Drew" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-primary rounded inline-block" />Tony</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded inline-block" style={{ background: "hsl(var(--chart-2))" }} />Drew</span>
        </div>
      </CardContent>
    </Card>
  );
}
