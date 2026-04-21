import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Heart,
  User,
  MessageCircleHeart,
  Sparkles,
  BarChart3,
  CalendarCheck,
  ArrowRight,
  Star,
  Zap,
  HeartHandshake
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AskAIButton from "@/components/askAI/AskAIButton";
import { buildContext } from "@/lib/contextBuilder";
import RepairSuggestionAlert from "@/components/repair/RepairSuggestionAlert";
import { generateRepairSuggestion, detectFriction } from "@/lib/repairSuggestionEngine";
import EarlyWarningCard from "@/components/dashboard/EarlyWarningCard";
import { getRiskSummary } from "@/lib/earlyWarningEngine";
import { buildFallbackProfile, normalizeProfileOutput } from "@/lib/aiSafe";

const quickActions = [
  {
    title: "Build Profiles",
    description: "Answer questions to build your relationship context",
    icon: User,
    path: "/questionnaire",
    color: "bg-primary/10 text-primary",
  },
  {
    title: "AI Coach",
    description: "Get guidance for sensitive conversations",
    icon: Sparkles,
    path: "/coach",
    color: "bg-primary/10 text-primary",
  },
  {
    title: "View Insights",
    description: "See patterns, compatibility, and growth areas",
    icon: BarChart3,
    path: "/insights",
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Weekly Check-In",
    description: "Reflect on how communication went this week",
    icon: CalendarCheck,
    path: "/check-in",
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Proactive Repair",
    description: "Get a script to repair tension or reconnect after conflict",
    icon: HeartHandshake,
    path: "/repair",
    color: "bg-primary/10 text-primary",
  },
];

