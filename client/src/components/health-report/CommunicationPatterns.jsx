/**
 * CommunicationPatterns.jsx — Visual breakdown of communication patterns
 */
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

const MOOD_SCORE = { great: 5, good: 4, okay: 3, tough: 2, difficult: 1 };

function moodEmoji(score) {
  if (score >= 4.5) return "😊";
  if (score >= 3.5) return "🙂";
  if (score >= 2.5) return "😐";
  if (score >= 1.5) return "😔";
  return "😞";
}

export default function CommunicationPatterns({ checkIns, coachSessions }) {
  const stats = useMemo(() => {
    // Per-person mood averages
    const personStats = ["Tony", "Drew"].map((name) => {
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
  }, [checkIns, coachSessions]);

  if (!stats.personStats.length && !stats.sortedTopics.length) return null;

  const maxTopic = stats.sortedTopics[0]?.[1] || 1;

  return (
    <Card className="border-2 border-border/60">
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
                <div key={p.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/40">
                  <span className="text-2xl">{moodEmoji(p.avg)}</span>
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
                      className="h-full bg-primary rounded-full"
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