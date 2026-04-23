import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Zap, Plus, Check, X, Pencil, Trash2, ChevronDown, ChevronUp, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";

const TRIGGER_TYPES = [
  { value: "tone", label: "Tone" },
  { value: "timing", label: "Timing" },
  { value: "criticism", label: "Criticism" },
  { value: "overwhelm", label: "Overwhelm" },
  { value: "last_minute_plans", label: "Last-Minute Plans" },
  { value: "feeling_misunderstood", label: "Feeling Misunderstood" },
  { value: "too_many_questions", label: "Too Many Questions" },
  { value: "feeling_ignored", label: "Feeling Ignored" },
  { value: "affection_mismatch", label: "Affection Mismatch" },
  { value: "work_stress", label: "Work Stress" },
  { value: "family", label: "Family" },
  { value: "sensory_irritation", label: "Sensory / Irritation" },
  { value: "shutdown_risk", label: "Shutdown Risk" },
  { value: "accountability", label: "Accountability" },
  { value: "feeling_pressured", label: "Feeling Pressured" },
  { value: "other", label: "Other" },
];

const SOURCE_LABELS = {
  manual: "Added manually",
  starter_example: "Starter example",
  ai_inferred: "AI inferred",
  ai_coach: "AI Coach",
  weekly_checkin: "Weekly Check-In",
  smart_tools: "Smart Tools",
  questionnaire: "Questionnaire",
};

const CONFIDENCE_COLORS = {
  low: "bg-slate-100 text-slate-600 border-slate-200",
  medium: "bg-blue-100 text-blue-700 border-blue-200",
  high: "bg-green-100 text-green-700 border-green-200",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  trigger_type: "other",
  example: "",
  emotional_meaning: "",
  common_reaction: "",
  what_helps: "",
  what_worsens: "",
  confidence: "medium",
};

const STARTER_TRIGGERS = {
  Tony: [
    {
      id: "starter-tony-need-pause",
      owner: "Tony",
      title: "Needs a pause before more questions",
      description: "When Tony is already activated, rapid follow-up questions can feel like pressure instead of support.",
      trigger_type: "too_many_questions",
      confidence: "medium",
      confirmed: true,
      source: "starter_example",
      common_reaction: "Goes quiet, withdraws, or becomes harder to read.",
      what_helps: "One clear question, slower pacing, and a little room to process before continuing.",
      what_worsens: "Stacked questions, urgency, or being pushed to explain before he is ready.",
    },
    {
      id: "starter-tony-dismissive-tone",
      owner: "Tony",
      title: "Dismissive or bored tone",
      description: "Flat or disengaged tone can register as indifference and make Tony feel emotionally unsafe.",
      trigger_type: "tone",
      confidence: "medium",
      confirmed: true,
      source: "starter_example",
      common_reaction: "Becomes hurt internally and shuts down further.",
      what_helps: "Warm tone, eye contact, and reflecting back what was actually heard.",
      what_worsens: "Rushing past the feeling or acting like the concern is too much.",
    },
  ],
  Drew: [
    {
      id: "starter-drew-lecturing-tone",
      owner: "Drew",
      title: "Lecturing tone",
      description: "Drew reacts badly when a conversation feels like he is being talked at instead of talked to.",
      trigger_type: "tone",
      confidence: "medium",
      confirmed: true,
      source: "starter_example",
      common_reaction: "Gets defensive or checks out fast.",
      what_helps: "Soft tone, clear check-in, and space to answer without interruption.",
      what_worsens: "Advice mode, over-explaining, or turning his feeling into a lesson.",
    },
    {
      id: "starter-drew-not-priority",
      owner: "Drew",
      title: "Feeling low priority",
      description: "When bids for connection do not get a response, Drew often reads it as not mattering enough.",
      trigger_type: "feeling_ignored",
      confidence: "medium",
      confirmed: true,
      source: "starter_example",
      common_reaction: "Irritability, shortness, or pushing harder for reassurance.",
      what_helps: "Follow-through, direct reassurance, and visible effort without needing to ask twice.",
      what_worsens: "Silence, vague promises, or delayed repair after distance.",
    },
  ],
};

function dedupeTriggers(items = []) {
  return items.filter((trigger, index, all) => {
    const key = [
      trigger.owner,
      (trigger.title || "").trim().toLowerCase(),
      trigger.trigger_type,
      trigger.confirmed ? "confirmed" : "unconfirmed",
    ].join(":");
    return (
      index ===
      all.findIndex((candidate) => {
        const candidateKey = [
          candidate.owner,
          (candidate.title || "").trim().toLowerCase(),
          candidate.trigger_type,
          candidate.confirmed ? "confirmed" : "unconfirmed",
        ].join(":");
        return candidateKey === key;
      })
    );
  });
}

