import React, { useEffect, useState } from "react";
import { api } from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getQuestionnaireContent } from "@/lib/questions";
import QuestionCard from "@/components/questionnaire/QuestionCard";
import { Lock, Globe, CheckCircle2, Sparkles, CopyPlus, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AskCoachDrawer from "@/components/ai/AskCoachDrawer";
import { buildContextObject } from "@/lib/aiCoachService";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import { getRelationshipTerms } from "@/lib/relationshipParticipants";
import { toast } from "sonner";

export default function Questionnaire() {
  const { activeRelationshipId, activeRelationship, participants } = useRelationshipAuth();
  const [person, setPerson] = useState(participants[0]);
  const [activeCategory, setActiveCategory] = useState("surface");
  const [mode, setMode] = useState("individual");
  const [prefilling, setPrefilling] = useState(false);
  const [restoringD5FromAudit, setRestoringD5FromAudit] = useState(false);
  const [autoAuditRestoreAttempted, setAutoAuditRestoreAttempted] = useState(false);
  const queryClient = useQueryClient();
  const relationshipType = activeRelationship?.type || "romantic";
  const isOwner = activeRelationship?.current_user_role === "owner";
  const terms = getRelationshipTerms(activeRelationship);
  const { questions, categories: questionCategories } = getQuestionnaireContent(relationshipType);

  useEffect(() => {
    if (!participants.includes(person)) {
      setPerson(participants[0]);
    }
  }, [participants, person]);

  const { data: responses = [] } = useQuery({
    queryKey: ["responses", activeRelationshipId, person],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: person }),
  });

  const verificationQuestionId = "d5";
  const verificationResponse = responses.find((record) => record.question_id === verificationQuestionId);

  const { data: d5DeleteAuditEvents = [] } = useQuery({
    queryKey: ["d5-delete-audit", activeRelationshipId, person, verificationQuestionId, isOwner],
    enabled: Boolean(isOwner && activeRelationshipId),
    queryFn: async () => {
      const payload = await api.audit.list({
        hours: 24 * 14,
        limit: 300,
        entity: "QuestionnaireResponse",
        action: "delete",
      });
      const events = Array.isArray(payload?.events) ? payload.events : [];
      return events.filter((event) => {
        const before = event?.record_before || {};
        return (
          String(before.question_id || "").trim() === verificationQuestionId &&
          String(before.person_name || "").trim().toLowerCase() === String(person || "").trim().toLowerCase()
        );
      });
    },
  });

  const restoreD5FromAudit = async (eventId, source = "manual") => {
    if (!isOwner) {
      toast.error("Only the relationship owner can run admin restore.");
      return false;
    }
    if (!eventId || String(eventId).startsWith("snapshot_")) {
      toast.error("No restorable audit event was found for this response.");
      return false;
    }

    setRestoringD5FromAudit(true);
    try {
      await api.audit.restore(eventId);
      await queryClient.invalidateQueries({ queryKey: ["responses", activeRelationshipId, person] });
      await queryClient.invalidateQueries({ queryKey: ["d5-delete-audit", activeRelationshipId, person, verificationQuestionId, isOwner] });
      if (source === "auto") {
        toast.success("Admin auto-restore recovered the deleted response from audit history.");
      } else {
        toast.success("Admin restore recovered the deleted response from audit history.");
      }
      return true;
    } catch {
      toast.error("Admin restore failed right now.");
      return false;
    } finally {
      setRestoringD5FromAudit(false);
    }
  };

  useEffect(() => {
    if (!isOwner) return;
    if (autoAuditRestoreAttempted) return;
    if (verificationResponse) return;
    if (!Array.isArray(d5DeleteAuditEvents) || d5DeleteAuditEvents.length === 0) return;

    const latest = d5DeleteAuditEvents.find((event) => !String(event?.id || "").startsWith("snapshot_"));
    if (!latest?.id) {
      setAutoAuditRestoreAttempted(true);
      return;
    }

    setAutoAuditRestoreAttempted(true);
    void restoreD5FromAudit(latest.id, "auto");
  }, [
    isOwner,
    autoAuditRestoreAttempted,
    verificationResponse,
    d5DeleteAuditEvents,
  ]);

  const categoryQuestions = questions.filter((q) => q.category === activeCategory);
  const activeCatMeta = questionCategories.find((c) => c.id === activeCategory);

  const answeredIds = new Set(responses.map((r) => r.question_id));
  // Count unique answered question IDs that exist in the schema (guards against duplicates or stale data)
  const validQuestionIds = new Set(questions.map((q) => q.id));
  const totalAnswered = Math.min([...answeredIds].filter((id) => validQuestionIds.has(id)).length, questions.length);
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? (totalAnswered / totalQuestions) * 100 : 0;
  const canPrefillFromBaseline = relationshipType !== "romantic" && person === participants[0];

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
    queryClient.invalidateQueries({ queryKey: ["responses", activeRelationshipId, person] });
  };

  const handlePrefillFromBaseline = async () => {
    setPrefilling(true);
    try {
      const result = await api.questionnaire.prefillFromBaseline({
        relationship_id: activeRelationshipId,
        person_name: person,
      });
      const currentResult =
        (result?.results || []).find(
          (entry) =>
            entry.relationship_id === activeRelationshipId &&
            String(entry.person_name || "").trim().toLowerCase() === person.trim().toLowerCase(),
        ) || null;
      await queryClient.invalidateQueries({ queryKey: ["responses", activeRelationshipId, person] });
      if (!currentResult) {
        toast.message("No questionnaire answers were copied for this connection.");
        return;
      }
      if (currentResult.error) {
        toast.error("We couldn't find a baseline questionnaire to copy from yet.");
        return;
      }
          if (currentResult.manual_review_question_ids?.length) {
        toast.success(
          `Copied ${currentResult.copied} answers. ${currentResult.manual_review_question_ids.length} questions still need a quick manual review.`,
        );
      } else {
        toast.success(`Copied ${currentResult.copied} baseline answers into this ${terms.bond} questionnaire.`);
      }
    } catch (error) {
      toast.error("Unable to prefill this questionnaire right now.");
    } finally {
      setPrefilling(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Questionnaire</h1>
          <p className="text-muted-foreground mt-1">
            Build private context for each person in this {terms.bond}, one question at a time.
          </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <Tabs value={person} onValueChange={setPerson}>
          <TabsList>
            {participants.map((participant) => (
              <TabsTrigger key={participant} value={participant}>{participant}</TabsTrigger>
            ))}
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (verificationResponse) {
                toast.success("d5 is already restored and saved on the server.");
                return;
              }
              const latest = d5DeleteAuditEvents.find((event) => !String(event?.id || "").startsWith("snapshot_"));
              if (!latest?.id) {
                toast.error("No audited delete event exists for d5 in this relationship yet.");
                return;
              }
              void restoreD5FromAudit(latest.id, "manual");
            }}
            disabled={!isOwner || restoringD5FromAudit}
            className="gap-1.5"
          >
            {restoringD5FromAudit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {restoringD5FromAudit ? "Restoring d5..." : verificationResponse ? "d5 Restored" : "Admin Restore d5"}
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/restore-center">Emergency Restore Center</Link>
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

      {canPrefillFromBaseline && totalAnswered < totalQuestions && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p className="text-sm font-medium text-foreground">Use your existing baseline as a starting point</p>
            <p className="mt-1 text-xs text-muted-foreground">
              We can copy the answers that still fit this {terms.typeLabel.toLowerCase()} context, adapt the wording where possible,
              and leave a smaller set for manual review.
            </p>
          </div>
          <Button type="button" onClick={handlePrefillFromBaseline} disabled={prefilling} className="gap-2">
            {prefilling ? <Loader2 className="h-4 w-4 animate-spin" /> : <CopyPlus className="h-4 w-4" />}
            {prefilling ? "Prefilling..." : "Prefill From Existing Baseline"}
          </Button>
        </motion.div>
      )}

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
        tonyResponses: person === participants[0] ? responses : [],
        drewResponses: person === participants[1] ? responses : [],
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
