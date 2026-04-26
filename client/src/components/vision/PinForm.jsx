/**
 * PinForm.jsx — Create/edit a vision board pin
 */
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Pin } from "lucide-react";

const CATEGORIES = [
  { id: "dream",     label: "Dream",     emoji: "✨" },
  { id: "goal",      label: "Goal",      emoji: "🎯" },
  { id: "value",     label: "Value",     emoji: "💎" },
  { id: "memory",    label: "Memory",    emoji: "💝" },
  { id: "intention", label: "Intention", emoji: "🌱" },
];

const EMOJIS = ["✨", "🎯", "💎", "💝", "🌱", "🏡", "🌍", "💪", "🫂", "🎉", "🌈", "❤️", "🔥", "🙏", "🌟"];

export default function PinForm({
  initialData = {},
  onSave,
  onCancel,
  participants = ["Person A", "Other Person"],
  defaultPinnedBy,
}) {
  const [primaryPerson = "Person A", secondaryPerson = "Other Person"] = participants;
  const sharedScope = `${primaryPerson}_${secondaryPerson}`;
  const pinnedByOptions = [primaryPerson, secondaryPerson, sharedScope];
  const [form, setForm] = useState({
    title: initialData.title || "",
    description: initialData.description || "",
    category: initialData.category || "dream",
    pinned_by: initialData.pinned_by || defaultPinnedBy || primaryPerson,
    emoji: initialData.emoji || "✨",
    notes: initialData.notes || "",
    shared: initialData.shared !== false,
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave(form);
  };

  return (
    <Card className="border-2 border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Pin className="w-4 h-4 text-primary" />
            {initialData.id ? "Edit Pin" : "Add Vision Pin"}
          </CardTitle>
          <button onClick={onCancel} className="p-1 rounded hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Emoji picker */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Icon</p>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => set("emoji", e)}
                className={`text-xl p-1.5 rounded-lg transition-all ${
                  form.emoji === e ? "bg-primary/15 ring-2 ring-primary/40" : "hover:bg-muted"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title *</p>
          <Input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Travel Southeast Asia together"
            className="bg-background"
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => set("category", cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                  form.category === cat.id
                    ? "border-primary/40 bg-primary/8 text-foreground font-medium"
                    : "border-border/50 text-muted-foreground hover:border-border"
                }`}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</p>
          <Textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Describe this dream, goal, or value in more detail..."
            className="resize-none bg-background min-h-[80px]"
          />
        </div>

        {/* Pinned by */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pinned by</p>
          <div className="flex gap-2">
            {pinnedByOptions.map((who) => (
              <button
                key={who}
                onClick={() => set("pinned_by", who)}
                className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                  form.pinned_by === who
                    ? "border-primary/40 bg-primary/8 font-medium text-foreground"
                    : "border-border/50 text-muted-foreground hover:border-border"
                }`}
              >
                {who === sharedScope ? "Both of Us" : who}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes (optional)</p>
          <Textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Any progress notes or thoughts..."
            className="resize-none bg-background min-h-[60px]"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button onClick={handleSave} disabled={!form.title.trim()} className="gap-2">
            <Pin className="w-4 h-4" />
            {initialData.id ? "Save Changes" : "Pin It"}
          </Button>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}
