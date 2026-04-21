import React, { useRef, useState } from "react";
import { api } from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, HeartHandshake, AlertTriangle, ChevronDown, ChevronUp,
  Copy, CheckCircle2, Clock, Zap, History, Pencil, Trash2
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { buildRepairPrompt, serializeOutcomeMemory } from "@/lib/repairPrompt";
import OutcomeLogger from "@/components/repair/OutcomeLogger";
import AskCoachDrawer from "@/components/ai/AskCoachDrawer";
import { buildContextObject } from "@/lib/aiCoachService";
import { safeInvokeLLM } from "@/lib/aiSafe";
import AILoadingState from "@/components/ui/AILoadingState";
import CreditLimitBanner from "@/components/ui/CreditLimitBanner";
import ResponseExportBar from "@/components/export/ResponseExportBar";

const SITUATION_TAGS = [
  "misunderstanding", "shutdown", "defensiveness", "hurt feelings",
  "apology not enough", "unresolved argument", "emotional distance",
  "pressure / overwhelm", "last-minute issue", "criticism / judgment",
  "lack of affection", "feeling unseen / unheard",
];

const EFFORT_COLORS = {
  low: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
};

function normalizeRepairText(value) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function RepairScriptCard({ script }) {
  const [expanded, setExpanded] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(script.script); toast.success("Copied"); };
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden bg-background/60">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/20 transition-colors"
      >
        <span className="text-sm font-medium text-foreground">{script.label}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={(e) => { e.stopPropagation(); handleCopy(); }} className="p-1 text-muted-foreground hover:text-foreground">
            <Copy className="w-3.5 h-3.5" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-2 border-t border-border/30">
              <blockquote className="mt-3 italic text-sm text-foreground leading-relaxed border-l-2 border-primary/30 pl-3">
                "{script.script}"
              </blockquote>
              {script.notes && <p className="text-xs text-muted-foreground">{script.notes}</p>}
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={handleCopy}>
                <Copy className="w-3 h-3" /> Copy
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RepairOutput({ repair, repairEntryId, person }) {
  return (
    <div className="space-y-5">
      {/* What likely happened */}
      <Card className="bg-primary/5 border-primary/15">
        <CardContent className="p-5 space-y-2">
          <p className="text-xs font-medium text-primary uppercase tracking-wide">What Likely Happened</p>
          <p className="text-sm text-foreground leading-relaxed">{repair.what_likely_happened}</p>
        </CardContent>
      </Card>

      {/* What each person needs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">What Tony needs now</p>
            <p className="text-sm text-foreground leading-relaxed">{repair.what_tony_needs_now}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">What Drew needs now</p>
            <p className="text-sm text-foreground leading-relaxed">{repair.what_drew_needs_now}</p>
          </CardContent>
        </Card>
      </div>

      {/* Best repair move */}
      <Card className="border-2 border-primary/20 bg-primary/3">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-primary">Best Repair Move Right Now</p>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{repair.best_repair_move}</p>
        </CardContent>
      </Card>

      {/* Repair options */}
      {repair.repair_options?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Repair Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {repair.repair_options.map((opt, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/40 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{opt.action}</span>
                  {opt.effort_level && (
                    <Badge className={cn("text-[10px] border font-normal shrink-0", EFFORT_COLORS[opt.effort_level] || EFFORT_COLORS.medium)}>
                      {opt.effort_level} effort
                    </Badge>
                  )}
                </div>
                {opt.why && <p className="text-xs text-muted-foreground">{opt.why}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Scripts */}
      {repair.repair_scripts?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">What to Say — Repair Scripts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {repair.repair_scripts.map((s, i) => <RepairScriptCard key={i} script={s} />)}
          </CardContent>
        </Card>
      )}

      {/* What to avoid */}
      {repair.what_to_avoid?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" /> What to Avoid Right Now
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0">
            {repair.what_to_avoid.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                <span className="text-foreground">{a}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Why this fits + timing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {repair.why_this_fits && (
          <Card>
            <CardContent className="p-4 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Why This Fits You Both</p>
              <p className="text-sm text-foreground leading-relaxed">{repair.why_this_fits}</p>
            </CardContent>
          </Card>
        )}
        {repair.timing_guidance && (
          <Card>
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">Timing</p>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{repair.timing_guidance}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Learned from history */}
      {repair.learned_from_history && repair.learned_from_history !== "No prior outcome data yet" && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-muted/30 border border-border/40">
          <History className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">{repair.learned_from_history}</p>
        </div>
      )}

      {/* Outcome logger */}
      <OutcomeLogger
        sourceType="Proactive Repair"
        relatedSessionId={repairEntryId}
        scope={person === "Tony" ? "Tony" : person === "Drew" ? "Drew" : "Tony_Drew"}
        recommendationSummary={repair.best_repair_move}
      />
    </div>
  );
}

export default function ProactiveRepair() {
  const [person, setPerson] = useState("Tony");
  const [tags, setTags] = useState([]);
  const [whatHappened, setWhatHappened] = useState("");
  const [howFeeling, setHowFeeling] = useState("");
  const [unfinished, setUnfinished] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");
  const [alreadyTried, setAlreadyTried] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [repair, setRepair] = useState(null);
  const [repairEntryId, setRepairEntryId] = useState(null);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [creditError, setCreditError] = useState(false);
  const queryClient = useQueryClient();
  const repairRef = useRef(null);

  const partnerName = person === "Tony" ? "Drew" : "Tony";

  const { data: profiles = [] } = useQuery({ queryKey: ["profiles-repair"], queryFn: () => api.entities.UserProfile.list() });
  const { data: triggers = [] } = useQuery({ queryKey: ["triggers-repair"], queryFn: () => api.entities.TriggerEntry.list() });
  const { data: outcomeLogs = [] } = useQuery({ queryKey: ["outcomes-repair"], queryFn: () => api.entities.OutcomeLog.list("-created_date", 20) });
  const { data: repairEntries = [] } = useQuery({ queryKey: ["repair-entries"], queryFn: () => api.entities.RepairEntry.list("-created_date", 10) });

  const speakerProfile = profiles.find((p) => p.person_name === person);
  const targetProfile = profiles.find((p) => p.person_name === partnerName);
  const visibleRepairHistory = repairEntries
    .filter((entry) => entry.owner === person)
    .filter((entry, index, entries) => {
      const key = `${entry.owner}:${normalizeRepairText(entry.what_happened)}`;
      return (
        index ===
        entries.findIndex(
          (candidate) => `${candidate.owner}:${normalizeRepairText(candidate.what_happened)}` === key
        )
      );
    })
    .slice(0, 5);

  const toggleTag = (tag) => setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  const handleGenerate = async () => {
    if (!whatHappened.trim()) return;
    setLoading(true);
    setRepair(null);
    setRepairEntryId(null);
    setCreditError(false);

    const prompt = buildRepairPrompt({
      person,
      partnerName,
      whatHappened,
      howFeelingNow: howFeeling,
      whatFeelsUnfinished: unfinished,
      desiredOutcome,
      alreadyTried,
      situationTags: tags,
      speakerProfile,
      targetProfile,
      triggers,
      outcomeLogs,
      repairEntries,
    });

    let result;
    try { result = await safeInvokeLLM({
      prompt,
      model: "gpt_5_mini",
      partnerLanguage: { personName: person, partnerName },
      response_json_schema: {
        type: "object",
        properties: {
          what_likely_happened: { type: "string" },
          what_tony_needs_now: { type: "string" },
          what_drew_needs_now: { type: "string" },
          best_repair_move: { type: "string" },
          repair_options: { type: "array", items: { type: "object", properties: { action: { type: "string" }, why: { type: "string" }, effort_level: { type: "string" } } } },
          what_to_avoid: { type: "array", items: { type: "string" } },
          repair_scripts: { type: "array", items: { type: "object", properties: { label: { type: "string" }, script: { type: "string" }, notes: { type: "string" } } } },
          why_this_fits: { type: "string" },
          timing_guidance: { type: "string" },
          next_checkin: { type: "string" },
          learned_from_history: { type: "string" },
        },
      },
    }, 20000, {
      what_likely_happened: "We couldn't complete the full analysis right now. Please try again.",
      what_tony_needs_now: "Please regenerate for a full result.",
      what_drew_needs_now: "Please regenerate for a full result.",
      best_repair_move: "Try again to get a personalized repair recommendation.",
      repair_options: [],
      what_to_avoid: [],
      repair_scripts: [],
      why_this_fits: "",
      timing_guidance: "",
      next_checkin: "",
      learned_from_history: "",
    }); } catch (err) {
      if (err?.isCreditLimit) { setCreditError(true); setLoading(false); return; }
      throw err;
    }

    // Persist the repair entry
    const payload = {
      owner: person === "Tony" ? "Tony" : "Drew",
      situation_type: tags.join(", ") || "unspecified",
      situation_tags: tags,
      what_happened: whatHappened,
      how_feeling_now: howFeeling,
      what_feels_unfinished: unfinished,
      desired_outcome: desiredOutcome,
      already_tried: alreadyTried,
      ai_repair_output: JSON.stringify(result),
      recommended_repair: result.best_repair_move,
      outcome_logged: false,
    };
    const entry = editingEntryId
      ? await api.entities.RepairEntry.update(editingEntryId, payload)
      : await api.entities.RepairEntry.create(payload);

    setRepair(result);
    setRepairEntryId(entry.id);
    setEditingEntryId(entry.id);
    setLoading(false);
    queryClient.invalidateQueries({ queryKey: ["repair-entries"] });
  };

  const handleEditEntry = (entry) => {
    setEditingEntryId(entry.id);
    setPerson(entry.owner === "Drew" ? "Drew" : "Tony");
    setTags(Array.isArray(entry.situation_tags) ? entry.situation_tags : []);
    setWhatHappened(entry.what_happened || "");
    setHowFeeling(entry.how_feeling_now || "");
    setUnfinished(entry.what_feels_unfinished || "");
    setDesiredOutcome(entry.desired_outcome || "");
    setAlreadyTried(entry.already_tried || "");
    setRepairEntryId(entry.id);
    try {
      setRepair(entry.ai_repair_output ? JSON.parse(entry.ai_repair_output) : null);
    } catch {
      setRepair(null);
    }
    setShowAdvanced(true);
  };

  const handleDeleteEntry = async (entryId) => {
    await api.entities.RepairEntry.delete(entryId);
    if (repairEntryId === entryId || editingEntryId === entryId) {
      setRepair(null);
      setRepairEntryId(null);
      setEditingEntryId(null);
    }
    queryClient.invalidateQueries({ queryKey: ["repair-entries"] });
    toast.success("Repair session deleted");
  };

  const canGenerate = whatHappened.trim().length > 5;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Proactive Repair</h1>
        <p className="text-muted-foreground mt-1">Guided repair after tension, conflict, misunderstanding, or emotional distance</p>
      </div>

      {creditError && <CreditLimitBanner />}

      {/* Input card */}
      <Card className="border border-border/60">
        <CardContent className="p-6 space-y-5">
          {/* Who is repairing */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">This is</Label>
            <Tabs value={person} onValueChange={(v) => setPerson(v)}>
              <TabsList>
                <TabsTrigger value="Tony">Tony</TabsTrigger>
                <TabsTrigger value="Drew">Drew</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Situation tags */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">What kind of situation? <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <div className="flex flex-wrap gap-2">
              {SITUATION_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border text-sm transition-all",
                    tags.includes(tag)
                      ? "border-primary/40 bg-primary/10 text-foreground font-medium"
                      : "border-border/50 text-muted-foreground hover:border-border hover:bg-muted/20"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* What happened */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">What happened?</Label>
            <Textarea
              placeholder="Describe what happened — as much or as little as you want..."
              value={whatHappened}
              onChange={(e) => setWhatHappened(e.target.value)}
              className="min-h-[100px] resize-none bg-background/50"
            />
          </div>

          {/* Advanced fields toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showAdvanced ? "Hide" : "Add more context"} (optional but improves accuracy)
          </button>

          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-4"
              >
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">How are things feeling right now?</Label>
                  <Textarea placeholder="Tense? Distant? Raw? Fine on the surface but not really..." value={howFeeling} onChange={(e) => setHowFeeling(e.target.value)} className="min-h-[80px] resize-none bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">What feels unfinished?</Label>
                  <Textarea placeholder="What hasn't been said or resolved yet..." value={unfinished} onChange={(e) => setUnfinished(e.target.value)} className="min-h-[70px] resize-none bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">What do you want right now?</Label>
                  <Textarea placeholder="Reconnection? Understanding? Just some peace? A clean start?" value={desiredOutcome} onChange={(e) => setDesiredOutcome(e.target.value)} className="min-h-[70px] resize-none bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Has anything already been tried?</Label>
                  <Textarea placeholder="An apology? Giving space? A conversation that didn't land..." value={alreadyTried} onChange={(e) => setAlreadyTried(e.target.value)} className="min-h-[70px] resize-none bg-background/50" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button onClick={handleGenerate} disabled={loading || !canGenerate} className="w-full sm:w-auto gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <HeartHandshake className="w-4 h-4" />}
            {loading ? "Generating repair guidance..." : editingEntryId ? "Update Repair Guidance" : "Get Repair Guidance"}
          </Button>

          <AILoadingState active={loading} mode="repair" />

          {person && (
            <p className="text-xs text-primary/70 italic">
              Using everything the system knows about {person} and {partnerName} to tailor this repair.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Repair output */}
      <AnimatePresence>
        {repair && !loading && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <ResponseExportBar
              contentRef={repairRef}
              content={repair}
              filename={`repair-guidance-${person}.pdf`}
              title={`${person} Repair Guidance`}
              showEmail={false}
            />
            <div ref={repairRef}>
              <RepairOutput repair={repair} repairEntryId={repairEntryId} person={person} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Past repair history */}
      {visibleRepairHistory.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-muted-foreground">Past Repair Sessions</h2>
          <div className="space-y-2">
            {visibleRepairHistory.map((entry) => (
              <Card key={entry.id} className="border border-border/40">
                <CardContent className="p-4 flex items-start gap-3">
                  <HeartHandshake className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{entry.owner}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{entry.what_happened}</p>
                    {entry.outcome_rating && entry.outcome_rating !== "not_tried_yet" && (
                      <Badge variant="outline" className="mt-1.5 text-[10px]">{entry.outcome_rating}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditEntry(entry)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDeleteEntry(entry.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <AskCoachDrawer ctx={buildContextObject({
        page: "Proactive Repair",
        sectionTitle: "Repair Guidance",
        scope: person === "Tony" ? "Tony" : "Drew",
        sourceInputs: { situation: whatHappened, tags },
        originalOutput: repair ? JSON.stringify(repair) : null,
        profiles,
      })} />
    </div>
  );
}
