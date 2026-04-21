import React, { useState } from "react";
import { api } from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Heart, TrendingUp, Zap } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { buildCheckInPrompt } from "@/lib/prompts";
import { buildContextObject } from "@/lib/aiCoachService";
import AskCoachDrawer from "@/components/ai/AskCoachDrawer";
import ExplainElaborateBar from "@/components/ai/ExplainElaborateBar";
import ExportBar from "@/components/ai/ExportBar";
import OutcomeLogger from "@/components/repair/OutcomeLogger";
import { safeInvokeLLM } from "@/lib/aiSafe";
import PrivacyBanner from "@/components/ui/PrivacyBanner";
import CreditLimitBanner from "@/components/ui/CreditLimitBanner";

function stripDuplicateReflectionHeading(value = "") {
  return value
    .replace(/^##?\s*AI Reflection\s*/i, "")
    .replace(/^##?\s*Your Reflection\s*/i, "")
    .replace(/^💬\s*Your Reflection\s*/i, "")
    .trim();
}

const moods = [
  { value: "great", label: "Great", icon: "😊" },
  { value: "good", label: "Good", icon: "🙂" },
  { value: "okay", label: "Okay", icon: "😐" },
  { value: "tough", label: "Tough", icon: "😔" },
  { value: "difficult", label: "Difficult", icon: "😞" },
];

export default function CheckIn() {
  const [person, setPerson] = useState("Tony");
  const [form, setForm] = useState({
    what_worked: "",
    what_could_improve: "",
    mood: "",
    gratitude: "",
    connected_moment: "",
    distance_moment: "",
    unasked_need: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [aiReflection, setAiReflection] = useState(null);
  const [checkInId, setCheckInId] = useState(null);
  const [checkInCtx, setCheckInCtx] = useState(null);
  const [creditError, setCreditError] = useState(false);
  const queryClient = useQueryClient();

  const { data: checkIns = [] } = useQuery({
    queryKey: ["checkins", person],
    queryFn: () => api.entities.CheckIn.filter({ person_name: person }, "-created_date", 20),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-checkin"],
    queryFn: () => api.entities.UserProfile.list(),
  });

  const { data: allResponses = [] } = useQuery({
    queryKey: ["responses-checkin", person],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: person }),
  });

  const profile = profiles.find((p) => p.person_name === person);
  const visibleCheckIns = checkIns.filter((ci) => ci.id !== checkInId);

  const handleSubmit = async () => {
    if (!form.what_worked.trim()) return;
    setSubmitting(true);

    const weekLabel = `Week of ${format(new Date(), "MMM d, yyyy")}`;

    // Build enriched prompt with new fields
    const enrichedForm = {
      ...form,
      // Append new fields to what_worked for richer context
    };
    const prompt = buildCheckInPrompt({ person, form: enrichedForm, profile, responses: allResponses, pastCheckIns: checkIns });

    let reflection;
    try {
      reflection = await safeInvokeLLM(
        {
          prompt,
          partnerLanguage: { personName: person, partnerName: person === "Tony" ? "Drew" : "Tony" },
        },
        20000,
        "We couldn't generate your reflection right now. Your check-in has been saved — try regenerating soon."
      );
    } catch (err) {
      if (err?.isCreditLimit) { setCreditError(true); setSubmitting(false); return; }
      throw err;
    }

    const entry = await api.entities.CheckIn.create({
      person_name: person,
      week_label: weekLabel,
      what_worked: form.what_worked,
      what_could_improve: form.what_could_improve,
      mood: form.mood,
      gratitude: form.gratitude,
      ai_reflection: reflection,
    });

    setCheckInId(entry?.id || null);
    setAiReflection(reflection);
    setCheckInCtx(buildContextObject({
      page: "Weekly Check-In",
      sectionTitle: `${person}'s Check-In`,
      scope: person,
      sourceInputs: { weekLabel, mood: form.mood },
      originalOutput: reflection,
      profiles,
      checkIns,
      tonyResponses: person === "Tony" ? allResponses : [],
      drewResponses: person === "Drew" ? allResponses : [],
    }));
    setForm({ what_worked: "", what_could_improve: "", mood: "", gratitude: "", connected_moment: "", distance_moment: "", unasked_need: "" });
    setSubmitting(false);
    queryClient.invalidateQueries({ queryKey: ["checkins", person] });
  };

  // Detect mood trend from past check-ins
  const moodTrend = checkIns.slice(0, 4).map((ci) => ci.mood);
  const toughCount = moodTrend.filter((m) => m === "tough" || m === "difficult").length;
  const showTrend = moodTrend.length >= 3;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Weekly Check-In</h1>
        <p className="text-muted-foreground mt-1">Reflect on how your week went together</p>
      </div>

      <PrivacyBanner />

      {creditError && <CreditLimitBanner />}

      <Tabs value={person} onValueChange={(v) => { setPerson(v); setAiReflection(null); setCheckInId(null); }}>
        <TabsList>
          <TabsTrigger value="Tony">Tony</TabsTrigger>
          <TabsTrigger value="Drew">Drew</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Mood trend notice */}
      {showTrend && toughCount >= 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-orange-50 border border-orange-200">
          <TrendingUp className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-sm text-orange-700">
            <span className="font-medium">Pattern detected:</span> {person} has had {toughCount} tough or difficult weeks recently. The AI coach will factor this into today's reflection.
          </p>
        </motion.div>
      )}

      <Card>
        <CardContent className="p-6 space-y-5">
          {/* Mood */}
          <div className="space-y-2">
            <Label>How was communication this week?</Label>
            <div className="flex flex-wrap gap-2">
              {moods.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setForm({ ...form, mood: m.value })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${
                    form.mood === m.value ? "border-primary/40 bg-primary/8 text-foreground" : "border-border/50 text-muted-foreground hover:border-border"
                  }`}
                >
                  <span>{m.icon}</span> {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Core fields */}
          <div className="space-y-2">
            <Label>What worked well this week?</Label>
            <Textarea
              placeholder="What moments of good communication stood out?"
              value={form.what_worked}
              onChange={(e) => setForm({ ...form, what_worked: e.target.value })}
              className="min-h-[80px] resize-none bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label>What could have gone better?</Label>
            <Textarea
              placeholder="Any moments where communication broke down?"
              value={form.what_could_improve}
              onChange={(e) => setForm({ ...form, what_could_improve: e.target.value })}
              className="min-h-[80px] resize-none bg-background/50"
            />
          </div>

          {/* Expanded structured prompts */}
          <div className="pt-2 border-t border-border/40 space-y-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> Deeper Reflection
            </p>

            <div className="space-y-2">
              <Label>What moment made you feel most connected?</Label>
              <Textarea
                placeholder="A specific moment — even small..."
                value={form.connected_moment}
                onChange={(e) => setForm({ ...form, connected_moment: e.target.value })}
                className="min-h-[60px] resize-none bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label>What moment created distance?</Label>
              <Textarea
                placeholder="What pulled you apart, even briefly..."
                value={form.distance_moment}
                onChange={(e) => setForm({ ...form, distance_moment: e.target.value })}
                className="min-h-[60px] resize-none bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label>What did you need but didn't ask for?</Label>
              <Textarea
                placeholder="Something you wanted but held back..."
                value={form.unasked_need}
                onChange={(e) => setForm({ ...form, unasked_need: e.target.value })}
                className="min-h-[60px] resize-none bg-background/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-primary" /> Gratitude
            </Label>
            <Textarea
              placeholder="Something you appreciate about your partner this week..."
              value={form.gratitude}
              onChange={(e) => setForm({ ...form, gratitude: e.target.value })}
              className="min-h-[60px] resize-none bg-background/50"
            />
          </div>

          <Button onClick={handleSubmit} disabled={submitting || !form.what_worked.trim()} className="gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit Check-In
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {aiReflection && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-primary/5 border-primary/15">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-primary">Your Weekly Reflection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground">
                  <ReactMarkdown>{stripDuplicateReflectionHeading(aiReflection)}</ReactMarkdown>
                </div>
                {checkInCtx && (
                  <div className="mt-4 pt-3 border-t border-primary/10 space-y-2">
                    <ExplainElaborateBar ctx={checkInCtx} />
                    <ExportBar ctx={checkInCtx} content={aiReflection} />
                    <OutcomeLogger
                      sourceType="Check-In"
                      relatedSessionId={checkInId}
                      scope={person}
                      recommendationSummary={`Check-in reflection for ${person}`}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AskCoachDrawer ctx={checkInCtx || buildContextObject({
        page: "Weekly Check-In",
        sectionTitle: `${person}'s Check-In`,
        scope: person,
        sourceInputs: {},
        profiles,
        checkIns,
        tonyResponses: person === "Tony" ? allResponses : [],
        drewResponses: person === "Drew" ? allResponses : [],
      })} />

      {visibleCheckIns.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Past Check-Ins</h2>
          <div className="space-y-3">
            {visibleCheckIns.map((ci) => (
              <Card key={ci.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{ci.week_label}</span>
                    <Badge variant="outline" className="text-xs">
                      {moods.find((m) => m.value === ci.mood)?.icon} {ci.mood}
                    </Badge>
                  </div>
                  {ci.what_worked && (
                    <p className="text-sm text-muted-foreground"><span className="text-foreground font-medium">Worked: </span>{ci.what_worked}</p>
                  )}
                  {ci.gratitude && (
                    <p className="text-sm text-muted-foreground"><span className="text-foreground font-medium">Grateful for: </span>{ci.gratitude}</p>
                  )}
                  {ci.ai_reflection && (
                    <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-xs text-primary font-medium mb-1">AI Reflection</p>
                      <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground">
                        <ReactMarkdown>{stripDuplicateReflectionHeading(ci.ai_reflection)}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
