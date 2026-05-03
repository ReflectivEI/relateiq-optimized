/**
 * ReflectionResponse.jsx — Display partner's response with intimacy focus
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ReflectionResponse({ response, partner, isOwn = false }) {
  if (!response) {
    return (
      <Card className="border-2 border-dashed border-muted">
        <CardContent className="p-6 text-center space-y-2">
          <p className="text-lg text-muted-foreground">
            {isOwn ? "You haven't answered yet" : `${partner} hasn't answered yet`}
          </p>
          <p className="text-sm text-muted-foreground">
            {isOwn ? "Your response will appear here" : "Their response will appear here once they answer"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card
        className={cn(
          "border-2 rounded-2xl",
          isOwn
            ? "bg-primary/5 border-primary/30"
            : "bg-accent/5 border-accent/30"
        )}
      >
        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground">
              {isOwn ? "Your Response" : `${partner}'s Response`}
            </h3>
            {response.partner_viewed && !isOwn && (
              <div className="flex items-center gap-1 text-xs text-primary font-semibold">
                <Eye className="w-3.5 h-3.5" />
                Seen
              </div>
            )}
            {!response.partner_viewed && !isOwn && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground font-semibold">
                <EyeOff className="w-3.5 h-3.5" />
                Not yet seen
              </div>
            )}
          </div>

          {/* Answer text */}
          <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
            {response.answer}
          </p>

          {/* Mood + timestamp */}
          {response.mood && (
            <div className="flex items-center gap-3 pt-3 border-t border-border/20">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Mood:
              </span>
              <span className="inline-flex px-2 py-1 rounded-lg bg-background/60 text-xs font-semibold text-foreground capitalize">
                {response.mood}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}