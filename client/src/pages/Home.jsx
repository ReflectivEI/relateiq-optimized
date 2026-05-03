import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import NotesPanel from "@/components/notes/NotesPanel";
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
  Bell,
  LibraryBig,
  NotebookPen,
  BrainCircuit,
  Send,
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
import { getRelationshipTerms } from "@/lib/relationshipParticipants";
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
    title: "Reflection Mirror",
    description: "Run a structured dual-perspective analysis from your situation details.",
    icon: MessagesSquare,
    path: "/reflect?mode=mirror",
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

function firstSentence(text = "", maxChars = 120) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "No message preview available.";
  const sentence = normalized.split(/(?<=[.!?])\s+/)[0] || normalized;
  if (sentence.length <= maxChars) return sentence;
  return `${sentence.slice(0, maxChars - 3).trimEnd()}...`;
}

function compactText(text = "", maxChars = 180, fallback = "") {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  const source = normalized || fallback;
  if (!source) return "";
  if (source.length <= maxChars) return source;
  return `${source.slice(0, maxChars - 3).trimEnd()}...`;
}

function formatInboxTimestamp(note) {
  const raw = note?.updated_date || note?.created_date;
  const date = raw ? new Date(raw) : null;
  if (!date || Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Home() {
  const navigate = useNavigate();
  const { activeRelationshipId, activeRelationship, participants, primaryPerson, secondaryPerson, relationshipLabel, user } = useRelationshipAuth();
  const [repairSuggestion, setRepairSuggestion] = useState(null);
  const [repairLoading, setRepairLoading] = useState(false);
  const [repairDismissed, setRepairDismissed] = useState(false);
  const [riskSummary, setRiskSummary] = useState(null);
  const [expandedProfile, setExpandedProfile] = useState(null);
  const [expandedProfileCards, setExpandedProfileCards] = useState({});
  const [expandedInboxItems, setExpandedInboxItems] = useState({});
  const [messageDraft, setMessageDraft] = useState("");
  const [generatingMessage, setGeneratingMessage] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageConfirmation, setMessageConfirmation] = useState("");
  const queryClient = useQueryClient();

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
  const { data: notes = [] } = useQuery({
    queryKey: ["home-notes", activeRelationshipId],
    queryFn: () => api.entities.Note.filter({}),
    enabled: Boolean(activeRelationshipId),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });
  const terms = getRelationshipTerms(activeRelationship);
  const currentUserName = user?.name || primaryPerson;
  const currentPersonName = activeRelationship?.current_person_name || currentUserName || primaryPerson;
  const partnerName = participants.find((name) => name !== currentPersonName) || secondaryPerson;
  const sharedScope = `${participants[0]}_${participants[1]}`;
  const inboxMessages = notes
    .filter((note) => note.related_section === "messages")
    .filter((note) => note.recipient_name === currentPersonName)
    .sort((left, right) => new Date(right.updated_date || right.created_date) - new Date(left.updated_date || left.created_date));
  const sentMessages = notes
    .filter((note) => note.related_section === "messages")
    .filter((note) => note.person_name === currentPersonName)
    .sort((left, right) => new Date(right.updated_date || right.created_date) - new Date(left.updated_date || left.created_date));
  const unreadMessages = inboxMessages.filter((note) => !note.read_by_recipient);

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

  const toggleInboxItem = (id) => {
    if (!id) return;
    setExpandedInboxItems((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const handleSendMessage = async () => {
    if (!messageDraft.trim()) return;
    setSendingMessage(true);
    try {
      await api.entities.Note.create({
        person_name: currentPersonName,
        recipient_name: partnerName,
        content: messageDraft.trim(),
        related_section: "messages",
        related_item_id: activeRelationshipId,
        relationship_id: activeRelationshipId,
        shared_with_partner: true,
        read_by_recipient: false,
        message_type: "manual_message",
      });
      setMessageDraft("");
      setMessageConfirmation(`Message queued for ${partnerName}. They will see it in Connection Inbox and the notification bell.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["home-notes", activeRelationshipId] }),
        queryClient.invalidateQueries({ queryKey: ["topbar-notes", activeRelationshipId] }),
        queryClient.invalidateQueries({ queryKey: ["tester-inbox-messages", activeRelationshipId] }),
      ]);
      toast.success(`Message sent to ${partnerName}.`);
    } catch {
      toast.error("Unable to send message right now.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleGenerateMessageDraft = async () => {
    if (!partnerName || !currentPersonName) return;
    setGeneratingMessage(true);
    setMessageConfirmation("");
    try {
      const prompt = [
        "You are an elite relationship communication coach.",
        `Write a direct message draft from ${currentPersonName} to ${partnerName}.`,
        `Relationship type: ${terms.type}. Relationship bond label: ${terms.bond}.`,
        "Goals:",
        "1) Be emotionally intelligent and specific.",
        "2) Show understanding of the other person's likely perspective.",
        "3) Avoid blame, absolutist language, and passive aggression.",
        "4) Keep it concise (120-220 words).",
        "5) End with one clear, low-pressure next step.",
        "",
        "If a rough draft exists, improve it while preserving intent.",
        `Current draft: ${messageDraft.trim() || "(none yet)"}`,
        "",
        "Return only the improved message text.",
      ].join("\n");

      const result = await api.integrations.Core.InvokeLLM({
        prompt,
        model: "claude_sonnet_4_6",
      });
      const text = (typeof result === "string" ? result : result?.response || "").trim();
      if (!text) throw new Error("empty_ai_draft");
      setMessageDraft(text);
      toast.success(`AI draft generated for ${partnerName}.`);
    } catch {
      toast.error("Unable to generate a message draft right now.");
    } finally {
      setGeneratingMessage(false);
    }
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
          {terms.type === "romantic"
            ? "Your relationship command center for reflection, coaching, insight generation, and practical growth tools."
            : `Your ${terms.bond} command center for reflection, coaching, insight generation, and practical support.`}
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
          const communicationPreview = compactText(
            profile?.communication_style,
            180,
            `${name} is building a communication profile from questionnaire and session data.`,
          );
          const needsPreview = compactText(
            profile?.needs_during_conflict,
            170,
            "Clear reassurance, direct communication, and steady follow-through.",
          );
          const watchPreview = compactText(
            Array.isArray(profile?.emotional_triggers)
              ? profile.emotional_triggers.slice(0, 3).join(", ")
              : profile?.emotional_triggers,
            170,
            "Misattunement, assumptions, and unspoken stress buildup.",
          );
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
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Balanced Profile Snapshot
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
                      <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-3">
                        <div className="rounded-2xl border border-primary/15 bg-primary/5 px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Communication</p>
                          <p className="mt-1 min-h-[66px] text-xs leading-5 text-foreground">{communicationPreview}</p>
                        </div>
                        <div className="rounded-2xl border border-primary/15 bg-primary/5 px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Needs</p>
                          <p className="mt-1 min-h-[66px] text-xs leading-5 text-foreground">{needsPreview}</p>
                        </div>
                        <div className="rounded-2xl border border-primary/15 bg-primary/5 px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Watch For</p>
                          <p className="mt-1 min-h-[66px] text-xs leading-5 text-foreground">{watchPreview}</p>
                        </div>
                      </div>

                      {isExpanded ? (
                        <div className="max-h-48 overflow-y-auto rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                          <p className="text-sm leading-7 text-muted-foreground">
                            {profile.ai_behavioral_summary}
                          </p>
                        </div>
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

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card className="border border-border/70 bg-card/90">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-semibold text-foreground">Send Message</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Send a direct note to {partnerName}. They will see it in their Connection Inbox and notification bell.
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                <Send className="h-5 w-5" />
              </div>
            </div>
            <Textarea
              value={messageDraft}
              onChange={(event) => {
                setMessageDraft(event.target.value);
                if (messageConfirmation) setMessageConfirmation("");
              }}
              placeholder={`Write a message for ${partnerName}...`}
              className="min-h-[130px] resize-none bg-background"
            />
            {messageConfirmation ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
                {messageConfirmation}
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateMessageDraft}
                disabled={generatingMessage || sendingMessage}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {generatingMessage ? "Generating..." : "AI Draft For This Pairing"}
              </Button>
              <Button onClick={handleSendMessage} disabled={sendingMessage || !messageDraft.trim()} className="gap-2">
                <Send className="h-4 w-4" />
                {sendingMessage ? "Sending..." : `Send to ${partnerName}`}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/tester-inbox")}>
                Open Inbox
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card/90">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-semibold text-foreground">Connection Inbox</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Messages sent inside this pairing. Unread count: {unreadMessages.length}
                </p>
              </div>
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                <Bell className="h-5 w-5" />
                {unreadMessages.length > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-white">
                    {unreadMessages.length}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="space-y-3">
              {inboxMessages.length > 0 ? (
                inboxMessages.slice(0, 6).map((note) => (
                  <div key={note.id} className="rounded-2xl border border-border/60 bg-muted/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          From {note.person_name}: {firstSentence(note.content, 96)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatInboxTimestamp(note)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!note.read_by_recipient ? <span className="text-xs font-medium text-primary">Unread</span> : null}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => toggleInboxItem(note.id)}
                        >
                          {expandedInboxItems[note.id] ? "Collapse" : "Expand"}
                        </Button>
                      </div>
                    </div>
                    {expandedInboxItems[note.id] ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{note.content}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
                  No messages in this pairing yet.
                </div>
              )}
              {sentMessages.length > 0 ? (
                <div className="rounded-2xl border border-border/60 bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Recently Sent</p>
                  <div className="mt-3 space-y-2">
                    {sentMessages.slice(0, 3).map((note) => (
                      <div key={note.id} className="rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm">
                            <span className="font-medium text-foreground">To {note.recipient_name || partnerName}:</span> {firstSentence(note.content, 84)}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11px]"
                            onClick={() => toggleInboxItem(`sent-${note.id}`)}
                          >
                            {expandedInboxItems[`sent-${note.id}`] ? "Collapse" : "Expand"}
                          </Button>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{formatInboxTimestamp(note)}</p>
                        {expandedInboxItems[`sent-${note.id}`] ? <p className="mt-2 whitespace-pre-wrap text-xs leading-5">{note.content}</p> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <NotesPanel section="home" relatedItemId={activeRelationshipId} personName={sharedScope} />

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
            modalTitle={`Ask AI About ${relationshipLabel}`}
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
