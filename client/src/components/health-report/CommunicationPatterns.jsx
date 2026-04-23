/**
 * CommunicationPatterns.jsx — Visual breakdown of communication patterns
 */
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, UserRound } from "lucide-react";

const MOOD_SCORE = { great: 5, good: 4, okay: 3, tough: 2, difficult: 1 };

export default function CommunicationPatterns({ checkIns, coachSessions, participants = ["Tony", "Drew"] }) {
  const stats = useMemo(() => {
    // Per-person mood averages
    const personStats = participants.map((name) => {
      const mine = checkIns.filter((c) => c.person_name === name);
      if (!mine.length) return null;
      const scores = mine.map((c) => MOOD_SCORE[c.mood] || 3);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const tough = mine.filter((c) => c.mood === "tough" || c.mood === "difficult").length;
      return { name, avg, tough, total: mine.length };
    }).filter(Boolean);

    // Common coach session scenarios
    const topTopics = {};
    coachSessions.forEach((s) => {
      if (!s.situation) return;
      const keywords = ["conflict", "repair", "distance", "communication", "trigger", "overwhelm", "connection", "support", "trust", "intimacy"];
      keywords.forEach((kw) => {
        if (s.situation.toLowerCase().includes(kw)) {
          topTopics[kw] = (topTopics[kw] || 0) + 1;
        }
      });
    });

    const sortedTopics = Object.entries(topTopics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return { personStats, sortedTopics };
  }, [checkIns, coachSessions, participants]);

  if (!stats.personStats.length && !stats.sortedTopics.length) return null;

  const maxTopic = stats.sortedTopics[0]?.[1] || 1;

  return (
    <Card className="enterprise-panel border-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="w-4 h-4 text-primary" />
          Communication Patterns
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Per-person mood */}
        {stats.personStats.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mood by Person</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stats.personStats.map((p) => (
                <div key={p.name} className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-primary/8">
                    <UserRound className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Avg score {p.avg.toFixed(1)} / 5 across {p.total} check-ins
                      {p.tough > 0 ? ` · ${p.tough} tough week${p.tough > 1 ? "s" : ""}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Topic frequency */}
        {stats.sortedTopics.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Coach Session Topics</p>
            <div className="space-y-2">
              {stats.sortedTopics.map(([topic, count]) => (
                <div key={topic} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground capitalize w-28 shrink-0">{topic}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(count / maxTopic) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono w-5 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
