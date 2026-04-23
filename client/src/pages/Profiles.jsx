import React, { useEffect, useState } from "react";
import { api } from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Loader2, RefreshCw, User, Brain, ShieldCheck, Zap, Shield, TrendingUp,
  MessageCircle, AlertTriangle, Eye, Star, HelpCircle, FileStack, Heart
} from "lucide-react";
import { motion } from "framer-motion";
import { buildProfileGenerationPrompt } from "@/lib/prompts";
import { buildContextObject } from "@/lib/aiCoachService";
import {
  safeInvokeLLM,
  buildFallbackProfile,
  validateProfileOutput,
  normalizeProfileOutput,
  personalizePartnerLanguage,
  CreditLimitError,
} from "@/lib/aiSafe";
import DataSourceBadge from "@/components/ui/DataSourceBadge";
import AskCoachDrawer from "@/components/ai/AskCoachDrawer";
import AskAIButton from "@/components/askAI/AskAIButton";
import ExplainElaborateBar from "@/components/ai/ExplainElaborateBar";
import ExportBar from "@/components/ai/ExportBar";
import { buildContext } from "@/lib/contextBuilder";
import ProfileSection from "@/components/profile/ProfileSection";
import PrivacyNotice from "@/components/profile/PrivacyNotice";
import AILoadingState from "@/components/ui/AILoadingState";
import EmptyState from "@/components/ui/EmptyState";
import FallbackBadge from "@/components/ui/FallbackBadge";
import PrivacyBanner from "@/components/ui/PrivacyBanner";
import CreditLimitBanner from "@/components/ui/CreditLimitBanner";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";

