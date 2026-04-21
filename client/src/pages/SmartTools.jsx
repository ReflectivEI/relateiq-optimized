import React, { useState, useEffect } from "react";
import { api } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Shield, MessageSquare, Search, RotateCcw, Lightbulb } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import {
  buildBeforeYouReactPrompt,
  buildTranslatePrompt,
  buildTriggerCheckPrompt,
  buildReplayAnalyzerPrompt,
} from "@/lib/prompts";
import { buildContextObject } from "@/lib/aiCoachService";
import AskCoachDrawer from "@/components/ai/AskCoachDrawer";
import ExplainElaborateBar from "@/components/ai/ExplainElaborateBar";
import ExportBar from "@/components/ai/ExportBar";
import { safeInvokeLLM, CreditLimitError } from "@/lib/aiSafe";
import FallbackBadge from "@/components/ui/FallbackBadge";
import DataSourceBadge from "@/components/ui/DataSourceBadge";
import PrivacyBanner from "@/components/ui/PrivacyBanner";
import CreditLimitBanner from "@/components/ui/CreditLimitBanner";
import { suggestSmartTools } from "@/lib/toolTriggerEngine";
import { computePatternProfile } from "@/lib/patternEngine";

const tools = [
  { id: "before_you_react", label: "Before You React", icon: Shield, description: "Feeling activated? Pause and get grounding advice before responding." },
  { id: "translate", label: "Translate What They Meant", icon: MessageSquare, description: "Enter what your partner said and understand the likely intention." },
  { id: "trigger_check", label: "Was That a Trigger?", icon: Search, description: "Reflect on a reaction and understand if it was a trigger response." },
  { id: "replay_analyzer", label: "Conversation Replay", icon: RotateCcw, description: "Paste a conversation summary and get an AI breakdown of what happened." },
];

const EMOTIONS = ["Angry", "Frustrated", "Hurt", "Anxious", "Defensive", "Shut Down", "Overwhelmed", "Resentful"];

