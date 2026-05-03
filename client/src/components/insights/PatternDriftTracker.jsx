/**
 * PatternDriftTracker.jsx
 * Shows increasing/decreasing behaviors and compares recent sessions
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function PatternDriftTracker({ recentSessions = [], patternScores = {} }) {
  if (!recentSessions || recentSessions.length < 2) {
    return null;
  }

  const getFrequency = (arr, keyword) => {
    return (arr.join(" ").match(new RegExp(keyword, "gi")) || []).length;
  };

  const situations = recentSessions.map((s) => s.situation);
  const keywords = [
    "conflict",
    "withdrawal",
    "communication",
    "repair",
    "triggered",
    "tension",
  ];

  const frequencies = keywords.map((kw) => ({
    keyword: kw,
    count: getFrequency(situations, kw),
  }));

  const increasing = frequencies.filter((f) => f.count > 1).sort((a, b) => b.count - a.count);
  const decreasing = frequencies
    .filter((f) => f.count <= 1)
    .sort((a, b) => a.count - b.count);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Increasing Patterns */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            Increasing Behaviors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {increasing.length > 0 ? (
            increasing.map((item) => (
              <div key={item.keyword} className="flex items-center justify-between text-sm">
                <span className="capitalize text-foreground">{item.keyword}</span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium dark:bg-orange-950/30 dark:text-orange-300">
                  {item.count}x
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No clear increase pattern</p>
          )}
        </CardContent>
      </Card>

      {/* Decreasing Patterns */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-green-500" />
            Decreasing Behaviors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {decreasing.length > 0 ? (
            decreasing.slice(0, 3).map((item) => (
              <div key={item.keyword} className="flex items-center justify-between text-sm">
                <span className="capitalize text-foreground">{item.keyword}</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium dark:bg-green-950/30 dark:text-green-300">
                  {item.count}x
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No clear decrease pattern</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}