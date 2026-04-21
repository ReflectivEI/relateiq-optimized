/**
 * RelationshipPlaybook.jsx
 * Auto-generated operating manual for the relationship
 * Shows how each person communicates best, triggers, conflict approach, etc.
 */

import React from "react";
import { api } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Heart, AlertTriangle, CheckCircle2, MessageCircle, Shield, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function RelationshipPlaybook() {
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-playbook"],
    queryFn: () => api.entities.UserProfile.list(),
  });

  const { data: triggers = [] } = useQuery({
    queryKey: ["triggers-playbook"],
    queryFn: () => api.entities.TriggerEntry.list(),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions-playbook"],
    queryFn: () => api.entities.CoachSession.list("-created_date", 30),
  });

  const tony = profiles.find((p) => p.person_name === "Tony");
  const drew = profiles.find((p) => p.person_name === "Drew");
  const tonyTriggers = triggers.filter((t) => t.owner === "Tony");
  const drewTriggers = triggers.filter((t) => t.owner === "Drew");

  const preview = (value, length = 60, fallback = "No situation recorded yet") => {
    const text = typeof value === "string" ? value.trim() : "";
    if (!text) return fallback;
    return text.length > length ? `${text.slice(0, length)}...` : text;
  };

  const getProvenApproaches = (person) => {
    return sessions
      .filter((s) => (s.speaker === person || s.speaking_to === person) && s.tool_type === "coach")
      .slice(0, 3)
      .map((s) => ({
        situation: preview(s.situation, 50),
        context: `Session with ${s.speaking_to}`,
      }));
  };

  if (!tony || !drew) {
    return (
      <div className="text-center py-12 space-y-3">
        <h2 className="font-display text-2xl font-bold">Playbook Coming Soon</h2>
        <p className="text-muted-foreground">Complete both profiles to unlock your relationship operating manual.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center space-y-2 mb-8">
          <h1 className="font-display text-4xl font-bold tracking-tight">
            {tony.person_name} & {drew.person_name}'s Playbook
          </h1>
          <p className="text-muted-foreground text-lg">
            Your custom operating manual for navigating together
          </p>
        </div>
      </motion.div>

      <Tabs defaultValue="tony" className="space-y-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="tony">Tony's Profile</TabsTrigger>
          <TabsTrigger value="drew">Drew's Profile</TabsTrigger>
          <TabsTrigger value="together">Together</TabsTrigger>
        </TabsList>

        {/* TONY'S PROFILE */}
        <TabsContent value="tony" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* How Tony communicates */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  How Tony Communicates Best
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tony.communication_style && (
                  <p className="text-sm text-foreground">{tony.communication_style}</p>
                )}
                {tony.love_language && (
                  <div className="flex items-center gap-2 text-sm bg-primary/10 px-3 py-2 rounded-lg border border-primary/20">
                    <Heart className="w-4 h-4 text-primary" />
                    <span className="font-medium">Love Language:</span>
                    <span>{tony.love_language}</span>
                  </div>
                )}
                {tony.processing_style && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Processing style:</span> {tony.processing_style}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tony's Triggers */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  What Triggers Tony
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tonyTriggers.length > 0 ? (
                  tonyTriggers.slice(0, 3).map((t) => (
                    <div key={t.id} className="p-2 rounded-lg bg-orange-50 border border-orange-100">
                      <p className="font-medium text-sm text-foreground">{t.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                      <p className="text-xs text-orange-700 mt-1">
                        <strong>Reaction:</strong> {t.common_reaction || "Withdrawal"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No triggers logged yet</p>
                )}
              </CardContent>
            </Card>

            {/* How to approach Tony */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  What Helps Tony Show Up Best
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tony.needs_during_conflict && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-foreground mb-1">During Conflict:</p>
                    <p className="text-sm text-muted-foreground">{tony.needs_during_conflict}</p>
                  </div>
                )}
                {tony.growth_areas && tony.growth_areas.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Growth Areas:</p>
                    <div className="flex flex-wrap gap-2">
                      {tony.growth_areas.map((area) => (
                        <Badge key={area} variant="outline" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* DREW'S PROFILE */}
        <TabsContent value="drew" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* How Drew communicates */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-accent-foreground" />
                  How Drew Communicates Best
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {drew.communication_style && (
                  <p className="text-sm text-foreground">{drew.communication_style}</p>
                )}
                {drew.love_language && (
                  <div className="flex items-center gap-2 text-sm bg-accent/10 px-3 py-2 rounded-lg border border-accent/20">
                    <Heart className="w-4 h-4 text-accent-foreground" />
                    <span className="font-medium">Love Language:</span>
                    <span>{drew.love_language}</span>
                  </div>
                )}
                {drew.processing_style && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Processing style:</span> {drew.processing_style}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Drew's Triggers */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  What Triggers Drew
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {drewTriggers.length > 0 ? (
                  drewTriggers.slice(0, 3).map((t) => (
                    <div key={t.id} className="p-2 rounded-lg bg-orange-50 border border-orange-100">
                      <p className="font-medium text-sm text-foreground">{t.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                      <p className="text-xs text-orange-700 mt-1">
                        <strong>Reaction:</strong> {t.common_reaction || "Activation"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No triggers logged yet</p>
                )}
              </CardContent>
            </Card>

            {/* How to approach Drew */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  What Helps Drew Show Up Best
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {drew.needs_during_conflict && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-foreground mb-1">During Conflict:</p>
                    <p className="text-sm text-muted-foreground">{drew.needs_during_conflict}</p>
                  </div>
                )}
                {drew.growth_areas && drew.growth_areas.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Growth Areas:</p>
                    <div className="flex flex-wrap gap-2">
                      {drew.growth_areas.map((area) => (
                        <Badge key={area} variant="outline" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TOGETHER */}
        <TabsContent value="together" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Card className="border-2 border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" fill="currentColor" />
                  How You Approach Conflict
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">What tends to work:</p>
                    {sessions.slice(0, 2).map((s, i) => (
                      <p key={i} className="text-sm text-muted-foreground">
                        • {preview(s.situation)}
                      </p>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-border/40">
                    <p className="text-sm font-medium text-foreground mb-2">What to avoid:</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Dismissing each other's needs</li>
                      <li>• Withdrawing without communication</li>
                      <li>• Assuming intent without clarifying</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Proven Successful Approaches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    When Tony Takes the Lead:
                  </p>
                  {getProvenApproaches("Tony").map((item, i) => (
                    <p key={i} className="text-sm text-foreground mb-1">
                      • {item.situation}
                    </p>
                  ))}
                </div>
                <div className="pt-3 border-t border-border/40">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    When Drew Takes the Lead:
                  </p>
                  {getProvenApproaches("Drew").map((item, i) => (
                    <p key={i} className="text-sm text-foreground mb-1">
                      • {item.situation}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
