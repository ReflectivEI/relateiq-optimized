/**
 * AIInsightsSection.jsx — Daily AI Insights with relationship guidance
 * Tailored for couples: communication, growth, LGBTQ-inclusive
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  RefreshCw,
  MessageCircle,
  AlertTriangle,
  Star,
  Heart,
  Users,
  Lightbulb,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import InsightCard from "./InsightCard";

const INSIGHT_TEMPLATES = {
  communication: {
    title: "Today's Communication Focus",
    icon: MessageCircle,
    color: "border-[#14263f]/25 bg-[#eef4fb]",
    examples: [
      "Ask your partner: 'What's one thing I did this week that made you feel valued?'",
      "Try: 'I noticed you seemed distant yesterday. I want to understand what you're feeling.'",
      "Share: 'Something I appreciate about you is... because it helps me feel...'",
    ],
  },
  challenge: {
    title: "Pattern to Watch For",
    icon: AlertTriangle,
    color: "border-[#0e6f72]/25 bg-white",
    examples: [
      "When conflict arises, check: Are we listening to understand, or listening to respond?",
      "Notice: Do we tend to shut down or escalate when stressed? What triggers that?",
      "Reflect: What unmet need might be driving this pattern between us?",
    ],
  },
  strength: {
    title: "Your Relationship Strength",
    icon: Star,
    color: "border-[#0e6f72]/25 bg-[#e8f7f6]",
    examples: [
      "You both show up emotionally even when conversations are hard.",
      "You have a history of repair — you know how to reconnect after tension.",
      "You value growth, which means you're open to learning about each other.",
    ],
  },
  affirmation: {
    title: "Daily Affirmation",
    icon: Heart,
    color: "border-[#14263f]/25 bg-white",
    examples: [
      "Our relationship is stronger because we choose understanding over blame.",
      "Love is a daily practice — every conversation is an opportunity to deepen connection.",
      "We are learning each other, and that's enough. Progress over perfection.",
    ],
  },
  lgbtqPlus: {
    title: "LGBTQ+ Wisdom for Today",
    icon: Users,
    color: "border-[#14263f]/25 bg-[#eef4fb]",
    examples: [
      "Male couples often navigate unique expectations — talk about yours instead of assuming.",
      "Vulnerability is not weakness; it's the foundation of intimacy in long-term relationships.",
      "Check in: Are we honoring both our individual identities AND our couple identity?",
    ],
  },
  question: {
    title: "Question to Ask Your Partner Today",
    icon: Lightbulb,
    color: "border-[#0e6f72]/25 bg-[#e8f7f6]",
    examples: [
      "'What's something you wish I understood better about you?'",
      "'When do you feel most seen and appreciated by me?'",
      "'What would make you feel more secure/connected right now?'",
    ],
  },
};

export default function AIInsightsSection({ onRefresh }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);

  // Generate insights on mount and when refresh is clicked
  useEffect(() => {
    generateInsights();
  }, []);

  const generateInsights = async () => {
    setLoading(true);
    // Simulate slight delay for visual feedback
    await new Promise((r) => setTimeout(r, 300));

    const templates = Object.entries(INSIGHT_TEMPLATES);
    const selected = templates.map(([key, template]) => ({
      key,
      title: template.title,
      icon: template.icon,
      color: template.color,
      content: template.examples[Math.floor(Math.random() * template.examples.length)],
      examples: template.examples,
    }));

    setInsights(selected);
    setLoading(false);
    onRefresh && onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">AI Daily Insights</h2>
          <p className="text-base text-muted-foreground mt-1">
            Personalized guidance powered by AI + relationship science
          </p>
        </div>
        <Button
          onClick={generateInsights}
          disabled={loading}
          variant="outline"
          size="lg"
          className="border-2 border-teal-600 gap-2"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          <span className="text-base">Refresh</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="wait">
          {insights.map((insight, i) => (
            <motion.div
              key={`${insight.key}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: i * 0.08 }}
            >
              <InsightCard insight={insight} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
