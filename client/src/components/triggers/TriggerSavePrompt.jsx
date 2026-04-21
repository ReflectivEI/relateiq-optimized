/**
 * TriggerSavePrompt — lightweight overlay shown when AI detects a potential trigger
 * in free text. Lets the user confirm, ignore, or dismiss.
 */
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, X, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveTrigger } from "@/lib/triggerService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SAVE_TYPE_LABELS = {
  trigger: { label: "Save as Trigger", color: "bg-orange-100 text-orange-700 border-orange-200" },
  support_preference: { label: "Save as Support Preference", color: "bg-blue-100 text-blue-700 border-blue-200" },
  pattern: { label: "Save as Pattern", color: "bg-purple-100 text-purple-700 border-purple-200" },
};

export default function TriggerSavePrompt({ suggestions, person, relatedContext, onDismiss }) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(null);
  const [saved, setSaved] = useState([]);

  if (!suggestions || suggestions.length === 0) return null;

  const handleSave = async (suggestion, idx) => {
    setSaving(idx);
    await saveTrigger({
      owner: person,
      suggestion,
      relatedContext,
      source: "ai_inferred",
    });
    setSaved((prev) => [...prev, idx]);
    setSaving(null);
    toast.success(`Saved: "${suggestion.title}"`);
    if (saved.length + 1 >= suggestions.length) {
      setTimeout(onDismiss, 800);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="rounded-xl border border-orange-200 bg-orange-50 p-4 space-y-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-500 shrink-0" />
            <p className="text-sm font-medium text-foreground">
              {suggestions.length === 1
                ? "This may be a trigger or sensitivity worth saving."
                : `${suggestions.length} potential triggers or patterns detected.`}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setExpanded(!expanded)} className="text-orange-400 hover:text-orange-600 transition-colors p-1">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button onClick={onDismiss} className="text-orange-400 hover:text-orange-600 transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {suggestions.map((s, i) => {
          const isSaved = saved.includes(i);
          const typeConfig = SAVE_TYPE_LABELS[s.save_type] || SAVE_TYPE_LABELS.trigger;

          return (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", typeConfig.color)}>
                  {typeConfig.label}
                </span>
                <span className="text-sm font-semibold text-foreground">{s.title}</span>
              </div>

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
                    {s.emotional_meaning && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium">Emotional meaning:</span> {s.emotional_meaning}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2">
                {isSaved ? (
                  <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                    <Check className="w-3.5 h-3.5" /> Saved
                  </span>
                ) : (
                  <>
                    <Button
                      size="sm"
                      className="h-7 px-3 text-xs gap-1.5 bg-orange-500 hover:bg-orange-600"
                      onClick={() => handleSave(s, i)}
                      disabled={saving === i}
                    >
                      <Zap className="w-3 h-3" />
                      Save
                    </Button>
                    <button
                      onClick={() => setSaved((prev) => [...prev, i])}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Not now
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}