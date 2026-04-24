import React, { useMemo, useState } from "react";
import { api } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  BookOpenText,
  MessageSquareText,
  ShieldCheck,
  Siren,
  Handshake,
  ListChecks,
  Copy,
  RotateCcw,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import { getRelationshipTerms } from "@/lib/relationshipParticipants";

function bulletize(value, fallback) {
  if (Array.isArray(value) && value.length > 0) return value;
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return fallback;
}

function PersonCard({ name, profile, colorClass }) {
  const communication = bulletize(profile?.communication_style, [
    `${name}’s communication style will populate here after the profile is generated.`,
  ]);
  const needs = bulletize(profile?.needs_during_conflict, [
    `${name}’s core needs in conflict will appear here once the profile is available.`,
  ]);
  const triggers = bulletize(profile?.emotional_triggers, [
    `No trigger entries recorded yet for ${name}.`,
  ]);
  const growth = bulletize(profile?.growth_areas, [
    `Growth areas for ${name} will appear here after more analysis runs.`,
  ]);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {[
        { title: "How to Approach Them", icon: MessageSquareText, items: communication },
        { title: "What They Need During Tension", icon: ShieldCheck, items: needs },
        { title: "What Activates Them", icon: Siren, items: triggers },
        { title: "What Helps Them Improve", icon: ListChecks, items: growth },
      ].map((section) => (
        <Card key={section.title} className="enterprise-panel border-2 h-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <section.icon className={`h-4 w-4 ${colorClass}`} />
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {section.items.map((item) => (
              <div key={item} className="enterprise-panel-muted rounded-2xl p-4 text-sm leading-6 text-foreground">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function RelationshipPlaybook() {
  const { activeRelationship, participants, relationshipLabel } = useRelationshipAuth();
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-playbook"],
    queryFn: () => api.entities.UserProfile.list(),
  });

  const primaryProfile = profiles.find((profile) => profile.person_name === participants[0]);
  const secondaryProfile = profiles.find((profile) => profile.person_name === participants[1]);
  const terms = getRelationshipTerms(activeRelationship);
  const playbookTitle =
    terms.type === "romantic"
      ? "Relationship Playbook"
      : terms.type === "friendship"
        ? "Friendship Playbook"
        : terms.type === "family"
          ? "Family Playbook"
          : "Connection Playbook";
  const templateDefaults = useMemo(() => ({
    conversationType: "repair",
    desiredTone: "steady",
    before:
      "I want to have this conversation in a way that actually works for both of us.",
    during:
      "What are you hearing me say right now? What do you need most from me in this moment?",
    after:
      "What should we repeat next time, and what should we do differently?",
  }), []);
  const [templateState, setTemplateState] = useState(templateDefaults);

  const sharedTemplate = [
    {
      title: "When One Person Is Upset",
      prompt:
        "Start with: “I want to understand what’s happening for you before I respond. Do you want comfort, clarity, or a little space first?”",
    },
    {
      title: "When A Conversation Starts To Go Sideways",
      prompt:
        "Pause early. Name the shift. Use: “I think we’re starting to miss each other. Let’s slow down and make sure we’re talking about the same thing.”",
    },
    {
      title: "When Repair Is Needed",
      prompt:
        "Use a three-part repair: 1) name what landed badly, 2) validate the other person’s experience, 3) state the next behavior you want to change.",
    },
    {
      title: "Weekly Playbook Review",
      prompt:
        "Ask three questions together: What worked this week? Where did we get stuck? What one adjustment are we carrying into next week?",
    },
  ];

  const handleTemplatePreset = (field, value) => {
    setTemplateState((current) => {
      const next = { ...current, [field]: value };

      if (field === "conversationType") {
        if (value === "repair") {
          next.before = "I want to repair this in a way that helps us both feel steadier and more connected.";
          next.during = "What felt hardest for you in that moment, and what do you need from me first right now?";
          next.after = "What would help this feel more repaired tonight, and what do we want to do differently next time?";
        } else if (value === "checkin") {
          next.before = "I want to check in before anything builds up. Can we talk for a few minutes with no fixing yet?";
          next.during = "What has felt good lately, and where have we felt a little off with each other?";
          next.after = "What is one thing we want to carry into this week on purpose?";
        } else if (value === "planning") {
          next.before = "I want us to get aligned before we start reacting or assuming.";
          next.during = "What matters most to each of us here, and where do we need more clarity?";
          next.after = "What did we decide, and how will we know this plan is working for both of us?";
        }
      }

      if (field === "desiredTone") {
        if (value === "gentle") {
          next.before = next.before.replace(/^I want/i, "I'd like");
        } else if (value === "direct") {
          next.during = "Let's name the main issue clearly. What are you hearing me say, and what do you need from me right now?";
        }
      }

      return next;
    });
  };

  const handleTemplateCopy = async () => {
    const compiled = [
      "Conversation Template",
      `Type: ${templateState.conversationType}`,
      `Tone: ${templateState.desiredTone}`,
      "",
      "Before the conversation",
      templateState.before,
      "",
      "During the conversation",
      templateState.during,
      "",
      "At the end",
      templateState.after,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(compiled);
      toast.success("Template copied");
    } catch {
      toast.error("Unable to copy template");
    }
  };

  const resetTemplate = () => setTemplateState(templateDefaults);

  return (
    <div className="space-y-8">
      <section className="enterprise-hero overflow-hidden">
        <div className="px-6 py-6 md:px-8 md:py-7">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/70">Context: Us</p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.8fr)]">
            <div className="space-y-3">
              <h1 className="font-display text-4xl font-bold text-white md:text-5xl">{playbookTitle}</h1>
              <p className="max-w-3xl text-base leading-6 text-slate-200">
                This page is your working operating manual. It explains how the people in {relationshipLabel} tend to communicate,
                what helps when pressure rises, and gives you practical scripts and routines you can actually use.
              </p>
            </div>
            <div className="rounded-[1.25rem] border border-white/15 bg-white/10 p-5 text-slate-100">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/70">How to Use It</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
                <li>Use the person tabs before hard conversations.</li>
                <li>Use the shared templates after conflict or during weekly reviews.</li>
                <li>Treat this page as a living guide, not a static report.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <Card className="enterprise-panel border-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <BookOpenText className="h-5 w-5 text-primary" />
              Working Playbook
            </CardTitle>
              <p className="text-sm text-muted-foreground">
                A clearer structure for how this page should work: individual guidance on one side, usable shared
                templates for this {terms.bond} on the other.
              </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={participants[0].toLowerCase()} className="space-y-5">
              <TabsList className="w-full justify-start">
                <TabsTrigger value={participants[0].toLowerCase()}>{participants[0]}</TabsTrigger>
                <TabsTrigger value={participants[1].toLowerCase()}>{participants[1]}</TabsTrigger>
                <TabsTrigger value="together">Together</TabsTrigger>
              </TabsList>

              <TabsContent value={participants[0].toLowerCase()}>
                <PersonCard name={participants[0]} profile={primaryProfile} colorClass="text-primary" />
              </TabsContent>

              <TabsContent value={participants[1].toLowerCase()}>
                <PersonCard name={participants[1]} profile={secondaryProfile} colorClass="text-primary" />
              </TabsContent>

              <TabsContent value="together">
                <div className="grid gap-4 lg:grid-cols-2">
                  {sharedTemplate.map((item) => (
                    <Card key={item.title} className="enterprise-panel border-2 h-full">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Handshake className="h-4 w-4 text-primary" />
                          {item.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="enterprise-panel-muted rounded-2xl p-4 text-[15px] leading-6 text-foreground">
                          {item.prompt}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="enterprise-panel border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Conversation Template Builder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-[15px] leading-6 text-foreground">
              <p className="text-sm text-muted-foreground">
                This is an editable working template. Choose the conversation type, adjust the tone, then tailor the
                draft language before using it in real life.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="enterprise-section-label">Conversation Type</span>
                  <select
                    value={templateState.conversationType}
                    onChange={(event) => handleTemplatePreset("conversationType", event.target.value)}
                    className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
                  >
                    <option value="repair">Repair after tension</option>
                    <option value="checkin">Weekly check-in</option>
                    <option value="planning">Planning / alignment</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="enterprise-section-label">Desired Tone</span>
                  <select
                    value={templateState.desiredTone}
                    onChange={(event) => handleTemplatePreset("desiredTone", event.target.value)}
                    className="h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
                  >
                    <option value="steady">Steady</option>
                    <option value="gentle">Gentle</option>
                    <option value="direct">Direct</option>
                  </select>
                </label>
              </div>
              <div className="enterprise-panel-muted rounded-2xl p-4">
                <p className="enterprise-section-label">Before A Hard Conversation</p>
                <Textarea
                  value={templateState.before}
                  onChange={(event) => setTemplateState((current) => ({ ...current, before: event.target.value }))}
                  className="mt-2 min-h-[90px] rounded-2xl border border-border bg-background"
                />
              </div>
              <div className="enterprise-panel-muted rounded-2xl p-4">
                <p className="enterprise-section-label">During The Conversation</p>
                <Textarea
                  value={templateState.during}
                  onChange={(event) => setTemplateState((current) => ({ ...current, during: event.target.value }))}
                  className="mt-2 min-h-[110px] rounded-2xl border border-border bg-background"
                />
              </div>
              <div className="enterprise-panel-muted rounded-2xl p-4">
                <p className="enterprise-section-label">At The End</p>
                <Textarea
                  value={templateState.after}
                  onChange={(event) => setTemplateState((current) => ({ ...current, after: event.target.value }))}
                  className="mt-2 min-h-[90px] rounded-2xl border border-border bg-background"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="button" className="gap-2" onClick={handleTemplateCopy}>
                  <Copy className="h-4 w-4" />
                  Copy Template
                </Button>
                <Button type="button" variant="outline" className="gap-2" onClick={resetTemplate}>
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="enterprise-panel border-2 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">What This Page Will Eventually Hold</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-7">
              <p>Profile-informed talking points for the people in {relationshipLabel}.</p>
              <p>Repair scripts tied to your actual conflict patterns.</p>
              <p>Weekly rhythms and decision rules you can reuse.</p>
              <p>A living set of templates you can edit over time.</p>
              <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-foreground">
                <p className="enterprise-section-label flex items-center gap-2">
                  <WandSparkles className="h-4 w-4 text-primary" />
                  Why this is a real template now
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  The builder on the left is editable, reusable, and structured around a real conversation flow, so it
                  functions as an actual working template instead of static example text.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
