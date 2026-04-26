/**
 * VisionBoard.jsx — Shared couple vision board
 * Partners pin goals, dreams, and values and track progress together.
 */
import React, { useState } from "react";
import { api } from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import PinCard from "@/components/vision/PinCard";
import PinForm from "@/components/vision/PinForm";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";

const CATEGORIES = ["all", "dream", "goal", "value", "memory", "intention"];
const PROGRESS_FILTERS = ["all", "not_started", "in_progress", "achieved"];

const STATS = (pins, sharedScope) => ({
  total: pins.length,
  achieved: pins.filter((p) => p.progress === "achieved").length,
  shared: pins.filter((p) => p.pinned_by === sharedScope).length,
  inProgress: pins.filter((p) => p.progress === "in_progress").length,
});

export default function VisionBoard() {
  const { activeRelationshipId, participants, relationshipLabel } = useRelationshipAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingPin, setEditingPin] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [progressFilter, setProgressFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: pins = [], isLoading } = useQuery({
    queryKey: ["vision-pins", activeRelationshipId],
    queryFn: () => api.entities.VisionPin.list("-created_date"),
  });
  const [primaryPerson = "Tony", secondaryPerson = "Drew"] = participants;
  const sharedScope = `${primaryPerson}_${secondaryPerson}`;

  const filteredPins = pins.filter((p) => {
    const catOk = categoryFilter === "all" || p.category === categoryFilter;
    const progOk = progressFilter === "all" || p.progress === progressFilter;
    return catOk && progOk;
  });

  const handleSave = async (formData) => {
    if (editingPin) {
      await api.entities.VisionPin.update(editingPin.id, formData);
      toast.success("Pin updated");
    } else {
      await api.entities.VisionPin.create({
        ...formData,
        relationship_id: activeRelationshipId,
        source: "manual",
        source_date: new Date().toISOString().split("T")[0],
        progress: "not_started",
      });
      toast.success("Vision pinned! 📌");
    }
    queryClient.invalidateQueries({ queryKey: ["vision-pins", activeRelationshipId] });
    setShowForm(false);
    setEditingPin(null);
  };

  const handleUpdate = async (id, data, openEdit = false) => {
    if (openEdit) {
      const pin = pins.find((p) => p.id === id);
      setEditingPin(pin);
      setShowForm(true);
      return;
    }
    await api.entities.VisionPin.update(id, data);
    queryClient.invalidateQueries({ queryKey: ["vision-pins", activeRelationshipId] });
  };

  const handleDelete = async (id) => {
    await api.entities.VisionPin.delete(id);
    queryClient.invalidateQueries({ queryKey: ["vision-pins", activeRelationshipId] });
    toast.success("Pin removed");
  };

  const stats = STATS(pins, sharedScope);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3 pt-0 text-center"
      >
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">
          Vision Board
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Pin your shared dreams, goals, and values for {relationshipLabel}. Watch your relationship aspirations take shape together.
        </p>
      </motion.div>

      {/* Stats bar */}
      {pins.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-4 gap-3"
        >
          {[
            { label: "Total Pins", value: stats.total, color: "text-foreground" },
            { label: "In Progress", value: stats.inProgress, color: "text-blue-600" },
            { label: "Achieved", value: stats.achieved, color: "text-green-600" },
            { label: "Shared", value: stats.shared, color: "text-purple-600" },
          ].map((s) => (
            <Card key={s.label} className="border border-border/60">
              <CardContent className="p-3 text-center">
                <p className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Add button */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg border text-sm capitalize transition-all ${
                categoryFilter === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border/50 text-muted-foreground hover:border-border"
              }`}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>

        <Button onClick={() => { setEditingPin(null); setShowForm(true); }} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Add Pin
        </Button>
      </div>

      {/* Progress filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        {PROGRESS_FILTERS.map((prog) => (
          <button
            key={prog}
            onClick={() => setProgressFilter(prog)}
            className={`px-2.5 py-1 rounded-lg border text-xs capitalize transition-all ${
              progressFilter === prog
                ? "bg-foreground text-background border-foreground"
                : "border-border/50 text-muted-foreground hover:border-border"
            }`}
          >
            {prog === "all" ? "All progress" : prog.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Pin Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <PinForm
              initialData={editingPin || {}}
              participants={participants}
              defaultPinnedBy={primaryPerson}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingPin(null); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pins grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading your vision...</div>
      ) : filteredPins.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 space-y-4"
        >
          <p className="text-5xl">📌</p>
          <p className="text-lg font-medium text-foreground">
            {pins.length === 0 ? "Your vision board is empty" : "No pins match this filter"}
          </p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {pins.length === 0
              ? "Start by pinning a shared dream, a goal you're working toward, or a value that defines your relationship."
              : "Try a different filter to see your pins."}
          </p>
          {pins.length === 0 && (
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Pin Your First Dream
            </Button>
          )}
        </motion.div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {filteredPins.map((pin) => (
              <motion.div
                key={pin.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <PinCard
                  pin={pin}
                  participants={participants}
                  sharedScope={sharedScope}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <p className="text-center text-xs text-muted-foreground/60 border-t border-border pt-6">
        Vision pins are shared within {relationshipLabel}. Tap the progress status on any pin to update it.
      </p>
    </div>
  );
}
