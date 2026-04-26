import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  BarChart3,
  ArrowRight,
  Star,
  Zap,
  HeartHandshake,
  Expand,
  ChevronDown,
  ChevronUp,
  MessagesSquare,
  LibraryBig,
  NotebookPen,
  BrainCircuit,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AskAIButton from "@/components/askAI/AskAIButton";
import { buildContext } from "@/lib/contextBuilder";
import RepairSuggestionAlert from "@/components/repair/RepairSuggestionAlert";
import { generateRepairSuggestion, detectFriction } from "@/lib/repairSuggestionEngine";
import EarlyWarningCard from "@/components/dashboard/EarlyWarningCard";
import { getRiskSummary } from "@/lib/earlyWarningEngine";
import { buildFallbackProfile, normalizeProfileOutput } from "@/lib/aiSafe";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const quickActions = [
  {
    title: "AI Coach",
    description: "Get context-aware guidance for the situation in front of you.",
    icon: Sparkles,
    path: "/coach",
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Relationship Chat",
    description: "Talk through tension, context, or decisions in real time.",
    icon: MessagesSquare,
    path: "/chat",
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Knowledge Hub",
    description: "Review intelligence and synthesized context for this pairing.",
    icon: LibraryBig,
    path: "/knowledge",
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Daily Connections",
    description: "Log the moments, signals, and interactions shaping this bond.",
    icon: HeartHandshake,
    path: "/daily",
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Journal",
    description: "Capture reflections and keep a clean record of what matters.",
    icon: NotebookPen,
    path: "/journal",
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Analysis Engine",
    description: "Generate structured analysis from questionnaire and live data.",
    icon: BrainCircuit,
    path: "/analysis",
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Proactive Repair",
    description: "Repair tension early with scripts and next-step guidance.",
    icon: HeartHandshake,
    path: "/repair",
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Insights",
    description: "Surface high-signal patterns, shifts, and blind spots quickly.",
    icon: BarChart3,
    path: "/insights",
    color: "bg-primary/10 text-primary",
  },
];

export default function Home() {
  const { activeRelationshipId, activeRelationship, participants, primaryPerson, secondaryPerson, relationshipLabel } = useRelationshipAuth();
  const [repairSuggestion, setRepairSuggestion] = useState(null);
  const [repairLoading, setRepairLoading] = useState(false);
  const [repairDismissed, setRepairDismissed] = useState(false);
  const [riskSummary, setRiskSummary] = useState(null);
  const [expandedProfile, setExpandedProfile] = useState(null);
  const [expandedProfileCards, setExpandedProfileCards] = useState({});

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-home", activeRelationshipId],
    queryFn: () => api.entities.UserProfile.list(),
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ["checkins-home", activeRelationshipId],
    queryFn: () => api.entities.CheckIn.list("-created_date", 14),
  });

  const { data: repairEntries = [] } = useQuery({
    queryKey: ["repair-entries-home", activeRelationshipId],
    queryFn: () => api.entities.RepairEntry.list("-created_date", 10),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions-home", activeRelationshipId],
    queryFn: () => api.entities.CoachSession.list("-created_date", 15),
  });

  const { data: tonyResponses = [] } = useQuery({
    queryKey: ["relationship-person-a-responses-home", activeRelationshipId, primaryPerson],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: primaryPerson }),
  });

  const { data: drewResponses = [] } = useQuery({
    queryKey: ["relationship-person-b-responses-home", activeRelationshipId, secondaryPerson],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: secondaryPerson }),
  });

  const { data: triggers = [] } = useQuery({
    queryKey: ["triggers-home", activeRelationshipId],
    queryFn: () => api.entities.TriggerEntry.list(),
  });

  const tonyProfile = profiles.find((p) => p.person_name === primaryPerson);
  const drewProfile = profiles.find((p) => p.person_name === secondaryPerson);
  const fallbackTony = !tonyProfile && tonyResponses.length > 0
    ? normalizeProfileOutput(buildFallbackProfile(primaryPerson, tonyResponses, secondaryPerson), primaryPerson)
    : null;
  const fallbackDrew = !drewProfile && drewResponses.length > 0
    ? normalizeProfileOutput(buildFallbackProfile(secondaryPerson, drewResponses, primaryPerson), secondaryPerson)
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
          {relationshipLabel}
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
        {participants.map((name, index) => {
          const profile = index === 0 ? (tonyProfile || fallbackTony) : (drewProfile || fallbackDrew);
          const hasProfileData = Boolean(profile);
          const isExpanded = Boolean(expandedProfileCards[name]);
          const previewText = profile?.communication_style || `${name}'s profile preview`;
          return (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index === 0 ? 0.1 : 0.2 }}
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
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className={`h-12 w-12 rounded-2xl ${action.color} flex items-center justify-center flex-shrink-0`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium text-foreground transition-colors group-hover:text-primary">
                        {action.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
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
              perspective: relationshipLabel,
              riskSummary,
              profiles,
              checkIns,
              triggers,
              sessions,
              relationship: activeRelationship,
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
                  const profile = expandedProfile === primaryPerson ? (tonyProfile || fallbackTony) : (drewProfile || fallbackDrew);
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
