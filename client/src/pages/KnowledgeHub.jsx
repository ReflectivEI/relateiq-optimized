/**
 * KnowledgeHub.jsx — Connection Insights + Curated Psychology Resources
 * Relationship-type aware guidance across partners, friends, family, and other
 */
import React, { useState } from "react";
import { api } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BookOpen, Link as LinkIcon, TrendingUp, AlertCircle, Heart, Library, ShieldAlert, Target } from "lucide-react";
import { motion } from "framer-motion";
import AIInsightsSection from "@/components/knowledge/AIInsightsSection";
import { computePatternProfile } from "@/lib/patternEngine";
import { getRiskSummary } from "@/lib/earlyWarningEngine";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import { getRelationshipTerms } from "@/lib/relationshipParticipants";

const RESOURCES = {
  core: [
    {
      title: "The Gottman Institute",
      description: "Research-backed communication, conflict resolution, and repair tactics for real human connections.",
      url: "https://www.gottman.com",
      category: "Core Relationship Science",
      relevantFrameworks: ["GOTTMAN"],
    },
    {
      title: "Psychology Today — Relationships",
      description: "Free articles on communication, attachment, boundaries, and connection dynamics across many relationship types.",
      url: "https://www.psychologytoday.com/us/topics/relationships",
      category: "Core Relationship Science",
      relevantFrameworks: ["CBT", "EFT"],
    },
    {
      title: "Greater Good Science Center — Relationships",
      description: "UC Berkeley research on wellbeing, connection, empathy, and relational science.",
      url: "https://greatergood.berkeley.edu/relationships",
      category: "Core Relationship Science",
      relevantFrameworks: ["EFT"],
    },
  ],
  romanticSpecific: [
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
      description: "Specialized therapy, workshops, and guidance for male couples and same-sex relationships.",
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
  connectionSupport: [
    {
      title: "The Trevor Project",
      description: "Crisis support and LGBTQ+ wellbeing resources for individuals, friends, and families",
      url: "https://www.thetrevorproject.org",
      category: "Connection Support",
      relevantFrameworks: ["LGBTQ_RELATIONAL"],
    },
    {
      title: "The Trevor Project — Resources",
      description: "Practical LGBTQ+ mental health, identity, and support resources",
      url: "https://www.thetrevorproject.org/resources/",
      category: "Connection Support",
      relevantFrameworks: ["LGBTQ_RELATIONAL"],
    },
    {
      title: "Human Rights Campaign",
      description: "Resources for LGBTQ+ equality, family support, workplace rights, and community wellbeing",
      url: "https://www.hrc.org",
      category: "Connection Support",
      relevantFrameworks: ["LGBTQ_RELATIONAL"],
    },
    {
      title: "LGBTQ+ Mental Health Resources (APA)",
      description: "American Psychological Association LGBTQ+ mental health guidance and support resources",
      url: "https://www.apa.org/pi/lgbtq",
      category: "Connection Support",
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
  relationshipSpecific: {
    friendship: [
      {
        title: "APA Monitor: The Science of Friendship",
        description: "Evidence review on why friendship quality predicts health, wellbeing, and resilience.",
        url: "https://www.apa.org/monitor/2023/06/cover-story-science-of-friendship",
        category: "Friendship Science",
      },
      {
        title: "Mayo Clinic: Friendships",
        description: "Clinical guidance on maintaining healthy friendships and preventing social isolation.",
        url: "https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/friendships/art-20044860",
        category: "Friendship Science",
      },
    ],
    family: [
      {
        title: "APA: Families",
        description: "Psychology guidance on family dynamics, stress, and supportive communication patterns.",
        url: "https://www.apa.org/topics/families",
        category: "Family Systems",
      },
      {
        title: "AAMFT",
        description: "Family systems and relationship therapy organization with family-focused education resources.",
        url: "https://www.aamft.org",
        category: "Family Systems",
      },
    ],
    colleague: [
      {
        title: "CDC NIOSH: Stress at Work",
        description: "Occupational health guidance on stress, communication, and psychosocial workplace risk.",
        url: "https://www.cdc.gov/niosh/topics/stress",
        category: "Workplace Collaboration",
      },
      {
        title: "APA: Healthy Workplaces",
        description: "Evidence-informed workplace wellbeing practices that support communication and trust.",
        url: "https://www.apa.org/topics/healthy-workplaces",
        category: "Workplace Collaboration",
      },
    ],
    other: [
      {
        title: "CDC: Social Connectedness",
        description: "Public health evidence on connectedness as a protective factor for wellbeing and resilience.",
        url: "https://www.cdc.gov/violenceprevention/about/social-connectedness.html",
        category: "Connection Science",
      },
      {
        title: "APA: Relationships",
        description: "Foundational relationship psychology guidance applicable across connection types.",
        url: "https://www.apa.org/topics/relationships",
        category: "Connection Science",
      },
    ],
    romantic: [],
    committed_relationship: [],
    marriage: [],
  },
};

function buildResourceSections(terms) {
  const supportTitle =
    terms.type === "romantic"
      ? "LGBTQ+ Relationships & Male Couples"
      : `${terms.typeLabel} + Connection Support`;

  const supportResources =
    terms.type === "romantic" ? RESOURCES.romanticSpecific : RESOURCES.connectionSupport;

  const evidenceBase = (terms.sourceReferences || []).map((source) => ({
    title: source.title,
    description: `Credible source used to tailor guidance for this ${terms.bond}.`,
    url: source.url,
    category: `${terms.typeLabel} Evidence Base`,
    relevantFrameworks: ["EVIDENCE"],
  }));

  const typeSpecific =
    RESOURCES.relationshipSpecific[terms.type] || RESOURCES.relationshipSpecific.other;

  const coreResources = RESOURCES.core.map((resource) => ({
    ...resource,
    category: terms.type === "romantic" ? resource.category : `Core ${terms.typeLabel} Science`,
  }));

  return [
    {
      title: `${terms.typeLabel} Evidence Base`,
      icon: Target,
      resources: evidenceBase,
    },
    {
      title: terms.type === "romantic" ? "Core Relationship Science" : `Core ${terms.typeLabel} Science`,
      icon: Library,
      resources: coreResources,
    },
    {
      title: `${terms.typeLabel} Specific Guidance`,
      icon: Heart,
      resources: typeSpecific,
    },
    {
      title: supportTitle,
      icon: Heart,
      resources: supportResources,
    },
    {
      title: "Communication + Conflict",
      icon: BookOpen,
      resources: RESOURCES.communication,
    },
  ];
}
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
  const { activeRelationshipId, activeRelationship, participants, relationshipLabel } = useRelationshipAuth();
  const terms = getRelationshipTerms(activeRelationship);

  const { data: checkIns = [] } = useQuery({
    queryKey: ["checkins-knowledge", activeRelationshipId],
    queryFn: () => api.entities.CheckIn.list("-created_date", 14),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions-knowledge", activeRelationshipId],
    queryFn: () => api.entities.CoachSession.list("-created_date", 20),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-knowledge", activeRelationshipId],
    queryFn: () => api.entities.UserProfile.list(),
  });

  const { data: tonyResponses = [] } = useQuery({
    queryKey: ["person-a-responses-knowledge", activeRelationshipId, participants[0]],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: participants[0] }),
  });

  const { data: drewResponses = [] } = useQuery({
    queryKey: ["person-b-responses-knowledge", activeRelationshipId, participants[1]],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: participants[1] }),
  });

  const resourceSections = buildResourceSections(terms);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
        <h1 className="font-display text-5xl font-bold tracking-tight text-foreground">
          {terms.type === "romantic" ? "Relationship Knowledge Hub" : `${terms.typeLabel} Knowledge Hub`}
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          AI-generated insights + credible psychology resources for {relationshipLabel}, tailored to how this {terms.bond} communicates, connects, and grows.
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start bg-[#eef4fb]">
          <TabsTrigger value="insights" className="gap-2 text-base px-4 py-2">
            <Library className="w-5 h-5" />
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
          <AIInsightsSection relationshipTerms={terms} relationshipLabel={relationshipLabel} />
        </TabsContent>

        {/* RESOURCES TAB */}
        <TabsContent value="resources" className="space-y-8 mt-4">
          {resourceSections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h2 className="font-display text-2xl font-semibold flex items-center gap-3">
                <section.icon className="h-6 w-6 text-primary" />
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
            <Card className="border-2 border-[#0e6f72]/25 bg-white shadow-sm">
              <CardContent className="p-5 space-y-2">
                <p className="text-sm font-bold text-[#0e6f72] uppercase tracking-wider flex items-center gap-2"><TrendingUp className="h-4 w-4" /> What Improved This Week</p>
                <p className="text-base text-[#14263f]">You used AI guidance and reflection tools to navigate recent conversations inside this {terms.bond}.</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#14263f]/25 bg-[#eef4fb] shadow-sm">
              <CardContent className="p-5 space-y-2">
                <p className="text-sm font-bold text-[#14263f] uppercase tracking-wider flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Pattern to Be Aware Of</p>
                <p className="text-base text-[#14263f]">Notice the moments when either person starts pulling back, going quiet, or losing clarity inside this {terms.bond}.</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#0e6f72]/25 bg-white shadow-sm">
              <CardContent className="p-5 space-y-2">
                <p className="text-sm font-bold text-[#0e6f72] uppercase tracking-wider flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Challenges This Week</p>
                <p className="text-base text-[#14263f]">Look for recent stress, misattunement, or crossed expectations that may be shaping the tone of this {terms.bond}.</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#14263f]/25 bg-[#eef4fb] shadow-sm">
              <CardContent className="p-5 space-y-2">
                <p className="text-sm font-bold text-[#14263f] uppercase tracking-wider flex items-center gap-2"><Target className="h-4 w-4" /> Focus for Next Week</p>
                <p className="text-base text-[#14263f]">
                  {terms.type === "friendship"
                    ? "Practice proactive check-ins before tension builds so this friendship stays easy to repair and emotionally clear."
                    : terms.type === "family"
                      ? "Practice proactive check-ins before tension builds so this family connection stays steadier and easier to repair."
                      : terms.type === "other"
                        ? "Practice proactive check-ins before tension builds so this connection stays clear, steady, and easier to repair."
                        : "Practice proactive check-ins before tension builds so this relationship stays steady and easier to repair."}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
