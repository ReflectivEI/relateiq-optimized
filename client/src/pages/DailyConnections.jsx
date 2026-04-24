/**
 * DailyConnections.jsx — Shared daily reflection space with voice-to-text support
 * Both partners answer a single question, view each other's responses
 */

import React, { useState, useEffect } from "react";
import { api } from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Lock, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getTodayQuestion } from "@/lib/dailyQuestionEngine";
import DailyQuestionCard from "@/components/reflection/DailyQuestionCard";
import ReflectionResponse from "@/components/reflection/ReflectionResponse";
import PrivacyBanner from "@/components/ui/PrivacyBanner";
import VoiceRecorder from "@/components/reflection/VoiceRecorder";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import { getPartnerName, getRelationshipLabel } from "@/lib/relationshipParticipants";

export default function DailyConnections() {
  const { activeRelationshipId, activeRelationship, participants } = useRelationshipAuth();
  const [person, setPerson] = useState(participants[0]);
  const [answer, setAnswer] = useState("");
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState("text");
  const queryClient = useQueryClient();

  useEffect(() => {
    setPerson((current) => (participants.includes(current) ? current : participants[0]));
  }, [participants]);

  // Get today's question (deterministic)
  const todayQuestion = getTodayQuestion();

  // Fetch today's reflections
  const { data: reflections = [] } = useQuery({
    queryKey: ["daily-reflections-today", activeRelationshipId],
    queryFn: async () => {
      const today = todayQuestion.date;
      return api.entities.DailyReflection.filter({
        reflection_date: today,
      });
    },
  });

  // Get my response and partner's response
  const myResponse = reflections.find((r) => r.person_name === person);
  const partnerName = getPartnerName(person, participants);
  const partnerResponse = reflections.find((r) => r.person_name === partnerName);
  const relationshipLabel = getRelationshipLabel(activeRelationship, participants);

  // Mark partner response as viewed if we haven't already
  useEffect(() => {
    if (partnerResponse && !partnerResponse.partner_viewed && !myResponse?.partner_viewed) {
      api.entities.DailyReflection.update(partnerResponse.id, {
        partner_viewed: true,
      });
    }
  }, [partnerResponse, myResponse]);

  const handleVoiceTranscribed = (data) => {
    setAnswer(data.text);
    setMood(data.emotion || "thoughtful");
  };

  const handleSubmit = async () => {
    if (!answer.trim()) return;

    setLoading(true);

    try {
      await api.entities.DailyReflection.create({
        person_name: person,
        question_id: todayQuestion.index.toString(),
        answer: answer.trim(),
        mood: mood || "thoughtful",
        reflection_date: todayQuestion.date,
        shared_with_partner: true,
        partner_viewed: false,
      });

      setAnswer("");
      setMood("");
      setInputMode("text");
      toast.success("Response shared with your partner ✨");
      queryClient.invalidateQueries({ queryKey: ["daily-reflections-today", activeRelationshipId] });
    } catch (err) {
      toast.error("Failed to save reflection");
    } finally {
      setLoading(false);
      }
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 text-center"
      >
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-semibold uppercase tracking-wide">
          <Heart className="w-4 h-4" fill="currentColor" />
          Daily Connection
        </div>
        <h1 className="font-display text-5xl font-bold text-foreground">
          Daily Reflections
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Answer a single, thoughtful question each day. See how your partner responds. Build intimacy through shared perspective.
        </p>
      </motion.div>

      <PrivacyBanner />

      <Tabs value={person} onValueChange={setPerson}>
        <TabsList>
          {participants.map((name) => (
            <TabsTrigger key={name} value={name}>{name}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid gap-3 md:grid-cols-2">
        {participants.map((name) => {
          const reflection = reflections.find((item) => item.person_name === name);
          const active = person === name;
          return (
            <Card key={name} className={active ? "border-2 border-primary/35 bg-primary/5" : "border border-border/60 bg-white"}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div>
                <p className="text-sm font-semibold text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {reflection ? "Reflection saved for today." : "No reflection saved yet today."}
                  </p>
                </div>
                <Button size="sm" variant={active ? "default" : "outline"} onClick={() => setPerson(name)}>
                  {active ? "Currently Viewing" : `Switch to ${name}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Today's Question */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <DailyQuestionCard question={todayQuestion} />
      </motion.div>

      {/* Two-column layout: Your response + Partner's response */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* YOUR RESPONSE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="font-display text-2xl font-bold text-foreground">
            {person}'s Reflection
          </h2>
          <p className="text-sm text-muted-foreground">
            Switch between the people in this connection above to write and review each reflection for {relationshipLabel}.
          </p>

          {myResponse ? (
            <ReflectionResponse response={myResponse} isOwn={true} />
          ) : (
            <Card className="border-2 border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Share Your Thoughts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Input mode tabs */}
                <div className="flex gap-2 border-b border-border">
                  <button
                    onClick={() => setInputMode("text")}
                    className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                      inputMode === "text"
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Type
                  </button>
                  <button
                    onClick={() => setInputMode("voice")}
                    className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                      inputMode === "voice"
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Voice
                  </button>
                </div>

                {inputMode === "text" ? (
                  <Textarea
                    placeholder="Take your time. Be honest. Your words matter..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="min-h-[180px] resize-none bg-background text-base"
                  />
                ) : (
                  <VoiceRecorder
                    onTranscribed={handleVoiceTranscribed}
                    disabled={loading}
                    saveDestinationLabel={`${person}'s reflection draft`}
                    instructions={{
                      title: "How voice memo works",
                      bullets: [
                        "Tap Record Voice Memo, speak naturally, and press Stop when you are done.",
                        "The memo is uploaded securely and transcribed into text to prefill your reflection.",
                        "The transcript is what gets saved into Daily Connections. The original audio is only used to create that transcript and support the reflection workflow.",
                        `Your voice memo can also help the app detect tone, summarize themes, and improve coaching context for ${relationshipLabel}.`
                      ],
                    }}
                  />
                )}

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">How are you feeling right now?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["vulnerable", "thoughtful", "grateful", "hopeful", "reflective", "honest"].map((m) => (
                      <Button
                        key={m}
                        onClick={() => setMood(m)}
                        variant={mood === m ? "default" : "outline"}
                        className="border-2 text-sm capitalize"
                      >
                        {m}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!answer.trim() || loading}
                  className="w-full border-2 border-primary text-base gap-2"
                >
                  {loading ? (
                    <>Loading...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Share Your Response
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* PARTNER'S RESPONSE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h2 className="font-display text-2xl font-bold text-foreground">
            {partnerName}'s Reflection
          </h2>

          {partnerResponse ? (
            <ReflectionResponse response={partnerResponse} partner={partnerName} />
          ) : (
            <Card className="border-2 border-dashed border-muted">
              <CardContent className="p-6 text-center space-y-3">
                <Lock className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <p className="text-lg text-muted-foreground font-medium">
                  {partnerName} hasn't answered yet
                </p>
                <p className="text-sm text-muted-foreground/60">
                  Their response will appear here once they share it. You can switch tabs above to respond as {partnerName}.
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Upcoming Questions Peek */}
      <Card className="border-2 border-muted/40 bg-muted/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            You'll see a new reflection question every day. Each one is designed to deepen connection and understanding.
          </p>
          <p className="text-xs text-muted-foreground/60 italic">
            Your responses are shared only with your partner and visible only to those in your private connection space.
          </p>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="text-center text-xs text-muted-foreground/60 border-t border-border pt-6">
        <p>
          Daily reflections are a tool for connection. They complement, not replace, open conversations and professional support.
        </p>
      </div>
    </div>
  );
}
