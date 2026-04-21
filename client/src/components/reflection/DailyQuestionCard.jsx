/**
 * DailyQuestionCard.jsx — Beautiful prompt display for daily reflection
 */

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Lightbulb } from "lucide-react";

export default function DailyQuestionCard({ question }) {
  return (
    <Card className="border-2 border-primary/30 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Today's Reflection
            </p>
          </div>
          {question.lgbtq_specific && (
            <Badge variant="outline" className="text-[10px] font-semibold">
              🌈 For Us
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main question */}
        <h2 className="text-2xl font-display font-bold text-foreground leading-snug">
          {question.text}
        </h2>

        {/* Guidance */}
        {question.prompt_guidance && (
          <div className="flex gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground italic">
              {question.prompt_guidance}
            </p>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-3 pt-2 border-t border-border/30">
          <span className="inline-flex px-2 py-1 rounded-lg bg-muted text-xs font-semibold text-foreground capitalize">
            {question.category.replace(/_/g, " ")}
          </span>
          {question.depth_level && (
            <span className="text-xs text-muted-foreground font-medium">
              Depth: <span className="font-semibold capitalize">{question.depth_level}</span>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}