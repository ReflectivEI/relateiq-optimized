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
          <motion.div key={pill.id} className="min-w-0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelect(pill.id)}
              disabled={loading}
              className="h-auto w-full min-w-0 items-start justify-start gap-3 whitespace-normal rounded-2xl border-2 border-primary/25 bg-white px-3 py-2.5 text-left text-xs text-foreground hover:border-primary hover:bg-[#eef7f8]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-[#dff3f1]">
                <pill.icon className="h-4 w-4 text-[#0e6f72]" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col items-start overflow-hidden">
                <span className="w-full break-words text-left font-semibold leading-5 text-[#14263f]">{pill.label}</span>
                {pill.description && (
                  <span className="mt-0.5 w-full break-words leading-5 text-[11px] text-muted-foreground">
                    {pill.description}
                  </span>
                )}
              </span>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
