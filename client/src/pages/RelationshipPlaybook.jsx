import React from "react";
import { api } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpenText,
  MessageSquareText,
  ShieldCheck,
  Siren,
  Handshake,
  ListChecks,
} from "lucide-react";

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
    <div className="grid gap-4 lg:grid-cols-2">
      {[
        { title: "How to Approach Them", icon: MessageSquareText, items: communication },
        { title: "What They Need During Tension", icon: ShieldCheck, items: needs },
        { title: "What Activates Them", icon: Siren, items: triggers },
        { title: "What Helps Them Improve", icon: ListChecks, items: growth },
      ].map((section) => (
        <Card key={section.title} className="enterprise-panel border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <section.icon className={`h-4 w-4 ${colorClass}`} />
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {section.items.map((item) => (
              <div key={item} className="enterprise-panel-muted rounded-2xl p-4 text-sm leading-7 text-foreground">
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
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-playbook"],
    queryFn: () => api.entities.UserProfile.list(),
  });

  const tony = profiles.find((profile) => profile.person_name === "Tony");
  const drew = profiles.find((profile) => profile.person_name === "Drew");

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

  return (
    <div className="space-y-8">
      <section className="enterprise-hero overflow-hidden">
        <div className="px-6 py-6 md:px-8 md:py-7">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/70">Context: Us</p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.8fr)]">
            <div className="space-y-3">
              <h1 className="font-display text-4xl font-bold text-white md:text-5xl">Relationship Playbook</h1>
              <p className="max-w-3xl text-base leading-7 text-slate-200">
                This page is your working operating manual. It explains how Tony and Drew tend to communicate,
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

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <Card className="enterprise-panel border-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <BookOpenText className="h-5 w-5 text-primary" />
              Working Playbook
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              A clearer structure for how this page should work: individual guidance on one side, usable shared
              templates on the other.
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="tony" className="space-y-5">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="tony">Tony</TabsTrigger>
                <TabsTrigger value="drew">Drew</TabsTrigger>
                <TabsTrigger value="together">Together</TabsTrigger>
              </TabsList>

              <TabsContent value="tony">
                <PersonCard name="Tony" profile={tony} colorClass="text-primary" />
              </TabsContent>

              <TabsContent value="drew">
                <PersonCard name="Drew" profile={drew} colorClass="text-primary" />
              </TabsContent>

              <TabsContent value="together">
                <div className="grid gap-4 md:grid-cols-2">
                  {sharedTemplate.map((item) => (
                    <Card key={item.title} className="enterprise-panel border-2">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Handshake className="h-4 w-4 text-primary" />
                          {item.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="enterprise-panel-muted rounded-2xl p-4 text-sm leading-7 text-foreground">
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

        <div className="space-y-6">
          <Card className="enterprise-panel border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Starter Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-foreground">
              <div className="enterprise-panel-muted rounded-2xl p-4">
                <p className="enterprise-section-label">Before A Hard Conversation</p>
                <p className="mt-2">“I want to have this conversation in a way that actually works for both of us.”</p>
              </div>
              <div className="enterprise-panel-muted rounded-2xl p-4">
                <p className="enterprise-section-label">During The Conversation</p>
                <p className="mt-2">“What are you hearing me say right now?” and “What do you need most from me in this moment?”</p>
              </div>
              <div className="enterprise-panel-muted rounded-2xl p-4">
                <p className="enterprise-section-label">At The End</p>
                <p className="mt-2">“What should we repeat next time, and what should we do differently?”</p>
              </div>
            </CardContent>
          </Card>

          <Card className="enterprise-panel border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">What This Page Will Eventually Hold</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-7">
              <p>Profile-informed talking points for Tony and Drew.</p>
              <p>Repair scripts tied to your actual conflict patterns.</p>
              <p>Weekly rhythms and decision rules you can reuse.</p>
              <p>A living set of templates you can edit over time.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
