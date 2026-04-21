import React, { useState } from "react";
import { api } from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { questions, questionCategories } from "@/lib/questions";
import QuestionCard from "@/components/questionnaire/QuestionCard";
import { Lock, Globe, CheckCircle2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AskCoachDrawer from "@/components/ai/AskCoachDrawer";
import { buildContextObject } from "@/lib/aiCoachService";

export default function Questionnaire() {
  const [person, setPerson] = useState("Tony");
  const [activeCategory, setActiveCategory] = useState("surface");
  const [mode, setMode] = useState("individual");
  const queryClient = useQueryClient();

  const { data: responses = [] } = useQuery({
    queryKey: ["responses", person],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: person }),
  });

  const categoryQuestions = questions.filter((q) => q.category === activeCategory);
  const activeCatMeta = questionCategories.find((c) => c.id === activeCategory);

  const answeredIds = new Set(responses.map((r) => r.question_id));
  // Count unique answered question IDs that exist in the schema (guards against duplicates or stale data)
  const validQuestionIds = new Set(questions.map((q) => q.id));
  const totalAnswered = Math.min([...answeredIds].filter((id) => validQuestionIds.has(id)).length, questions.length);
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0;

  // New question IDs added in this enhancement — used to show "new questions" banner
  const NEW_QUESTION_IDS = new Set(["cf9", "cf10", "cf11", "d9", "d10", "nv9", "nv10", "p8"]);
  const newUnansweredInCategory = categoryQuestions.filter(
    (q) => NEW_QUESTION_IDS.has(q.id) && !answeredIds.has(q.id)
  );

  const handleSubmit = async (question, answerData) => {
    const existing = responses.find((r) => r.question_id === question.id);
    const payload = {
      ...answerData,
      mode,
      tags: question.tags || [],
      weight: question.weight || "medium",
    };
    if (existing) {
      await api.entities.QuestionnaireResponse.update(existing.id, payload);
    } else {
      await api.entities.QuestionnaireResponse.create({
        person_name: person,
        category: question.category,
        question_id: question.id,
        question_text: question.text,
        ...payload,
      });
    }
    queryClient.invalidateQueries({ queryKey: ["responses", person] });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Questionnaire</h1>
        <p className="text-muted-foreground mt-1">Build your relationship context, one question at a time</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <Tabs value={person} onValueChange={setPerson}>
          <TabsList>
            <TabsTrigger value="Tony">Tony</TabsTrigger>
            <TabsTrigger value="Drew">Drew</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button
            variant={mode === "individual" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("individual")}
            className="gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" /> Private
          </Button>
          <Button
            variant={mode === "shared" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("shared")}
            className="gap-1.5"
          >
            <Globe className="w-3.5 h-3.5" /> Shared
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{person}'s Progress</span>
          <span className="font-medium text-foreground">{totalAnswered} / {totalQuestions}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {questionCategories.map((cat) => {
          const catAnswered = new Set(responses.filter((r) => r.category === cat.id && validQuestionIds.has(r.question_id)).map((r) => r.question_id)).size;
          const catTotal = questions.filter((q) => q.category === cat.id).length;
          const isComplete = catAnswered === catTotal && catTotal > 0;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                activeCategory === cat.id
                  ? "border-primary/30 bg-primary/8 text-primary"
                  : "border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", cat.dot)} />
              {cat.label}
              {isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
              <span className="text-xs opacity-60">{catAnswered}/{catTotal}</span>
            </button>
          );
        })}
      </div>

      {/* Category Description */}
      {activeCatMeta && (
        <p className="text-sm text-muted-foreground">{activeCatMeta.description}</p>
      )}

      {/* New questions banner */}
      {newUnansweredInCategory.length > 0 && totalAnswered > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 px-4 py-3 rounded-xl bg-primary/8 border border-primary/20"
        >
          <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {newUnansweredInCategory.length} new {newUnansweredInCategory.length === 1 ? "question" : "questions"} added to this section
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              We've enhanced the questionnaire to improve your insights. Your previous answers are fully intact — just scroll down to complete the new ones.
            </p>
          </div>
        </motion.div>
      )}

      <AskCoachDrawer ctx={buildContextObject({
        page: "Questionnaire",
        sectionTitle: `${person}'s Responses`,
        scope: person,
        sourceInputs: { category: activeCategory, answeredCount: totalAnswered },
        tonyResponses: person === "Tony" ? responses : [],
        drewResponses: person === "Drew" ? responses : [],
      })} />

      {/* Questions */}
      <AnimatePresence mode="wait">
        <div className="space-y-4">
          {categoryQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              existingAnswer={responses.find((r) => r.question_id === q.id)}
              onSubmit={handleSubmit}
              mode={mode}
            />
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}