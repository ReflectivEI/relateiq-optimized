/**
 * RelationshipRoadmap.jsx — 6-month growth milestone plan
 * Tailored to couple's patterns, profiles, and detected challenges
 */

import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Heart, AlertCircle, BookOpen, MessageSquareText, NotebookPen, CalendarCheck, HeartHandshake, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { computePatternProfile, detectMisalignments } from "@/lib/patternEngine";
import { generateRoadmap } from "@/lib/roadmapEngine";
import MilestoneCard from "@/components/roadmap/MilestoneCard";
import AskAIButton from "@/components/askAI/AskAIButton";
import { buildContext } from "@/lib/contextBuilder";
import ResponseExportBar from "@/components/export/ResponseExportBar";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";

function buildMonthResources(milestone, tonyName = "Tony", drewName = "Drew") {
  const resourcesByMonth = {
    1: {
      title: "Month 1 Resource Guide",
      summary: `This month is about building a clear shared baseline. Focus on how ${tonyName} and ${drewName} each experience stress, repair, closeness, and emotional safety before trying to optimize anything else.`,
      resources: [
        {
          title: "Questionnaire Review",
          description: "Revisit unanswered or lightly answered questions so the rest of the system has a stronger foundation.",
          path: "/questionnaire",
          cta: "Open Questionnaire",
          icon: BookOpen,
        },
        {
          title: "Profiles Alignment",
          description: "Read both profiles back-to-back and notice where each person’s needs and triggers overlap or mismatch.",
          path: "/profiles",
          cta: "Review Profiles",
          icon: MessageSquareText,
        },
        {
          title: "Journal The Baseline",
          description: "Write one short entry each: what currently feels easy, what feels hard, and what you want more of.",
          path: "/journal",
          cta: "Open Journal",
          icon: NotebookPen,
        },
      ],
    },
    2: {
      title: "Month 2 Resource Guide",
      summary: "Use this month to make conflict safer. Focus on smaller repair moments, cleaner pacing, and better aftercare instead of trying to solve everything at once.",
      resources: [
        {
          title: "Proactive Repair",
          description: "Generate repair language and use it after moments of tension before resentment has time to harden.",
          path: "/repair",
          cta: "Open Proactive Repair",
          icon: HeartHandshake,
        },
        {
          title: "AI Coach",
          description: "Bring in one real conflict moment and ask for a calmer way to reopen it.",
          path: "/coach",
          cta: "Open AI Coach",
          icon: MessageSquareText,
        },
        {
          title: "Weekly Check-In",
          description: "Track whether difficult conversations are becoming easier, more direct, or less activating.",
          path: "/check-in",
          cta: "Open Weekly Check-In",
          icon: CalendarCheck,
        },
      ],
    },
    3: {
      title: "Month 3 Resource Guide",
      summary: "This month shifts from friction management into warmth. Rebuild affection, appreciation, and small moments of visible effort that make each person feel chosen.",
      resources: [
        {
          title: "Daily Connections",
          description: "Use the shared daily prompts to create more gentle, consistent contact without forcing a heavy conversation.",
          path: "/daily",
          cta: "Open Daily Connections",
          icon: CalendarCheck,
        },
        {
          title: "Journal Small Wins",
          description: "Capture examples of affection, effort, and things that felt different in a good way.",
          path: "/journal",
          cta: "Write A Win",
          icon: NotebookPen,
        },
        {
          title: "Smart Tools",
          description: "Use guided tools when you want structure around closeness, appreciation, or reconnecting after distance.",
          path: "/smart-tools",
          cta: "Open Smart Tools",
          icon: BookOpen,
        },
      ],
    },
    4: {
      title: "Month 4 Resource Guide",
      summary: "Move from repair into alignment. This is the month to make the relationship feel more intentional, future-facing, and guided by shared values rather than only immediate problems.",
      resources: [
        {
          title: "Vision Board",
          description: "Capture what a stronger next season looks like so the relationship has a visible direction.",
          path: "/vision-board",
          cta: "Open Vision Board",
          icon: BookOpen,
        },
        {
          title: "Playbook",
          description: "Turn what you are learning into repeatable ways of talking, repairing, and checking in.",
          path: "/playbook",
          cta: "Open Playbook",
          icon: MessageSquareText,
        },
        {
          title: "Insights",
          description: "Review the larger couple patterns and see whether your goals match the actual dynamic you are living.",
          path: "/insights",
          cta: "Review Insights",
          icon: TrendingUp,
        },
      ],
    },
    5: {
      title: "Month 5 Resource Guide",
      summary: "Apply what you have learned under real-world pressure. The goal is not perfection, but staying connected even when energy, time, or stress are limited.",
      resources: [
        {
          title: "Knowledge Hub",
          description: "Pull in outside frameworks and reading when you want stronger shared language for what is happening.",
          path: "/knowledge",
          cta: "Open Knowledge Hub",
          icon: BookOpen,
        },
        {
          title: "Smart Tools",
          description: "Use structured prompts when you need help handling stress spillover, distance, or repeated friction.",
          path: "/smart-tools",
          cta: "Open Smart Tools",
          icon: MessageSquareText,
        },
        {
          title: "Check-In Under Pressure",
          description: "Log how stress is affecting both people before it quietly becomes conflict.",
          path: "/check-in",
          cta: "Log A Check-In",
          icon: CalendarCheck,
        },
      ],
    },
    6: {
      title: "Month 6 Resource Guide",
      summary: "Use this month to integrate. Review what changed, what still catches you, and what should become part of your normal rhythm going forward.",
      resources: [
        {
          title: "Insights Review",
          description: "Compare early patterns to current ones and decide what has genuinely improved.",
          path: "/insights",
          cta: "Review Insights",
          icon: TrendingUp,
        },
        {
          title: "Health Report",
          description: "Use the broader weekly snapshot to see whether the relationship feels steadier, warmer, and more resilient overall.",
          path: "/health-report",
          cta: "Open Health Report",
          icon: CalendarCheck,
        },
        {
          title: "Journal The Next Season",
          description: "Write down what should continue, what should stop, and what the next version of the roadmap should prioritize.",
          path: "/journal",
          cta: "Write Next Steps",
          icon: NotebookPen,
        },
      ],
    },
  };

  return resourcesByMonth[milestone.month] || {
    title: `Month ${milestone.month} Resource Guide`,
    summary: milestone.description,
    resources: [],
  };
}

