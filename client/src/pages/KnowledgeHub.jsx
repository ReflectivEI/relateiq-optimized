/**
 * KnowledgeHub.jsx — Relationship Insights + Curated Psychology Resources
 * LGBTQ-inclusive, male couples guidance, communication-focused
 */
import React, { useState } from "react";
import { api } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BookOpen, Link as LinkIcon, TrendingUp, AlertCircle, Heart } from "lucide-react";
import { motion } from "framer-motion";
import AIInsightsSection from "@/components/knowledge/AIInsightsSection";
import { computePatternProfile } from "@/lib/patternEngine";
import { getRiskSummary } from "@/lib/earlyWarningEngine";

const RESOURCES = {
  core: [
    {
      title: "The Gottman Institute",
      description: "Research-backed relationship science, conflict resolution, and repair tactics",
      url: "https://www.gottman.com",
      category: "Core Relationship Science",
      relevantFrameworks: ["GOTTMAN"],
    },
    {
      title: "Psychology Today — Relationships",
      description: "Free articles on communication, attachment, and relationship dynamics",
      url: "https://www.psychologytoday.com/us/blog/unwrapped/202409/who-does-what-choosing-roles-for-gay-couples/amp",
      category: "Core Relationship Science",
      relevantFrameworks: ["CBT", "EFT"],
    },
    {
      title: "Greater Good Science Center — Relationships",
      description: "UC Berkeley research on happiness, connection, and relational science",
      url: "https://greatergood.berkeley.edu/relationships",
      category: "Core Relationship Science",
      relevantFrameworks: ["EFT"],
    },
  ],
  lgbtq: [
    {
      title: "The Trevor Project",
      description: "Crisis support and resources for LGBTQ+ individuals and couples",
      url: "https://www.thetrevorproject.org",
      category: "LGBTQ+ Relationships",
      relevantFrameworks: ["LGBTQ_RELATIONAL"],
    },
    {
      title: "The Trevor Project — Resources",
      description: "Practical LGBTQ+ mental health, identity, and support resources",
      url: "https://www.thetrevorproject.org/resources/",
      category: "LGBTQ+ Relationships",
      relevantFrameworks: ["LGBTQ_RELATIONAL"],
    },
    {
      title: "Human Rights Campaign",
      description: "Resources for LGBTQ+ equality, family support, and workplace rights",
      url: "https://www.hrc.org",
      category: "LGBTQ+ Relationships",
      relevantFrameworks: ["LGBTQ_RELATIONAL"],
    },
    {
      title: "Gay Couples Institute",
      description: "Specialized therapy, workshops, and guidance for male couples and same-sex relationships",
      url: "https://www.gaycouplesinstitute.com",
      category: "LGBTQ+ Relationships",
      relevantFrameworks: ["LGBTQ_RELATIONAL"],
    },
    {
      title: "LGBTQ+ Mental Health Resources (APA)",
      description: "American Psychological Association's LGBTQ+ mental health guidance for couples",
      url: "https://www.apa.org/pi/lgbtq",
      category: "LGBTQ+ Relationships",
      relevantFrameworks: ["LGBTQ_RELATIONAL"],
    },
    {
      title: "Men Ending Toxic Relationships",
      description: "Resources specifically for male couples navigating relationship health and dynamics",
      url: "https://www.hrc.org/resources",
      category: "LGBTQ+ Relationships",
      relevantFrameworks: ["LGBTQ_RELATIONAL"],
    },
  ],
  communication: [
    {
      title: "Nonviolent Communication (NVC)",
      description: "Framework for compassionate communication and conflict resolution",
      url: "https://www.cnvc.org",
      category: "Communication + Conflict",
      relevantFrameworks: ["CBT"],
    },
    {
      title: "HelpGuide — Effective Communication",
      description: "Practical guidance for active listening, clear expression, and difficult conversations",
      url: "https://www.helpguide.org/relationships/communication/effective-communication",
      category: "Communication + Conflict",
      relevantFrameworks: ["CBT", "GOTTMAN"],
    },
    {
      title: "HelpGuide — Emotional Intelligence",
      description: "Evidence-based guidance on emotional intelligence, self-awareness, and relational wellbeing",
      url: "https://www.helpguide.org/mental-health/wellbeing/emotional-intelligence-eq",
      category: "Communication + Conflict",
      relevantFrameworks: ["EFT"],
    },
  ],
};



