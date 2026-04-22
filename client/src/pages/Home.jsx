import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User,
  Sparkles,
  BarChart3,
  CalendarCheck,
  ArrowRight,
  Star,
  Zap,
  Gamepad2,
  HeartHandshake,
  Expand,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AskAIButton from "@/components/askAI/AskAIButton";
import { buildContext } from "@/lib/contextBuilder";
import RepairSuggestionAlert from "@/components/repair/RepairSuggestionAlert";
import { generateRepairSuggestion, detectFriction } from "@/lib/repairSuggestionEngine";
import EarlyWarningCard from "@/components/dashboard/EarlyWarningCard";
import { getRiskSummary } from "@/lib/earlyWarningEngine";
import { buildFallbackProfile, normalizeProfileOutput } from "@/lib/aiSafe";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  {
    title: "Play Lab",
    description: "Learn more about each other through short interactive rounds",
    icon: Gamepad2,
    path: "/play-lab",
    color: "bg-primary/10 text-primary",
  },
];

export default function Home() {
  const [repairSuggestion, setRepairSuggestion] = useState(null);
  const [repairLoading, setRepairLoading] = useState(false);
  const [repairDismissed, setRepairDismissed] = useState(false);
  const [riskSummary, setRiskSummary] = useState(null);
  const [expandedProfile, setExpandedProfile] = useState(null);
  const [expandedProfileCards, setExpandedProfileCards] = useState({
    Tony: false,
    Drew: false,
  });

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

  const toggleProfileCard = (name) => {
    setExpandedProfileCards((current) => ({
      ...current,
      [name]: !current[name],
    }));
  };

  return (
    <div className="space-y-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-5 pt-4 text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-medium tracking-wide uppercase">
          <Sparkles className="h-3.5 w-3.5" />
          Tony & Drew
        </div>
        <p className="mx-auto text-base text-muted-foreground sm:text-lg lg:text-[1.25rem] lg:leading-8 lg:whitespace-nowrap">
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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {["Tony", "Drew"].map((name) => {
          const profile = name === "Tony" ? (tonyProfile || fallbackTony) : (drewProfile || fallbackDrew);
          const hasProfileData = Boolean(profile);
          const isExpanded = expandedProfileCards[name];
          const previewText = profile?.communication_style || `${name}'s profile preview`;
          return (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: name === "Tony" ? 0.1 : 0.2 }}
            >
              <Card className="h-full border border-border/70 bg-card/90 backdrop-blur-sm hover:shadow-md transition-shadow">
                <CardContent className="flex h-full flex-col p-6">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-[2rem] font-semibold leading-none text-foreground">{name}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {previewText}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full border border-primary/20 text-primary hover:bg-primary/5"
                        onClick={() => setExpandedProfile(name)}
                        title={`View full ${name} profile preview`}
                      >
                        <Expand className="h-4 w-4" />
                      </Button>
                      {hasProfileData ? (
                        <Star className="w-4 h-4 text-primary" />
                      ) : (
                        <Zap className="w-4 h-4 text-muted-foreground/40" />
                      )}
                    </div>
                  </div>
                  {profile?.ai_behavioral_summary ? (
                    <div className="flex-1 space-y-4">
                      {isExpanded ? (
                        <p className="text-base leading-8 text-muted-foreground">
                          {profile.ai_behavioral_summary}
                        </p>
                      ) : null}

                      {!isExpanded ? (
                        <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
                          Expand this section to view the full profile summary, needs, and watch-for patterns.
                        </div>
                      ) : null}

                      <AnimatePresence initial={false}>
                        {isExpanded ? (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                              <div className="rounded-2xl border border-primary/15 bg-primary/5 px-3 py-2">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Needs</p>
                                <p className="mt-1 text-xs leading-5 text-foreground">
                                  {profile.needs_during_conflict || "Clear reassurance and steadier communication."}
                                </p>
                              </div>
                              <div className="rounded-2xl border border-primary/15 bg-primary/5 px-3 py-2">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Watch For</p>
                                <p className="mt-1 text-xs leading-5 text-foreground">
                                  {Array.isArray(profile.emotional_triggers)
                                    ? profile.emotional_triggers.slice(0, 2).join(", ")
                                    : profile.emotional_triggers || "Moments of distance, mismatch, or unspoken tension."}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => toggleProfileCard(name)}
                        className="w-full justify-between rounded-full border-primary/20 bg-primary/5 text-foreground hover:bg-primary/10"
                      >
                        <span>{isExpanded ? "Collapse details" : "Expand details"}</span>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />}
                      </Button>
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
        <h2 className="mb-4 font-display text-2xl font-semibold">Quick Actions</h2>
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
                  <CardContent className="flex items-start gap-4 p-6">
                    <div className={`h-12 w-12 rounded-2xl ${action.color} flex items-center justify-center flex-shrink-0`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-foreground transition-colors group-hover:text-primary">
                        {action.title}
                      </h3>
                      <p className="mt-1 text-base text-muted-foreground">
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

      <Dialog open={Boolean(expandedProfile)} onOpenChange={(open) => !open && setExpandedProfile(null)}>
        <DialogContent className="max-w-3xl rounded-3xl border border-border/70 bg-white p-0 shadow-2xl">
          {expandedProfile && (
            <>
              <DialogHeader className="border-b border-border/60 bg-gradient-to-r from-[#14263f] to-[#0e6f72] px-6 py-5">
                <DialogTitle className="font-display text-2xl text-white">
                  {expandedProfile}'s Full Profile Summary
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 px-6 py-6">
                {(() => {
                  const profile = expandedProfile === "Tony" ? (tonyProfile || fallbackTony) : (drewProfile || fallbackDrew);
                  return (
                    <>
                      <p className="text-base leading-8 text-foreground">
                        {profile?.ai_behavioral_summary || `${expandedProfile}'s fuller summary will appear here once more profile detail is available.`}
                      </p>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Needs</p>
                          <p className="mt-2 text-sm leading-6 text-foreground">
                            {profile?.needs_during_conflict || "Clear reassurance and steadier communication."}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Watch For</p>
                          <p className="mt-2 text-sm leading-6 text-foreground">
                            {Array.isArray(profile?.emotional_triggers)
                              ? profile.emotional_triggers.join(", ")
                              : profile?.emotional_triggers || "Moments of distance, mismatch, or unspoken tension."}
                          </p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
