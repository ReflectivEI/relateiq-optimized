/**
 * CoachSuggestionPills — Smart suggestion buttons for Coach page.
 * Converts pills to pre-filled situations and auto-runs guidance.
 */
import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function CoachSuggestionPills({ pills, onSelect, loading }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Suggestions</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {pills.map((pill, i) => (
          <motion.div key={pill.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelect(pill.id)}
              disabled={loading}
              className="w-full justify-start text-xs gap-1.5 text-left"
            >
              <span>{pill.icon}</span>
              <span>{pill.label}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}