function TriggerCard({ trigger, onConfirm, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={cn("border transition-all", trigger.confirmed ? "border-border/60" : "border-orange-200 bg-orange-50/30")}>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <Zap className={cn("w-4 h-4 mt-0.5 shrink-0", trigger.confirmed ? "text-primary" : "text-orange-400")} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{trigger.title}</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {TRIGGER_TYPES.find((t) => t.value === trigger.trigger_type)?.label || trigger.trigger_type}
                  </Badge>
                  <Badge className={cn("text-[10px] border font-normal", CONFIDENCE_COLORS[trigger.confidence])}>
                    {trigger.confidence} confidence
                  </Badge>
                  {!trigger.confirmed && (
                    <Badge className="text-[10px] border font-normal bg-orange-100 text-orange-700 border-orange-200">
                      Unconfirmed
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground/60">{SOURCE_LABELS[trigger.source] || trigger.source}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setExpanded(!expanded)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button onClick={() => onEdit(trigger)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onDelete(trigger.id)} className="delete-action-button p-1 transition-colors">
                <Trash2 className="delete-action-icon w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2 space-y-2 border-t border-border/40 mt-2">
                  {trigger.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{trigger.description}</p>
                  )}
                  {trigger.example && (
                    <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Example:</span> {trigger.example}</p>
                  )}
                  {trigger.emotional_meaning && (
                    <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Emotional meaning:</span> {trigger.emotional_meaning}</p>
                  )}
                  {trigger.common_reaction && (
                    <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Typical reaction:</span> {trigger.common_reaction}</p>
                  )}
                  {trigger.what_helps && (
                    <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">What helps:</span> {trigger.what_helps}</p>
                  )}
                  {trigger.what_worsens && (
                    <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">What worsens it:</span> {trigger.what_worsens}</p>
                  )}
                  {trigger.related_context && (
                    <p className="text-xs text-muted-foreground/60 italic border-t border-border/30 pt-2 mt-1">
                      Source context: "{trigger.related_context.slice(0, 150)}..."
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!trigger.confirmed && (
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                className="h-7 px-3 text-xs gap-1.5 bg-green-600 hover:bg-green-700"
                onClick={() => onConfirm(trigger.id)}
              >
                <Check className="w-3 h-3" /> Confirm this is accurate
              </Button>
              <button
                onClick={() => onEdit(trigger)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Edit first
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TriggerForm({ initial, onSave, onCancel, person }) {
  const [form, setForm] = useState(initial || { ...EMPTY_FORM });

  const handleSave = async () => {
    if (!form.title.trim()) return;
    if (initial?.id && !initial?._starterTemplate) {
      await api.entities.TriggerEntry.update(initial.id, { ...form, confirmed: true });
    } else {
      await api.entities.TriggerEntry.create({ ...form, owner: person, source: "manual", confirmed: true });
    }
    onSave();
  };

  return (
    <Card className="border-primary/20">
      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Trigger Title *</Label>
            <Input
              placeholder="e.g. Too many questions when stressed"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Trigger Type</Label>
            <Select value={form.trigger_type} onValueChange={(v) => setForm({ ...form, trigger_type: v })}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRIGGER_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Description</Label>
          <Textarea
            placeholder="Describe what this trigger is about..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="min-h-[60px] resize-none text-sm bg-background/60"
            rows={2}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Typical Reaction</Label>
            <Input placeholder="e.g. Shuts down, becomes defensive" value={form.common_reaction} onChange={(e) => setForm({ ...form, common_reaction: e.target.value })} className="text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">What Helps</Label>
            <Input placeholder="e.g. Space + one question at a time" value={form.what_helps} onChange={(e) => setForm({ ...form, what_helps: e.target.value })} className="text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">What Makes It Worse</Label>
            <Input placeholder="e.g. Repeated follow-ups, urgency" value={form.what_worsens} onChange={(e) => setForm({ ...form, what_worsens: e.target.value })} className="text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Confidence</Label>
            <Select value={form.confidence} onValueChange={(v) => setForm({ ...form, confidence: v })}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <Button size="sm" onClick={handleSave} disabled={!form.title.trim()} className="gap-1.5">
            <Check className="w-3.5 h-3.5" /> Save Trigger
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TriggerLibrary() {
  const { activeRelationshipId, participants, relationshipLabel } = useRelationshipAuth();
  const [person, setPerson] = useState(participants[0]);
  const [showForm, setShowForm] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState(null);
  const queryClient = useQueryClient();
  const [dismissedStarterIds, setDismissedStarterIds] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(window.localStorage.getItem("relateiq-dismissed-starters") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("relateiq-dismissed-starters", JSON.stringify(dismissedStarterIds));
  }, [dismissedStarterIds]);

  useEffect(() => {
    setPerson((current) => (participants.includes(current) ? current : participants[0]));
  }, [participants]);

  const { data: triggers = [] } = useQuery({
    queryKey: ["triggers", activeRelationshipId, person],
    queryFn: () => api.entities.TriggerEntry.filter({ owner: person }, "-created_date"),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["triggers", activeRelationshipId, person] });

  const handleConfirm = async (id) => {
    await api.entities.TriggerEntry.update(id, { confirmed: true, confidence: "high" });
    toast.success("Trigger confirmed");
    invalidate();
  };

  const handleDelete = async (id) => {
    if (String(id).startsWith("starter-")) {
      setDismissedStarterIds((prev) => Array.from(new Set([...prev, id])));
      toast.success("Starter example removed");
      return;
    }
    await api.entities.TriggerEntry.delete(id);
    toast.success("Trigger removed");
    invalidate();
  };

  const handleEdit = (trigger) => {
    setEditingTrigger(
      String(trigger.id).startsWith("starter-")
        ? { ...trigger, _starterTemplate: true }
        : trigger
    );
    setShowForm(false);
  };

  const unconfirmed = dedupeTriggers(triggers.filter((t) => !t.confirmed));
  const confirmedBase = dedupeTriggers(triggers.filter((t) => t.confirmed));
  const confirmedTitles = new Set(confirmedBase.map((trigger) => trigger.title.trim().toLowerCase()));
  const starterConfirmed = useMemo(
    () =>
      ((person === participants[0] ? STARTER_TRIGGERS.Tony : STARTER_TRIGGERS.Drew) || []).map((trigger) => ({
        ...trigger,
        owner: person,
        description: String(trigger.description || "")
          .replace(/\bTony\b/g, participants[0])
          .replace(/\bDrew\b/g, participants[1]),
        common_reaction: String(trigger.common_reaction || "")
          .replace(/\bTony\b/g, participants[0])
          .replace(/\bDrew\b/g, participants[1]),
        what_helps: String(trigger.what_helps || "")
          .replace(/\bTony\b/g, participants[0])
          .replace(/\bDrew\b/g, participants[1]),
        what_worsens: String(trigger.what_worsens || "")
          .replace(/\bTony\b/g, participants[0])
          .replace(/\bDrew\b/g, participants[1]),
      })).filter(
        (trigger) =>
          !confirmedTitles.has(trigger.title.trim().toLowerCase()) &&
          !dismissedStarterIds.includes(trigger.id)
      ),
    [person, participants, confirmedTitles, dismissedStarterIds]
  );
  const confirmed = [...confirmedBase, ...starterConfirmed];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Trigger Library</h1>
          <p className="text-muted-foreground mt-1">Known triggers, sensitivities, and support preferences for {relationshipLabel} — confirmed and AI-inferred</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingTrigger(null); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Trigger
        </Button>
      </div>

      <Tabs value={person} onValueChange={(v) => { setPerson(v); setShowForm(false); setEditingTrigger(null); }}>
        <TabsList>
          {participants.map((name) => (
            <TabsTrigger key={name} value={name}>{name}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* New trigger form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <TriggerForm
              person={person}
              onSave={() => { setShowForm(false); invalidate(); toast.success("Trigger saved"); }}
              onCancel={() => setShowForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit form */}
      <AnimatePresence>
        {editingTrigger && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <TriggerForm
              initial={editingTrigger}
              person={person}
              onSave={() => {
                if (editingTrigger?._starterTemplate && editingTrigger?.id) {
                  setDismissedStarterIds((prev) => Array.from(new Set([...prev, editingTrigger.id])));
                }
                setEditingTrigger(null);
                invalidate();
                toast.success("Trigger updated");
              }}
              onCancel={() => setEditingTrigger(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unconfirmed suggestions */}
      {unconfirmed.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-400" />
            <h2 className="font-medium text-foreground text-sm">AI-Suggested — Need Your Confirmation ({unconfirmed.length})</h2>
          </div>
          <div className="space-y-3">
            {unconfirmed.map((t) => (
              <TriggerCard key={t.id} trigger={t} onConfirm={handleConfirm} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {/* Confirmed triggers */}
      {confirmed.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h2 className="font-medium text-foreground text-sm">Confirmed Triggers ({confirmed.length})</h2>
          </div>
          <div className="space-y-3">
            {confirmed.map((t) => (
              <TriggerCard key={t.id} trigger={t} onConfirm={handleConfirm} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      )}

      {triggers.length === 0 && !showForm && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <Zap className="w-8 h-8 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground font-medium">No triggers saved for {person} yet.</p>
            <p className="text-sm text-muted-foreground">
              Triggers are added automatically when the AI detects patterns in your conversations, or you can add them manually.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
