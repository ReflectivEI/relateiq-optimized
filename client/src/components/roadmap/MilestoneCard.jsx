/**
 * MilestoneCard.jsx — Individual milestone card for the roadmap
 */

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Target, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const DIFFICULTY_COLORS = {
  easy: "bg-green-50 border-green-300",
  medium: "bg-amber-50 border-amber-300",
  hard: "bg-orange-50 border-orange-300",
};

export default function MilestoneCard({ milestone, isActive = false, onSelect, onViewResources }) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (isActive) {
      setExpanded(true);
    }
  }, [isActive]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (milestone.month - 1) * 0.1 }}
    >
      <Card
        className={cn(
          "border-2 cursor-pointer transition-all",
          DIFFICULTY_COLORS[milestone.difficulty],
          isActive && "ring-2 ring-primary"
        )}
      >
        <button
          onClick={() => {
            setExpanded(!expanded);
            onSelect && onSelect(milestone.month);
          }}
          className="w-full text-left"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0e6f72] text-sm font-bold text-white">
                  {milestone.month}
                </span>
                <div className="flex-1">
                  <CardTitle className="text-lg font-bold text-foreground">
                    {milestone.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {milestone.theme}
                  </p>
                </div>
              </div>
              {expanded ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground mt-0.5" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground mt-0.5" />
              )}
            </div>
          </CardHeader>
        </button>

        {expanded && (
          <CardContent className="space-y-4">
            <p className="text-base text-foreground leading-relaxed">
              {milestone.description}
            </p>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground uppercase tracking-wider">
                <Target className="w-4 h-4 inline mr-2" />
                Monthly Goals
              </p>
              <ul className="space-y-2">
                {milestone.goals.map((goal, i) => (
                  <li key={i} className="flex gap-2 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{goal}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-border/40">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Focus:
              </span>
              <span className="text-sm text-foreground font-medium">
                {milestone.focus}
              </span>
            </div>

            <Button
              type="button"
              onClick={() => onViewResources && onViewResources(milestone.month)}
              className="w-full border-2 border-primary text-base mt-3"
            >
              View Resources for Month {milestone.month}
            </Button>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}
