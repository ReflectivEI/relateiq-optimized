import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check, GripVertical, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function QuestionCard({ question, existingAnswer, onSubmit, mode }) {
  const [answer, setAnswer] = useState(existingAnswer?.answer || "");
  const [selectedOptions, setSelectedOptions] = useState(existingAnswer?.selected_options || []);
  const [ranking, setRanking] = useState(existingAnswer?.ranking || question.options || []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!existingAnswer);
  const textTimer = useRef(null);

  // Reset state if existingAnswer changes (e.g. person switch)
  useEffect(() => {
    setAnswer(existingAnswer?.answer || "");
    setSelectedOptions(existingAnswer?.selected_options || []);
    setRanking(existingAnswer?.ranking || question.options || []);
    setSaved(!!existingAnswer);
  }, [existingAnswer, question.id]);

  const doSave = async (data) => {
    setSaving(true);
    await onSubmit(question, data);
    setSaving(false);
    setSaved(true);
  };

  // Auto-save for choice, multi_choice, multi_choice_limited, scale
  const handleChoiceSelect = (option) => {
    let newOptions;
    let newAnswer;
    if (question.type === "multi_choice") {
      newOptions = selectedOptions.includes(option)
        ? selectedOptions.filter((o) => o !== option)
        : [...selectedOptions, option];
      newAnswer = newOptions.join(", ");
    } else if (question.type === "multi_choice_limited") {
      const maxSelect = question.max_select || 2;
      if (selectedOptions.includes(option)) {
        newOptions = selectedOptions.filter((o) => o !== option);
      } else if (selectedOptions.length < maxSelect) {
        newOptions = [...selectedOptions, option];
      } else {
        // At limit — deselect oldest, add new
        newOptions = [...selectedOptions.slice(1), option];
      }
      newAnswer = newOptions.join(", ");
    } else {
      newOptions = [option];
      newAnswer = option;
    }
    setSelectedOptions(newOptions);
    setAnswer(newAnswer);
    doSave({
      answer: newAnswer,
      selected_options: newOptions,
      ranking: [],
      tags: question.tags || [],
      weight: question.weight || "medium",
    });
  };

  const handleScaleSelect = (val) => {
    const strVal = String(val);
    setAnswer(strVal);
    setSelectedOptions([strVal]);
    doSave({
      answer: strVal,
      selected_options: [strVal],
      ranking: [],
      tags: question.tags || [],
      weight: question.weight || "medium",
    });
  };

  // Debounced auto-save for text
  const handleTextChange = (val) => {
    setAnswer(val);
    setSaved(false);
    clearTimeout(textTimer.current);
    textTimer.current = setTimeout(() => {
      if (val.trim()) {
        doSave({
          answer: val,
          selected_options: [],
          ranking: [],
          tags: question.tags || [],
          weight: question.weight || "medium",
        });
      }
    }, 1200);
  };

  // Manual save for ranking
  const handleRankSave = () => {
    doSave({
      answer: ranking.join(" > "),
      selected_options: ranking,
      ranking,
      tags: question.tags || [],
      weight: question.weight || "medium",
    });
  };

  const moveRankItem = (index, direction) => {
    const newRanking = [...ranking];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newRanking.length) return;
    [newRanking[index], newRanking[targetIndex]] = [newRanking[targetIndex], newRanking[index]];
    setRanking(newRanking);
    setSaved(false);
  };

  const isAnswered = saved || !!existingAnswer;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={cn(
        "border transition-all duration-300",
        isAnswered ? "border-primary/20 bg-primary/3" : "border-border/60 bg-card/80"
      )}>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium text-foreground leading-relaxed">{question.text}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              {saving && <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />}
              {!saving && isAnswered && <CheckCircle2 className="w-4 h-4 text-primary" />}
              {mode && (
                <Badge variant="outline" className="text-[10px]">
                  {mode}
                </Badge>
              )}
            </div>
          </div>

          {/* Text Input */}
          {question.type === "text" && (
            <Textarea
              placeholder="Share your thoughts..."
              value={answer}
              onChange={(e) => handleTextChange(e.target.value)}
              className="min-h-[100px] resize-none bg-background/50"
            />
          )}

          {/* Single / Multi Choice / Multi Choice Limited */}
          {(question.type === "choice" || question.type === "multi_choice" || question.type === "multi_choice_limited") && (
            <div className="space-y-2">
              {question.type === "multi_choice" && (
                <p className="text-xs text-muted-foreground">Select all that apply</p>
              )}
              {question.type === "multi_choice_limited" && (
                <p className="text-xs text-muted-foreground">
                  Select up to {question.max_select || 2} that best describe you
                  {selectedOptions.length > 0 && (
                    <span className="ml-1.5 text-primary font-medium">({selectedOptions.length}/{question.max_select || 2} selected)</span>
                  )}
                </p>
              )}
              {question.options.map((option) => {
                const isSelected = selectedOptions.includes(option);
                const atLimit = question.type === "multi_choice_limited" && selectedOptions.length >= (question.max_select || 2) && !isSelected;
                return (
                  <button
                    key={option}
                    onClick={() => handleChoiceSelect(option)}
                    disabled={saving}
                    className={cn(
                      "w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all duration-200",
                      isSelected
                        ? "border-primary/40 bg-primary/8 text-foreground"
                        : atLimit
                        ? "border-border/30 bg-background/20 text-muted-foreground/40 cursor-not-allowed"
                        : "border-border/50 bg-background/30 text-muted-foreground hover:border-border hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Scale */}
          {question.type === "scale" && (
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>Not at all</span>
                <span>Very much so</span>
              </div>
              <div className="flex gap-2 justify-between">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleScaleSelect(val)}
                    disabled={saving}
                    className={cn(
                      "flex-1 h-12 rounded-xl border text-sm font-semibold transition-all duration-200",
                      answer === String(val)
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border/50 bg-background/30 text-muted-foreground hover:border-primary/40 hover:bg-primary/5"
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ranking */}
          {question.type === "rank" && (
            <div className="space-y-2">
              <div className="space-y-1.5">
                {ranking.map((option, index) => (
                  <div
                    key={option}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50 bg-background/30 text-sm"
                  >
                    <span className="text-xs text-muted-foreground font-mono w-5">{index + 1}.</span>
                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40" />
                    <span className="flex-1 text-foreground">{option}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveRankItem(index, -1)}
                        disabled={index === 0}
                        className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-20 px-1"
                      >▲</button>
                      <button
                        onClick={() => moveRankItem(index, 1)}
                        disabled={index === ranking.length - 1}
                        className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-20 px-1"
                      >▼</button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleRankSave}
                disabled={saving}
                className="text-xs text-primary hover:text-primary/80 font-medium"
              >
                {saving ? "Saving..." : saved ? "✓ Order saved" : "Save ranking"}
              </button>
            </div>
          )}

          {/* Auto-save indicator for text */}
          {question.type === "text" && answer.trim() && (
            <p className="text-[11px] text-muted-foreground/60 text-right">
              {saving ? "Saving..." : saved ? "✓ Auto-saved" : "Saving in a moment..."}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}