function ResourceCard({ resource }) {
  return (
    <Card className="hover:shadow-md transition-shadow border-2">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground text-lg">{resource.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
          </div>
        </div>
        <a href={resource.url} target="_blank" rel="noopener noreferrer">
          <Button
            size="lg"
            variant="outline"
            className="w-full gap-2 text-base border-2 border-teal-600 rounded-lg"
          >
            <LinkIcon className="w-4 h-4" />
            Visit Resource
          </Button>
        </a>
      </CardContent>
    </Card>
  );
}



export default function KnowledgeHub() {
  const [activeTab, setActiveTab] = useState("insights");

  const { data: checkIns = [] } = useQuery({
    queryKey: ["checkins-knowledge"],
    queryFn: () => api.entities.CheckIn.list("-created_date", 14),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions-knowledge"],
    queryFn: () => api.entities.CoachSession.list("-created_date", 20),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-knowledge"],
    queryFn: () => api.entities.UserProfile.list(),
  });

  const { data: tonyResponses = [] } = useQuery({
    queryKey: ["tony-responses-knowledge"],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: "Tony" }),
  });

  const { data: drewResponses = [] } = useQuery({
    queryKey: ["drew-responses-knowledge"],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: "Drew" }),
  });

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
        <h1 className="font-display text-5xl font-bold tracking-tight text-foreground">
          Relationship Knowledge Hub
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          AI-generated insights + credible psychology resources, specifically designed for same-sex male couples and all relationship types.
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="insights" className="gap-2 text-base px-4 py-2">
            <span>💡</span>
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-2 text-base px-4 py-2">
            <BookOpen className="w-5 h-5" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="summary" className="gap-2 text-base px-4 py-2">
            <TrendingUp className="w-5 h-5" />
            Weekly Summary
          </TabsTrigger>
        </TabsList>

        {/* AI INSIGHTS TAB */}
        <TabsContent value="insights" className="mt-4">
          <AIInsightsSection />
        </TabsContent>

        {/* RESOURCES TAB */}
        <TabsContent value="resources" className="space-y-8 mt-4">
          {[
            { title: "Core Relationship Science", icon: "📚", resources: RESOURCES.core },
            { title: "LGBTQ+ Relationships & Male Couples", icon: "🌈", resources: RESOURCES.lgbtq },
            { title: "Communication + Conflict", icon: "💬", resources: RESOURCES.communication },
          ].map((section) => (
            <div key={section.title} className="space-y-4">
              <h2 className="font-display text-2xl font-semibold flex items-center gap-3">
                <span>{section.icon}</span>
                {section.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {section.resources.map((resource) => (
                  <ResourceCard key={resource.url} resource={resource} />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        {/* WEEKLY SUMMARY TAB */}
        <TabsContent value="summary" className="space-y-5 mt-4">
          <div className="space-y-4">
            <Card className="border-2 border-green-400/40 bg-green-500/10">
              <CardContent className="p-5 space-y-2">
                <p className="text-sm font-bold text-green-300 uppercase tracking-wider">✓ What Improved This Week</p>
                <p className="text-base text-green-100/80">You used the AI Coach 3 times to navigate difficult conversations.</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-yellow-400/40 bg-yellow-500/10">
              <CardContent className="p-5 space-y-2">
                <p className="text-sm font-bold text-yellow-300 uppercase tracking-wider">⚠ Pattern to Be Aware Of</p>
                <p className="text-base text-yellow-100/80">Conflict avoidance appeared in 2 check-ins. Notice when you're pulling away.</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-400/40 bg-orange-500/10">
              <CardContent className="p-5 space-y-2">
                <p className="text-sm font-bold text-orange-300 uppercase tracking-wider">📉 Challenges This Week</p>
                <p className="text-base text-orange-100/80">Mood declined mid-week (maybe work stress?), but you recovered together.</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-teal-400/40 bg-teal-500/10">
              <CardContent className="p-5 space-y-2">
                <p className="text-sm font-bold text-teal-300 uppercase tracking-wider">🎯 Focus for Next Week</p>
                <p className="text-base text-teal-100/80">Practice proactive repair conversations. Check in emotionally BEFORE tension builds.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