export default function SmartTools() {
  const [activeTool, setActiveTool] = useState("before_you_react");
  const [person, setPerson] = useState("Tony");
  const [input, setInput] = useState("");
  const [emotion, setEmotion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [toolCtx, setToolCtx] = useState(null);
  const [creditError, setCreditError] = useState(false);

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-tools"],
    queryFn: () => api.entities.UserProfile.list(),
  });

  const { data: tonyResponses = [] } = useQuery({
    queryKey: ["responses-tools-tony"],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: "Tony" }),
  });

  const { data: drewResponses = [] } = useQuery({
    queryKey: ["responses-tools-drew"],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: "Drew" }),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions-tools"],
    queryFn: () => api.entities.CoachSession.list("-created_date", 10),
  });

  const { data: triggers = [] } = useQuery({
    queryKey: ["triggers-tools"],
    queryFn: () => api.entities.TriggerEntry.list(),
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ["checkins-tools"],
    queryFn: () => api.entities.CheckIn.list("-created_date", 5),
  });

  const [autoSuggestions, setAutoSuggestions] = useState([]);

  const userProfile = profiles.find((p) => p.person_name === person);
  const partnerName = person === "Tony" ? "Drew" : "Tony";
  const partnerProfile = profiles.find((p) => p.person_name === partnerName);
  const userResponses = person === "Tony" ? tonyResponses : drewResponses;
  const partnerResponses = partnerName === "Tony" ? tonyResponses : drewResponses;

  // Auto-suggest tools based on recent session
  useEffect(() => {
    if (sessions.length === 0) {
      setAutoSuggestions([]);
      return;
    }

    const patternScores = {
      [person]: computePatternProfile(person, userResponses),
      [partnerName]: computePatternProfile(partnerName, partnerResponses),
    };

    const suggestions = suggestSmartTools({
      lastSession: sessions[0],
      activeTriggers: triggers.filter((t) => t.owner === person),
      recentCheckIns: checkIns,
      patternScores: patternScores[person],
      speaker: person,
    });

    setAutoSuggestions(suggestions);
  }, [sessions, person, triggers, checkIns]);

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    setCreditError(false);

    const promptBuilders = {
      before_you_react: () => buildBeforeYouReactPrompt({ person, emotion, userProfile, partnerName, partnerProfile, userResponses }),
      translate: () => buildTranslatePrompt({ person, partnerName, message: input, userProfile, partnerProfile, partnerResponses }),
      trigger_check: () => buildTriggerCheckPrompt({ person, event: input, userProfile, userResponses }),
      replay_analyzer: () => buildReplayAnalyzerPrompt({ person, partnerName, summary: input, userProfile, partnerProfile, userResponses, partnerResponses }),
    };

    const prompt = promptBuilders[activeTool]();

    let aiResult;
    try {
      aiResult = await safeInvokeLLM(
        {
          prompt,
          model: "claude_sonnet_4_6",
          partnerLanguage: { personName: person, partnerName },
        },
        35000,
        null
      );
    } catch (err) {
      if (err instanceof CreditLimitError) { setCreditError(true); setLoading(false); return; }
      throw err;
    }

    await api.entities.CoachSession.create({
      speaker: person,
      speaking_to: partnerName,
      situation: activeTool === "before_you_react" ? `Feeling: ${emotion}` : input,
      ai_response: aiResult,
      tool_type: activeTool,
    });

    setResult(aiResult);
    setToolCtx(buildContextObject({
      page: "Smart Tools",
      sectionTitle: currentTool.label,
      scope: person,
      sourceInputs: { tool: activeTool, emotion, input },
      originalOutput: aiResult,
      profiles,
      tonyResponses,
      drewResponses,
    }));
    setLoading(false);
  };

  const currentTool = tools.find((t) => t.id === activeTool);
  const canSubmit = activeTool === "before_you_react" ? !!emotion : !!input.trim();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Smart Tools</h1>
        <p className="text-muted-foreground mt-1">Real-time support powered by everything the system knows about you both</p>
      </div>

      <PrivacyBanner />

      {creditError && <CreditLimitBanner />}

      {/* Auto-trigger suggestions */}
      {autoSuggestions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-2 border-teal-400/30 bg-teal-500/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-teal-300 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-teal-200 mb-2">Suggested for you:</p>
                  <div className="space-y-1.5">
                    {autoSuggestions.map((sugg) => (
                      <button
                        key={sugg.tool}
                        onClick={() => {
                          const toolId = {
                            "Before You React": "before_you_react",
                            "Proactive Repair": "trigger_check",
                            "Translate Meaning": "translate",
                            "Conversation Replay": "replay_analyzer",
                          }[sugg.tool];
                          if (toolId) setActiveTool(toolId);
                        }}
                        className="block w-full text-left p-2 rounded-lg bg-card border border-teal-400/30 hover:border-teal-400/60 transition-all"
                      >
                        <p className="text-sm font-medium text-foreground">{sugg.tool}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{sugg.reason}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tool Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => { setActiveTool(tool.id); setResult(null); setInput(""); setEmotion(""); }}
            className={`text-left p-4 rounded-xl border transition-all ${
              activeTool === tool.id ? "border-primary/30 bg-primary/5 shadow-sm" : "border-border/50 hover:border-border hover:bg-muted/20"
            }`}
          >
            <div className="flex items-center gap-3 mb-1.5">
              <tool.icon className={`w-4 h-4 ${activeTool === tool.id ? "text-primary" : "text-muted-foreground"}`} />
              <span className="font-medium text-sm text-foreground">{tool.label}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{tool.description}</p>
          </button>
        ))}
      </div>

      {/* Person Selector */}
      <Tabs value={person} onValueChange={(v) => { setPerson(v); setResult(null); }}>
        <TabsList>
          <TabsTrigger value="Tony">I'm Tony</TabsTrigger>
          <TabsTrigger value="Drew">I'm Drew</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Tool Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <currentTool.icon className="w-4 h-4 text-primary" />
            {currentTool.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeTool === "before_you_react" ? (
            <div className="space-y-2">
              <Label>What are you feeling right now?</Label>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmotion(e)}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                      emotion === e ? "border-primary/40 bg-primary/8 text-foreground" : "border-border/50 text-muted-foreground hover:border-border"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>
                {activeTool === "translate" && `What did ${partnerName} say?`}
                {activeTool === "trigger_check" && "What happened? Describe the moment."}
                {activeTool === "replay_analyzer" && "Summarize the conversation or argument."}
              </Label>
              <Textarea
                placeholder={
                  activeTool === "translate" ? `Enter what ${partnerName} said or did...`
                  : activeTool === "trigger_check" ? "Describe what happened and how you reacted..."
                  : "Paste or summarize the conversation..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[120px] resize-none bg-background/50"
              />
            </div>
          )}

          <Button onClick={handleSubmit} disabled={loading || !canSubmit} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <currentTool.icon className="w-4 h-4" />}
            {loading ? "Analyzing..." : activeTool === "before_you_react" ? "Ground Me" : "Analyze"}
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-card border border-primary/15">
              <CardContent className="p-6">
                {result && result.trim().length < 30 && <FallbackBadge />}
                <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
                {toolCtx && (
                  <div className="mt-4 pt-4 border-t border-border/40 space-y-3">
                    <DataSourceBadge sources={[
                      { label: "profile fields", count: userProfile ? 6 : 0 },
                      { label: "questionnaire answers", count: userResponses.length },
                    ]} />
                    <ExplainElaborateBar ctx={toolCtx} />
                    <ExportBar ctx={toolCtx} content={result} />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AskCoachDrawer ctx={toolCtx || buildContextObject({
        page: "Smart Tools",
        sectionTitle: currentTool?.label || "Smart Tool",
        scope: person,
        sourceInputs: {},
        profiles,
        tonyResponses,
        drewResponses,
      })} />
    </div>
  );
}
