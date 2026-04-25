/**
 * EvolutionChart — confidence score trend lines per perspective over time.
 * Uses recharts LineChart. No AI calls.
 */
import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { getActivePerspectiveKeys, getDisplayPerspective } from "@/lib/relationshipParticipants";

function getPerspectiveColor(value, participants = ["Person A", "Other Person"]) {
  const [primaryPerson = "Person A", secondaryPerson = "Other Person"] = participants;
  if (value === primaryPerson) return "#4f8ef7";
  if (value === secondaryPerson) return "#a855f7";
  if (value === `${primaryPerson}→${secondaryPerson}`) return "#22c55e";
  if (value === `${secondaryPerson}→${primaryPerson}`) return "#f97316";
  if (value === `${primaryPerson}+${secondaryPerson}`) return "#0e7490";
  return "#64748b";
}

export default function EvolutionChart({ entries, participants = ["Person A", "Other Person"] }) {
  if (!entries || entries.length < 2) return null;

  // Build a sorted timeline — one data point per entry, grouped by date label
  // Each point: { date, Tony, Drew, "Tony→Drew", "Drew→Tony" }
  const sorted = [...entries].sort((a, b) =>
    new Date(a.created_date) - new Date(b.created_date)
  );

  const points = sorted.map((e) => ({
    date: e.created_date ? format(parseISO(e.created_date), "MMM d") : "?",
    perspective: e.perspective,
    confidence: e.confidence_score != null ? Math.round(e.confidence_score * 100) : null,
  }));

  // Merge into chart-friendly format: one row per date, columns per perspective
  // If same date appears multiple times, last one wins per perspective
  const rowMap = {};
  points.forEach(({ date, perspective, confidence }) => {
    if (!rowMap[date]) rowMap[date] = { date };
    if (confidence != null) rowMap[date][perspective] = confidence;
  });
  const chartData = Object.values(rowMap);

  const activePerspectives = getActivePerspectiveKeys(participants).filter((p) =>
    chartData.some((row) => row[p] != null)
  );

  return (
    <Card className="border border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Confidence Score Over Time (%)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" unit="%" />
            <Tooltip
              contentStyle={{ fontSize: 11, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
              formatter={(val) => [`${val}%`, undefined]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {activePerspectives.map((p) => (
              <Line
                key={p}
                type="monotone"
                dataKey={p}
                name={getDisplayPerspective(p, participants)}
                stroke={getPerspectiveColor(p, participants)}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