export default function Profiles() {
  const { activeRelationshipId, participants, relationshipLabel } = useRelationshipAuth();
  const [activePerson, setActivePerson] = useState(participants[0]);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [profileCtx, setProfileCtx] = useState(null);
  const [creditError, setCreditError] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!participants.includes(activePerson)) {
      setActivePerson(participants[0]);
    }
  }, [participants, activePerson]);

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles", activeRelationshipId],
    queryFn: () => api.entities.UserProfile.list(),
  });

  const { data: responses = [] } = useQuery({
    queryKey: ["all-responses", activeRelationshipId, activePerson],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: activePerson }),
  });

  const profile = profiles.find((p) => p.person_name === activePerson);

  const lastGenerated = profile?.updated_date || profile?.created_date || null;
  // Only show fallback badge if summary is very short (normalizer default text)
  const isFallbackProfile = profile?.ai_behavioral_summary &&
    profile.ai_behavioral_summary.length < 120 &&
    !profile.ai_behavioral_summary.includes("shared") &&
    profile.personality_traits?.length === 0;

  const generateProfile = async () => {
    setGenerating(true);
    setCreditError(false);
    const partnerName = participants.find((person) => person !== activePerson) || participants[1] || "Other Person";
    const answersText = responses
      .map((r) => `Q (${r.category}): ${r.question_text}\nA: ${r.answer}`)
      .join("\n\n");

    const prompt = buildProfileGenerationPrompt(activePerson, answersText, responses);

    let result;
    try {
      result = await safeInvokeLLM(
      {
        prompt,
        model: "claude_sonnet_4_6",
        partnerLanguage: { personName: activePerson, partnerName },
        response_json_schema: {
          type: "object",
          properties: {
            communication_style: { type: "string" },
            conflict_tendencies: { type: "string" },
            emotional_triggers: { type: "array", items: { type: "string" } },
            needs_during_conflict: { type: "string" },
            processing_style: { type: "string" },
            values_priorities: { type: "array", items: { type: "string" } },
            personality_traits: { type: "array", items: { type: "string" } },
            growth_areas: { type: "array", items: { type: "string" } },
            past_patterns: { type: "string" },
            partner_perception: { type: "string" },
            love_language: { type: "string" },
            ai_behavioral_summary: { type: "string" },
            trait_weights: { type: "object" },
          },
        },
      },
      35000,
      null,
      validateProfileOutput
      );
    } catch (err) {
      if (err instanceof CreditLimitError) { setCreditError(true); setGenerating(false); return; }
      throw err;
    }

    // Fallback if AI timed out, failed, or produced invalid output after 2 attempts
    if (!result) {
      result = buildFallbackProfile(activePerson, responses);
    }

    // Always normalize — fills any missing fields so UI never renders empty sections
    result = personalizePartnerLanguage(
      normalizeProfileOutput(result, activePerson),
      { personName: activePerson, partnerName }
    );
    console.log("[Profiles] FINAL OUTPUT:", result);

    if (profile) {
      await api.entities.UserProfile.update(profile.id, { ...result, person_name: activePerson });
    } else {
      await api.entities.UserProfile.create({ ...result, person_name: activePerson });
    }

    queryClient.invalidateQueries({ queryKey: ["profiles", activeRelationshipId] });
    setProfileCtx(buildContextObject({
      page: "Profiles",
      sectionTitle: `${activePerson}'s Behavioral Profile`,
      scope: activePerson,
      sourceInputs: { responseCount: responses.length },
      originalOutput: result.ai_behavioral_summary || JSON.stringify(result, null, 2),
      profiles: profile ? [profile] : [],
      tonyResponses: activePerson === participants[0] ? responses : [],
      drewResponses: activePerson === participants[1] ? responses : [],
    }));
    setGenerating(false);
    setActiveTab("my-profile");
  };

  const profileContext = profile?.ai_behavioral_summary || "";
  const formatProfileDisplayValue = (value) => {
    if (!value) return value;
    const normalized = String(value).trim().toLowerCase();
    if (normalized === "needs_time") return "Needs Time";
    if (normalized === "mixed") return "Mixed";
    return String(value)
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const deepSections = profile ? [
    {
      title: "Who You Are",
      icon: Star,
      content: profile.ai_behavioral_summary,
    },
    {
      title: "How You Communicate",
      icon: MessageCircle,
      content: profile.communication_style,
    },
    {
      title: "What You Need to Feel Connected",
      icon: Heart,
      content: profile.needs_during_conflict,
    },
    {
      title: "What Triggers You",
      icon: Zap,
      content: profile.emotional_triggers,
    },
    {
      title: "Your Conflict Patterns",
      icon: AlertTriangle,
      content: profile.conflict_tendencies,
    },
    {
      title: "Where You Get Stuck",
      icon: Brain,
      content: profile.past_patterns,
    },
    {
      title: "What Helps You Show Up Better",
      icon: TrendingUp,
      content: profile.growth_areas,
    },
    {
      title: "How Your Partner Sees You",
      icon: Eye,
      content: profile.partner_perception,
    },
  ] : [];

  const askAIContext = buildContext({
    section: "Profiles",
    perspective: activePerson,
    profiles,
    checkIns: [],
    triggers: [],
    sessions: [],
  });

  const ctx = profileCtx || buildContextObject({
    page: "Profiles",
    sectionTitle: `${activePerson}'s Profile`,
    scope: activePerson,
    sourceInputs: {},
    originalOutput: profile?.ai_behavioral_summary || null,
    profiles: profile ? [profile] : [],
    tonyResponses: activePerson === participants[0] ? responses : [],
    drewResponses: activePerson === participants[1] ? responses : [],
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="space-y-2">
          <p className="enterprise-section-label">Behavioral Profiles</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Profiles</h1>
          <p className="max-w-3xl text-muted-foreground">
            Clean, readable behavioral profiles for {relationshipLabel}. Use the overview for the summary, the profile
            tab for deeper interpretation, and the trait map for the data underneath it.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 lg:items-end">
          <Button onClick={generateProfile} disabled={generating || responses.length === 0} className="gap-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {profile ? "Regenerate" : "Generate"} Profile
          </Button>
          {lastGenerated && (
            <p className="text-[11px] text-muted-foreground">
              Last generated: {new Date(lastGenerated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
      </div>

      <PrivacyBanner />
      <PrivacyNotice />
      {creditError && <CreditLimitBanner />}

      <AILoadingState active={generating} mode="profile" />

      <Tabs value={activePerson} onValueChange={(v) => { setActivePerson(v); setActiveTab("overview"); }}>
        <TabsList className="rounded-full border border-border bg-muted/40 p-1">
          {participants.map((participant) => (
            <TabsTrigger key={participant} value={participant}>{participant}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <AskCoachDrawer ctx={ctx} />

      {responses.length === 0 && (
        <EmptyState
          icon={HelpCircle}
          title={`No answers yet for ${activePerson}`}
          description="Complete at least a few questionnaire questions to generate a behavioral profile. Even 5–10 answers produce meaningful results."
          actionLabel="Go to Questionnaire"
          onAction={() => window.location.href = "/questionnaire"}
        />
      )}

      {profile ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-2 rounded-full border border-border bg-muted/40 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="my-profile">My Profile</TabsTrigger>
            <TabsTrigger value="traits">Trait Map</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-5 mt-4">
            {isFallbackProfile && <FallbackBadge />}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="enterprise-panel border-2 border-primary/20">
                <CardContent className="p-6">
                  <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
                    <div className="space-y-4">
                      <p className="enterprise-section-label">Executive Summary</p>
                      <p className="text-foreground leading-8">{profile.ai_behavioral_summary}</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        {profile.processing_style && (
                          <div className="enterprise-panel-muted rounded-2xl p-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                              <Brain className="w-4 h-4 text-primary" />
                              Processing Style
                            </div>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{formatProfileDisplayValue(profile.processing_style)}</p>
                          </div>
                        )}
                        {profile.love_language && (
                          <div className="enterprise-panel-muted rounded-2xl p-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                              <ShieldCheck className="w-4 h-4 text-primary" />
                              Connection Signal
                            </div>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{profile.love_language}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4 rounded-[1.25rem] border border-border bg-muted/20 p-5">
                      <p className="enterprise-section-label">Tools</p>
                      <DataSourceBadge className="shadow-sm" sources={[
                        { label: "questionnaire answers", count: responses.length },
                        { label: "behavioral tags", count: (profile.personality_traits || []).length },
                      ]} />
                      <div className="space-y-3 rounded-2xl border border-border/50 bg-[#f8fbfd] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Explore this profile</p>
                        <ExplainElaborateBar ctx={ctx} />
                      </div>
                      <div className="space-y-3 rounded-2xl border border-border/50 bg-[#f8fbfd] p-4">
                        <ExportBar ctx={ctx} content={[
                      profile.ai_behavioral_summary,
                      `Communication Style: ${profile.communication_style}`,
                      `Conflict Tendencies: ${profile.conflict_tendencies}`,
                      `Needs During Conflict: ${profile.needs_during_conflict}`,
                      `Emotional Triggers:\n${(profile.emotional_triggers || []).map(t => `• ${t}`).join("\n")}`,
                      `Growth Areas:\n${(profile.growth_areas || []).map(g => `• ${g}`).join("\n")}`,
                      ].join("\n\n")} />
                      </div>
                      <div className="pt-1">
                        <AskAIButton
                          context={askAIContext}
                          modalTitle={`${activePerson}'s Profile`}
                          showText={true}
                          className="h-10 rounded-full border-2 border-primary/35 bg-white px-4 text-sm font-medium text-primary hover:bg-primary/5"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              {[
                { key: "communication_style", label: "Communication Style", icon: MessageCircle },
                { key: "conflict_tendencies", label: "Conflict Tendencies", icon: Zap },
                { key: "emotional_triggers", label: "Emotional Triggers", icon: AlertTriangle },
                { key: "needs_during_conflict", label: "Needs During Conflict", icon: Shield },
                { key: "growth_areas", label: "Growth Areas", icon: TrendingUp },
                { key: "values_priorities", label: "Core Values", icon: Star },
              ].map((section, i) => {
                const value = profile[section.key];
                if (!value || (Array.isArray(value) && value.length === 0)) return null;
                return (
                  <motion.div key={section.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="enterprise-panel border-2 h-full">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <section.icon className="w-5 h-5 text-primary" />
                          {section.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {Array.isArray(value) ? (
                          <div className="flex flex-wrap gap-2">
                            {value.map((item) => (
                              <div key={item} className="rounded-full border border-teal-500/30 bg-[#14263f] px-3 py-1.5 text-sm text-white">
                                {item}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-base text-foreground leading-relaxed">{value}</p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* MY PROFILE DEEP DIVE TAB */}
          <TabsContent value="my-profile" className="space-y-3 mt-4">
            <div className="enterprise-panel-muted rounded-2xl p-4 text-sm leading-7 text-muted-foreground">
              Each section below is intentionally broken into clearer pieces. Open a section to see what it means,
              why it matters, what to try differently, and a practical example.
            </div>
            {deepSections.map((section, i) => (
              <motion.div key={section.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <ProfileSection
                  title={section.title}
                  icon={section.icon}
                  content={section.content}
                  personName={activePerson}
                  profileContext={profileContext}
                />
              </motion.div>
            ))}
          </TabsContent>

          {/* TRAIT MAP TAB */}
          <TabsContent value="traits" className="space-y-4 mt-4">
            {profile.trait_weights && (
              <Card className="enterprise-panel border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileStack className="h-4 w-4 text-primary" />
                    Trait Intensity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(profile.trait_weights).map(([trait, weight]) => (
                    <div key={trait} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-52 capitalize">{trait.replace(/_/g, " ")}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(weight || 0) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground font-mono w-8">{((weight || 0) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {(profile.past_patterns || profile.partner_perception) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.past_patterns && (
                  <Card className="enterprise-panel border-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Past Patterns</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-foreground leading-relaxed">{profile.past_patterns}</p>
                    </CardContent>
                  </Card>
                )}
                {profile.partner_perception && (
                  <Card className="enterprise-panel border-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Partner Perception</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-foreground leading-relaxed">{profile.partner_perception}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        responses.length > 0 && !generating && (
          <EmptyState
            icon={User}
            title={`${activePerson}'s profile hasn't been generated yet`}
            description={`You have ${responses.length} questionnaire answers ready. Click "Generate Profile" to create ${activePerson}'s behavioral portrait.`}
            actionLabel="Generate Profile"
            onAction={generateProfile}
          />
        )
      )}
    </div>
  );
}
