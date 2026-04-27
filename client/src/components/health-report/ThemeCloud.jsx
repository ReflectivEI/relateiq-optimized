/**
 * ThemeCloud.jsx — Surfaces recurring keywords/themes from journal data
 */
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SendPartnerPill from "@/components/ui/SendPartnerPill";
import { Hash } from "lucide-react";

const STOP_WORDS = new Set([
  "i", "we", "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "my", "our", "is", "was", "it", "this", "that", "s", "he", "she",
  "they", "be", "have", "had", "do", "did", "are", "were", "been", "has", "not",
  "more", "me", "him", "her", "you", "your", "his", "its", "so", "if", "when",
  "what", "how", "about", "just", "each", "felt", "feel", "really", "very", "little",
  "as", "from", "by", "re", "which", "would", "could", "should", "also", "much",
]);

function extractTopWords(texts, topN = 18) {
  const freq = {};
  texts.forEach((text) => {
    if (!text) return;
    text
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
      .forEach((w) => {
        freq[w] = (freq[w] || 0) + 1;
      });
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, count }));
}

export default function ThemeCloud({ checkIns, reflections, coachSessions }) {
  const words = useMemo(() => {
    const texts = [
      ...checkIns.map((c) => `${c.what_worked} ${c.what_could_improve} ${c.gratitude}`),
      ...reflections.map((r) => r.answer),
      ...coachSessions.map((s) => s.situation),
    ];
    return extractTopWords(texts);
  }, [checkIns, reflections, coachSessions]);

  if (!words.length) return null;

  const max = words[0]?.count || 1;

  return (
    <Card className="enterprise-panel border-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Hash className="w-4 h-4 text-primary" />
          Key Themes
        </CardTitle>
        <p className="text-xs text-muted-foreground">Most recurring words across all entries</p>
        <div className="pt-2">
          <SendPartnerPill
            content={words}
            title="Key Themes"
            sourceLabel="Health Report"
            className="h-7 px-3 text-xs"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {words.map(({ word, count }, i) => {
            const size = count / max;
            return (
              <span
                key={word}
                className={`rounded-full border border-teal-500/35 bg-[#14263f] px-3 py-1.5 text-xs font-semibold capitalize text-white`}
                style={{ fontSize: `${0.7 + size * 0.45}rem` }}
              >
                {word}
                <span className="ml-1 text-[10px] text-teal-200/80">×{count}</span>
              </span>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