export default function Home() {
  const [repairSuggestion, setRepairSuggestion] = useState(null);
  const [repairLoading, setRepairLoading] = useState(false);
  const [repairDismissed, setRepairDismissed] = useState(false);
  const [riskSummary, setRiskSummary] = useState(null);

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-home"],
    queryFn: () => api.entities.UserProfile.list(),
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ["checkins-home"],
    queryFn: () => api.entities.CheckIn.list("-created_date", 14),
  });

  const { data: repairEntries = [] } = useQuery({
    queryKey: ["repair-entries-home"],
    queryFn: () => api.entities.RepairEntry.list("-created_date", 10),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions-home"],
    queryFn: () => api.entities.CoachSession.list("-created_date", 15),
  });

  const { data: tonyResponses = [] } = useQuery({
    queryKey: ["tony-responses-home"],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: "Tony" }),
  });

  const { data: drewResponses = [] } = useQuery({
    queryKey: ["drew-responses-home"],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: "Drew" }),
  });

  const { data: triggers = [] } = useQuery({
    queryKey: ["triggers-home"],
    queryFn: () => api.entities.TriggerEntry.list(),
  });

  const tonyProfile = profiles.find((p) => p.person_name === "Tony");
  const drewProfile = profiles.find((p) => p.person_name === "Drew");
  const fallbackTony = !tonyProfile && tonyResponses.length > 0
    ? normalizeProfileOutput(buildFallbackProfile("Tony", tonyResponses), "Tony")
    : null;
  const fallbackDrew = !drewProfile && drewResponses.length > 0
    ? normalizeProfileOutput(buildFallbackProfile("Drew", drewResponses), "Drew")
    : null;

  // Run early warning system when check-ins load
  useEffect(() => {
    if (checkIns.length === 0) {
      setRiskSummary(null);
      return;
    }
    const summary = getRiskSummary({ checkIns, tonyProfile, drewProfile });
    setRiskSummary(summary);
  }, [checkIns, tonyProfile, drewProfile]);

  // Run friction detection when data loads — only fires AI if signals present
  useEffect(() => {
    if (repairDismissed || repairSuggestion || repairLoading) return;
    if (checkIns.length === 0 && repairEntries.length === 0 && sessions.length === 0) return;

    const friction = detectFriction({ checkIns, repairEntries, sessions });
    if (!friction.friction_detected) return;

    setRepairLoading(true);
    generateRepairSuggestion({
      tonyResponses,
      drewResponses,
      tonyProfile,
      drewProfile,
      checkIns,
      repairEntries,
      sessions,
      triggers,
    }).then((result) => {
      if (result) setRepairSuggestion(result);
    }).finally(() => setRepairLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIns.length, repairEntries.length, sessions.length]);

  const handleRepairRefresh = () => {
    setRepairSuggestion(null);
    setRepairDismissed(false);
    setRepairLoading(true);
    generateRepairSuggestion({
      tonyResponses, drewResponses, tonyProfile, drewProfile,
      checkIns, repairEntries, sessions, triggers,
    }).then((result) => {
      if (result) setRepairSuggestion(result);
    }).finally(() => setRepairLoading(false));
  };

  return (
    <div className="space-y-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-4 pt-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-medium tracking-wide uppercase">
          <Heart className="w-3.5 h-3.5" fill="currentColor" />
          Tony & Drew
        </div>
        <p className="mx-auto text-sm text-muted-foreground sm:text-base lg:text-lg lg:whitespace-nowrap">
          Your relationship command center for reflection, coaching, insight generation, and practical growth tools.
        </p>
      </motion.div>

      {/* Early Warning System */}
      {riskSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <EarlyWarningCard riskSummary={riskSummary} />
        </motion.div>
      )}

      {/* Repair Suggestion Alert */}
      <AnimatePresence>
        {(repairLoading || (repairSuggestion && !repairDismissed)) && (
          <RepairSuggestionAlert
            suggestion={repairSuggestion}
            loading={repairLoading}
            onDismiss={() => setRepairDismissed(true)}
            onRefresh={handleRepairRefresh}
          />
        )}
      </AnimatePresence>

      {/* Profile Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {["Tony", "Drew"].map((name) => {
          const profile = name === "Tony" ? (tonyProfile || fallbackTony) : (drewProfile || fallbackDrew);
          const hasProfileData = Boolean(profile);
          return (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: name === "Tony" ? 0.1 : 0.2 }}
            >
              <Card className="border border-border/60 bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow h-full">
                <CardContent className="p-5 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-display font-semibold text-primary">
                          {name[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {profile?.communication_style || `${name}'s profile preview`}
                        </p>
                      </div>
                    </div>
                    {hasProfileData ? (
                      <Star className="w-4 h-4 text-primary" />
                    ) : (
                      <Zap className="w-4 h-4 text-muted-foreground/40" />
                    )}
                  </div>
                  {profile?.ai_behavioral_summary ? (
                    <div className="flex-1 space-y-4">
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4 min-h-[96px]">
                        {profile.ai_behavioral_summary}
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="rounded-2xl border border-primary/15 bg-primary/5 px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Needs</p>
                          <p className="mt-1 line-clamp-2 text-xs text-foreground">
                            {profile.needs_during_conflict || "Clear reassurance and steadier communication."}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-primary/15 bg-primary/5 px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Watch For</p>
                          <p className="mt-1 line-clamp-2 text-xs text-foreground">
                            {Array.isArray(profile.emotional_triggers)
                              ? profile.emotional_triggers.slice(0, 2).join(", ")
                              : profile.emotional_triggers || "Moments of distance, mismatch, or unspoken tension."}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-auto">
                      <p className="min-h-[96px] text-sm text-muted-foreground leading-relaxed">
                        Start building {name}'s section so the dashboard can surface patterns, needs, and practical next steps with more precision.
                      </p>
                      <Link
                        to="/questionnaire"
                        className="mt-4 text-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Start building profile <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                  {!profile?.ai_behavioral_summary && hasProfileData && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {name}'s data is available and ready for a fuller profile view.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-display text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.path}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
            >
              <Link to={action.path}>
                <Card className="group border border-border/50 hover:border-primary/20 hover:shadow-md transition-all duration-300 cursor-pointer">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center flex-shrink-0`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-all group-hover:translate-x-0.5 mt-1" />
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Ask AI with Risk Context */}
      {riskSummary && (
        <div className="flex justify-center pt-2">
          <AskAIButton
            context={buildContext({
              section: "Home Dashboard",
              perspective: "Tony+Drew",
              riskSummary,
              profiles,
              checkIns,
              triggers,
              sessions,
            })}
            modalTitle="Ask AI About Early Warnings"
            showText={true}
            variant="outline"
          />
        </div>
      )}

      {/* Disclaimer */}
      <div className="text-center pt-4">
        <p className="text-xs text-muted-foreground/60 max-w-md mx-auto">
          This app provides guidance based on behavioral patterns and communication frameworks. It is not a substitute for licensed therapy.
        </p>
      </div>
    </div>
  );
}