export default function RelationshipRoadmap() {
  const { activeRelationshipId, participants, relationshipLabel } = useRelationshipAuth();
  const [selectedMonth, setSelectedMonth] = useState(1);
  const resourcesRef = useRef(null);
  const roadmapRef = useRef(null);

  // Fetch data
  const { data: tonyResponses = [] } = useQuery({
    queryKey: ["tony-responses-roadmap", activeRelationshipId, participants[0]],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: participants[0] }),
  });

  const { data: drewResponses = [] } = useQuery({
    queryKey: ["drew-responses-roadmap", activeRelationshipId, participants[1]],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: participants[1] }),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-roadmap", activeRelationshipId],
    queryFn: () => api.entities.UserProfile.list(),
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ["checkins-roadmap", activeRelationshipId],
    queryFn: () => api.entities.CheckIn.list("-created_date", 30),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions-roadmap", activeRelationshipId],
    queryFn: () => api.entities.CoachSession.list("-created_date", 20),
  });

  const { data: triggers = [] } = useQuery({
    queryKey: ["triggers-roadmap", activeRelationshipId],
    queryFn: () => api.entities.TriggerEntry.list(),
  });

  // Compute patterns and roadmap
  const tonyProfile = profiles.find((p) => p.person_name === participants[0]);
  const drewProfile = profiles.find((p) => p.person_name === participants[1]);

  const roadmap = useMemo(() => {
    if (!tonyResponses.length || !drewResponses.length) return null;

    const tonyPatterns = computePatternProfile("Tony", tonyResponses);
    const drewPatterns = computePatternProfile("Drew", drewResponses);
    const misalignments = detectMisalignments(tonyPatterns, "Tony", drewPatterns, "Drew");

    return generateRoadmap({
      tonyPatterns,
      drewPatterns,
      tonyProfile,
      drewProfile,
      checkIns,
      sessions,
      misalignments: misalignments.misalignments.map((m) => m.trait),
    });
  }, [tonyResponses, drewResponses, tonyProfile, drewProfile, checkIns, sessions]);

  const askAIContext = buildContext({
    section: "Relationship Roadmap",
    perspective: "Tony+Drew",
    roadmap,
    profiles: [tonyProfile, drewProfile].filter(Boolean),
    checkIns,
    triggers,
    sessions,
  });

  const selectedMilestone =
    roadmap?.milestones.find((milestone) => milestone.month === selectedMonth) || roadmap?.milestones?.[0];
  const monthResourceGuide = selectedMilestone
    ? buildMonthResources(
        selectedMilestone,
        tonyProfile?.person_name || "Tony",
        drewProfile?.person_name || "Drew",
      )
    : null;

  const handleViewResources = (month) => {
    setSelectedMonth(month);
    window.requestAnimationFrame(() => {
      resourcesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  if (!roadmap) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Data Required</h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-4">
            Complete both questionnaires to generate your personalized 6-month roadmap for {relationshipLabel}.
          </p>
          <Button asChild>
            <Link to="/questionnaire">Complete Questionnaire</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-5xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <TrendingUp className="w-10 h-10 text-primary" />
              Your Growth Roadmap
            </h1>
            <p className="text-muted-foreground text-lg mt-2">
              A 6-month plan tailored to the patterns and goals in {relationshipLabel}
            </p>
          </div>
          <AskAIButton context={askAIContext} modalTitle="Ask About Your Roadmap" />
        </div>
      </motion.div>

      <div ref={roadmapRef} className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="enterprise-panel border-2">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">Primary Focus</p>
            <p className="text-lg text-foreground font-bold mt-1 capitalize">
              {roadmap.primaryFocus.replace(/_/g, " ")}
            </p>
          </CardContent>
        </Card>

        <Card className="enterprise-panel border-2">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">Key Strength</p>
            <p className="text-lg text-foreground font-bold mt-1 capitalize">
              {roadmap.competentAreas[0]?.replace(/_/g, " ") || "Connection"}
            </p>
          </CardContent>
        </Card>

        <Card className="enterprise-panel border-2">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider">Duration</p>
            <p className="text-lg text-foreground font-bold mt-1">
              {roadmap.estimatedDuration}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Personalization Notice */}
      <Card className="border-2 border-teal-300 bg-teal-50">
        <CardContent className="p-5">
          <p className="text-sm text-teal-900 font-semibold uppercase tracking-wider mb-2">
            Tailored to Your Styles
          </p>
          <p className="text-base text-teal-950 leading-relaxed">
            <span className="font-semibold">{tonyProfile?.person_name || "Tony"}</span> tends toward{" "}
            <span className="font-medium">{roadmap.personalization.tonyStyle} communication</span>, while{" "}
            <span className="font-semibold">{drewProfile?.person_name || "Drew"}</span> is more{" "}
            <span className="font-medium">{roadmap.personalization.drewStyle}</span>. This roadmap accounts for both of you.
          </p>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-foreground">
          6-Month Growth Timeline
        </h2>
        <div className="space-y-3">
          {roadmap.milestones.map((milestone) => (
            <MilestoneCard
              key={milestone.month}
              milestone={milestone}
              isActive={selectedMonth === milestone.month}
              onSelect={setSelectedMonth}
              onViewResources={handleViewResources}
            />
          ))}
        </div>
      </div>

      {selectedMilestone && monthResourceGuide && (
        <Card ref={resourcesRef} className="enterprise-panel border-2 scroll-mt-24">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="enterprise-section-label">Month {selectedMilestone.month}</p>
                <CardTitle className="mt-2 text-2xl">
                  {monthResourceGuide.title}
                </CardTitle>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                  {monthResourceGuide.summary}
                </p>
              </div>
              <div className="rounded-full bg-[#0e6f72] px-4 py-2 text-sm font-semibold text-white">
                Focus: {selectedMilestone.focus}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-3">
              {monthResourceGuide.resources.map((resource) => (
                <Card key={resource.title} className="enterprise-panel-muted border">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/20 bg-white">
                        <resource.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-foreground">{resource.title}</p>
                        <p className="text-sm leading-6 text-muted-foreground">{resource.description}</p>
                      </div>
                    </div>
                    <Button asChild variant="outline" className="w-full">
                      <Link to={resource.path}>
                        {resource.cta}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="rounded-[1.2rem] border border-primary/15 bg-white p-5">
              <p className="enterprise-section-label">This Month's Working Goals</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {selectedMilestone.goals.map((goal) => (
                  <div key={goal} className="flex gap-2 rounded-2xl border border-primary/10 bg-[#eef4fb] p-4 text-sm leading-6 text-foreground">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{goal}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA */}
      <Card className="border-2 border-primary/30 bg-primary/5">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 text-primary" />
            <p className="text-lg font-bold text-foreground">Ready to get started?</p>
          </div>
          <p className="text-base text-muted-foreground">
            Your roadmap is personalized based on your communication styles, patterns, and growth areas. Each month builds on the last.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Button
              type="button"
              onClick={() => handleViewResources(1)}
              className="border-2 border-primary text-base gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Start Month 1 Today
            </Button>
            <ResponseExportBar
              contentRef={roadmapRef}
              content={{
                activeMonth: selectedMilestone?.month,
                monthTitle: selectedMilestone?.title,
                monthSubtitle: selectedMilestone?.subtitle,
                monthlyGoals: selectedMilestone?.goals || [],
                resources: (selectedMilestone?.resources || []).map((item) => `${item.title}: ${item.description}`),
              }}
              filename="relationship-roadmap.pdf"
              title="Relationship Growth Roadmap"
              showEmail={false}
            />
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="text-center text-xs text-muted-foreground/60">
        <p>
          This roadmap is generated from your questionnaire responses and relationship patterns.
          Adjust timing and focus based on your actual progress and needs.
        </p>
      </div>
      </div>
    </div>
  );
}
