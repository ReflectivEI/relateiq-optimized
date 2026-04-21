/**
 * HealthReport.jsx — Weekly Relationship Health Report dashboard
 * Synthesizes check-ins, reflections, and coach sessions into a rich summary.
 */
import React, { useMemo, useState } from "react";
import { api } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ActivitySquare, ShieldCheck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import HealthReportMetrics from "@/components/health-report/HealthReportMetrics";
import SentimentTrendChart from "@/components/health-report/SentimentTrendChart";
import ThemeCloud from "@/components/health-report/ThemeCloud";
import AIHealthReport from "@/components/health-report/AIHealthReport";
import CommunicationPatterns from "@/components/health-report/CommunicationPatterns";

export default function HealthReport() {
  const [viewMode, setViewMode] = useState("compare");

  const { data: checkIns = [] } = useQuery({
    queryKey: ["health-checkins"],
    queryFn: () => api.entities.CheckIn.list("-created_date", 30),
  });

  const { data: reflections = [] } = useQuery({
    queryKey: ["health-reflections"],
    queryFn: () => api.entities.DailyReflection.list("-created_date", 50),
  });

  const { data: coachSessions = [] } = useQuery({
    queryKey: ["health-sessions"],
    queryFn: () => api.entities.CoachSession.list("-created_date", 30),
  });

  const visibleData = useMemo(() => {
    if (viewMode === "compare") {
      return { checkIns, reflections, coachSessions };
    }

    return {
      checkIns: checkIns.filter((entry) => entry.person_name === viewMode),
      reflections: reflections.filter((entry) => entry.person_name === viewMode),
      coachSessions: coachSessions.filter(
        (entry) => entry.speaker === viewMode || entry.speaking_to === viewMode,
      ),
    };
  }, [checkIns, reflections, coachSessions, viewMode]);

  return (
    <div className="space-y-8">
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="enterprise-hero overflow-hidden">
        <div className="grid gap-6 px-6 py-6 md:px-8 md:py-7 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.85fr)]">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/80">
              <ActivitySquare className="h-4 w-4" />
              Weekly Summary
            </div>
            <h1 className="font-display text-4xl font-bold text-white md:text-5xl">Relationship Health Report</h1>
            <p className="max-w-3xl text-base leading-7 text-slate-200">
              A cleaner, enterprise-grade snapshot of your relationship health. This page is meant to surface
              traction, friction, and recurring patterns in a way that is easier to read and easier to use.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                { value: "compare", label: "Compare Side by Side" },
                { value: "Tony", label: "Tony" },
                { value: "Drew", label: "Drew" },
              ].map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={viewMode === option.value ? "default" : "outline"}
                  size="sm"
                  className={viewMode === option.value ? "border-white/0" : "border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"}
                  onClick={() => setViewMode(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.15rem] border border-white/15 bg-white/10 p-4 text-slate-100">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-teal-200" />
                What This Report Answers
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                What is stable, what is drifting, and where attention is needed next.
              </p>
            </div>
            <div className="rounded-[1.15rem] border border-white/15 bg-white/10 p-4 text-slate-100">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <TrendingUp className="h-4 w-4 text-teal-200" />
                Best Use
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                Review this weekly together, then choose one concrete focus for the next seven days.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Metrics */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <HealthReportMetrics
          checkIns={visibleData.checkIns}
          reflections={visibleData.reflections}
          coachSessions={visibleData.coachSessions}
        />
      </motion.div>

      {/* Sentiment chart + Theme cloud side by side on large screens */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <SentimentTrendChart checkIns={visibleData.checkIns} />
        <ThemeCloud
          checkIns={visibleData.checkIns}
          reflections={visibleData.reflections}
          coachSessions={visibleData.coachSessions}
        />
      </motion.div>

      {/* Communication Patterns */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <CommunicationPatterns checkIns={visibleData.checkIns} coachSessions={visibleData.coachSessions} />
      </motion.div>

      {/* AI Narrative Report */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <AIHealthReport
          checkIns={visibleData.checkIns}
          reflections={visibleData.reflections}
          coachSessions={visibleData.coachSessions}
          viewMode={viewMode}
        />
      </motion.div>

      <p className="text-center text-xs text-muted-foreground/60 border-t border-border pt-6">
        This report is generated from your private data and is only visible to you. It is not a substitute for professional relationship support.
      </p>
    </div>
  );
}
