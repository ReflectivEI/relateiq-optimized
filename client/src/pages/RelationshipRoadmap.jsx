/**
 * RelationshipRoadmap.jsx — 6-month growth milestone plan
 * Tailored to couple's patterns, profiles, and detected challenges
 */

import React, { useState, useMemo } from "react";
import { api } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Heart, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { computePatternProfile, detectMisalignments } from "@/lib/patternEngine";
import { generateRoadmap } from "@/lib/roadmapEngine";
import MilestoneCard from "@/components/roadmap/MilestoneCard";
import AskAIButton from "@/components/askAI/AskAIButton";
import { buildContext } from "@/lib/contextBuilder";

export default function RelationshipRoadmap() {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [generateMode, setGenerateMode] = useState("auto");

  // Fetch data
  const { data: tonyResponses = [] } = useQuery({
    queryKey: ["tony-responses-roadmap"],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: "Tony" }),
  });

  const { data: drewResponses = [] } = useQuery({
    queryKey: ["drew-responses-roadmap"],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: "Drew" }),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-roadmap"],
    queryFn: () => api.entities.UserProfile.list(),
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ["checkins-roadmap"],
    queryFn: () => api.entities.CheckIn.list("-created_date", 30),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions-roadmap"],
    queryFn: () => api.entities.CoachSession.list("-created_date", 20),
  });

  const { data: triggers = [] } = useQuery({
    queryKey: ["triggers-roadmap"],
    queryFn: () => api.entities.TriggerEntry.list(),
  });

  // Compute patterns and roadmap
  const tonyProfile = profiles.find((p) => p.person_name === "Tony");
  const drewProfile = profiles.find((p) => p.person_name === "Drew");

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

  if (!roadmap) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Data Required</h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-4">
            Complete both questionnaires to generate your personalized 6-month relationship roadmap.
          </p>
          <Button>Complete Questionnaire</Button>
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
              A 6-month plan tailored to your relationship patterns and goals
            </p>
          </div>
          <AskAIButton context={askAIContext} modalTitle="Ask About Your Roadmap" />
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-2 bg-blue-50 border-blue-300">
          <CardContent className="p-5">
            <p className="text-sm text-blue-900 font-semibold uppercase tracking-wider">Primary Focus</p>
            <p className="text-lg text-blue-950 font-bold mt-1 capitalize">
              {roadmap.primaryFocus.replace(/_/g, " ")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 bg-green-50 border-green-300">
          <CardContent className="p-5">
            <p className="text-sm text-green-900 font-semibold uppercase tracking-wider">Key Strength</p>
            <p className="text-lg text-green-950 font-bold mt-1 capitalize">
              {roadmap.competentAreas[0]?.replace(/_/g, " ") || "Connection"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 bg-amber-50 border-amber-300">
          <CardContent className="p-5">
            <p className="text-sm text-amber-900 font-semibold uppercase tracking-wider">Duration</p>
            <p className="text-lg text-amber-950 font-bold mt-1">
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
            />
          ))}
        </div>
      </div>

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
            <Button className="border-2 border-primary text-base gap-2">
              <Sparkles className="w-4 h-4" />
              Start Month 1 Today
            </Button>
            <Button variant="outline" className="border-2 text-base">
              Download as PDF
            </Button>
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
  );
}