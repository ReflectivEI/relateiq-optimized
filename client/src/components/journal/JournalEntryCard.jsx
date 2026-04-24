/**
 * JournalEntryCard.jsx
 * Individual journal entry card with metadata, content preview, and interaction
 */

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Heart, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const TYPE_CONFIG = {
  coach: {
    label: "AI Coach",
    icon: MessageCircle,
    color: "bg-blue-50 border-blue-200 text-blue-700",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  reflection: {
    label: "Daily Reflection",
    icon: Heart,
    color: "bg-pink-50 border-pink-200 text-pink-700",
    badgeColor: "bg-pink-100 text-pink-700",
  },
  "check-in": {
    label: "Weekly Check-In",
    icon: Calendar,
    color: "bg-green-50 border-green-200 text-green-700",
    badgeColor: "bg-green-100 text-green-700",
  },
};

const TONE_CONFIG = {
  grateful: "🙏 Grateful",
  hopeful: "✨ Hopeful",
  reflective: "🤔 Reflective",
  vulnerable: "💙 Vulnerable",
  thoughtful: "💭 Thoughtful",
  honest: "✓ Honest",
  great: "🌟 Great",
  good: "👍 Good",
  okay: "→ Okay",
  tough: "⚠️ Tough",
  difficult: "🌊 Difficult",
};

export default function JournalEntryCard({ entry, onExpand, expanded: controlledExpanded, onExpandedChange }) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG.coach;
  const Icon = config.icon;
  const expanded = typeof controlledExpanded === "boolean" ? controlledExpanded : internalExpanded;

  useEffect(() => {
    if (typeof controlledExpanded === "boolean") return;
    setInternalExpanded(false);
  }, [entry.id, controlledExpanded]);

  const setExpanded = (nextExpanded) => {
    if (typeof controlledExpanded === "boolean") {
      onExpandedChange?.(nextExpanded);
      return;
    }
    setInternalExpanded(nextExpanded);
    onExpandedChange?.(nextExpanded);
  };

  const getPreview = (text) => {
    if (!text) return "No content";
    return text.length > 100 ? text.substring(0, 100) + "..." : text;
  };

  const entryDate = new Date(entry.date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`border-2 cursor-pointer transition-all hover:shadow-md ${config.color}`}
        onClick={() => {
          const nextExpanded = !expanded;
          setExpanded(nextExpanded);
          onExpand?.(entry, nextExpanded);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            const nextExpanded = !expanded;
            setExpanded(nextExpanded);
            onExpand?.(entry, nextExpanded);
          }
        }}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 flex-1">
              <Icon className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-sm">{config.label}</span>
                  {entry.person_name && (
                    <Badge variant="outline" className="text-[10px]">
                      {entry.person_name}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(entryDate, "MMM d, yyyy • h:mm a")}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground shrink-0"
              onClick={(event) => {
                event.stopPropagation();
                const nextExpanded = !expanded;
                setExpanded(nextExpanded);
                onExpand?.(entry, nextExpanded);
              }}
              aria-label={expanded ? "Collapse timeline entry" : "Expand timeline entry"}
            >
              {expanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Metadata badges */}
          {(entry.mood || entry.tone || entry.topic) && (
            <div className="flex flex-wrap gap-1.5">
              {entry.mood && (
                <Badge className={`text-[10px] ${config.badgeColor}`}>
                  {TONE_CONFIG[entry.mood] || entry.mood}
                </Badge>
              )}
              {entry.tone && !entry.mood && (
                <Badge className={`text-[10px] ${config.badgeColor}`}>
                  {TONE_CONFIG[entry.tone] || entry.tone}
                </Badge>
              )}
              {entry.topic && (
                <Badge variant="outline" className="text-[10px]">
                  {entry.topic}
                </Badge>
              )}
              {entry.direction && (
                <Badge variant="outline" className="text-[10px]">
                  {entry.direction}
                </Badge>
              )}
            </div>
          )}

          {/* Preview */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {getPreview(entry.content || entry.answer || entry.situation)}
          </p>

          {/* Expanded content */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pt-3 border-t border-current/10"
              >
                <div className="prose prose-sm max-w-none text-sm text-foreground">
                  {entry.content || entry.answer || entry.situation}
                </div>

                {/* Additional metadata */}
                {entry.type === "coach" && (
                  <div className="bg-white/40 p-2 rounded text-xs space-y-1 border border-current/10">
                    {entry.speaking_to && (
                      <p>
                        <span className="font-medium">Speaking to:</span> {entry.speaking_to}
                      </p>
                    )}
                    {entry.speaker && (
                      <p>
                        <span className="font-medium">Speaker:</span> {entry.speaker}
                      </p>
                    )}
                  </div>
                )}

                {entry.type === "check-in" && (
                  <div className="bg-white/40 p-2 rounded text-xs space-y-1 border border-current/10">
                    {entry.what_worked && (
                      <p>
                        <span className="font-medium">What worked:</span> {entry.what_worked}
                      </p>
                    )}
                    {entry.what_could_improve && (
                      <p>
                        <span className="font-medium">Could improve:</span> {entry.what_could_improve}
                      </p>
                    )}
                    {entry.gratitude && (
                      <p>
                        <span className="font-medium">Gratitude:</span> {entry.gratitude}
                      </p>
                    )}
                  </div>
                )}

                {entry.type === "reflection" && entry.mood && (
                  <div className="bg-white/40 p-2 rounded text-xs border border-current/10">
                    <p className="font-medium">Mood: {TONE_CONFIG[entry.mood] || entry.mood}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
