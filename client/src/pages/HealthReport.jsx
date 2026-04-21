/**
 * HealthReport.jsx — Weekly Relationship Health Report dashboard
 * Synthesizes check-ins, reflections, and coach sessions into a rich summary.
 */
import React from "react";
import { api } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import HealthReportMetrics from "@/components/health-report/HealthReportMetrics";
import SentimentTrendChart from "@/components/health-report/SentimentTrendChart";
import ThemeCloud from "@/components/health-report/ThemeCloud";
import AIHealthReport from "@/components/health-report/AIHealthReport";
import CommunicationPatterns from "@/components/health-report/CommunicationPatterns";

export default function HealthReport() {
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

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold uppercase tracking-wide">
          <Activity className="w-4 h-4" />
          Weekly Summary
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">
          Relationship Health Report
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          A data-driven snapshot of your relationship's health — themes, sentiment trends, and communication patterns from your shared history.
        </p>
      </motion.div>

      {/* Metrics */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <HealthReportMetrics checkIns={checkIns} reflections={reflections} coachSessions={coachSessions} />
      </motion.div>

      {/* Sentiment chart + Theme cloud side by side on large screens */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <SentimentTrendChart checkIns={checkIns} />
        <ThemeCloud checkIns={checkIns} reflections={reflections} coachSessions={coachSessions} />
      </motion.div>

      {/* Communication Patterns */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <CommunicationPatterns checkIns={checkIns} coachSessions={coachSessions} />
      </motion.div>

      {/* AI Narrative Report */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <AIHealthReport checkIns={checkIns} reflections={reflections} coachSessions={coachSessions} />
      </motion.div>

      <p className="text-center text-xs text-muted-foreground/60 border-t border-border pt-6">
        This report is generated from your private data and is only visible to you. It is not a substitute for professional relationship support.
      </p>
    </div>
  );
}