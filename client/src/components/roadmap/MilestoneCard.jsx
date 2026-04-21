/**
 * MilestoneCard.jsx — Individual milestone card for the roadmap
 */

import React, { useState } from "react";
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

export default function MilestoneCard({ milestone, isActive = false, onSelect }) {
  const [expanded, setExpanded] = useState(false);

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
                <span className="text-3xl">{milestone.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {milestone.month}
                    </span>
                    <CardTitle className="text-lg font-bold text-foreground">
                      {milestone.title}
                    </CardTitle>
                  </div>
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

            <Button className="w-full border-2 border-primary text-base mt-3">
              View Resources for Month {milestone.month}
            </Button>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}