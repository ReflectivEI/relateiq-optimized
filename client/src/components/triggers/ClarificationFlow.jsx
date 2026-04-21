/**
 * ClarificationFlow — adaptive clarification layer for AI Coach.
 * Shows 2–4 targeted questions before generating a coaching response,
 * when the system determines more context would significantly improve guidance.
 */
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronRight, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ClarificationFlow({ clarification, onComplete, onSkip }) {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const questions = clarification?.questions || [];
  const allAnswered = questions.every((_, i) => answers[i]?.trim());

  const handleSubmit = async () => {
    setSubmitting(true);
    const answeredQuestions = questions.map((q, i) => ({
      question: q.question,
      answer: answers[i] || "",
    }));
    await onComplete(answeredQuestions);
    setSubmitting(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="rounded-xl border border-primary/20 bg-primary/4 p-5 space-y-5"
      >
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {questions.length === 1
                ? "One quick question to make this more specific:"
                : `${questions.length} quick questions to tailor this guidance:`}
            </p>
            {clarification?.reason && (
              <p className="text-xs text-muted-foreground mt-0.5">{clarification.reason}</p>
            )}
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((q, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="space-y-2"
            >
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{q.question}</p>
                  {q.why && (
                    <p className="text-xs text-muted-foreground/70 mt-0.5 italic">Why this matters: {q.why}</p>
                  )}
                </div>
              </div>
              <Textarea
                placeholder="Your answer..."
                value={answers[i] || ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                className="min-h-[60px] max-h-[120px] resize-none bg-background/60 text-sm ml-7"
                rows={2}
              />
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 ml-0">
          <Button
            onClick={handleSubmit}
            disabled={submitting || !allAnswered}
            className="gap-2 text-sm"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            {submitting ? "Generating..." : "Get Tailored Guidance"}
          </Button>
          <button
            onClick={onSkip}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip — generate anyway
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}