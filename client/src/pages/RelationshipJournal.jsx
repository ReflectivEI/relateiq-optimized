/**
 * RelationshipJournal.jsx
 * Interactive searchable timeline journal pulling from Coach sessions, Reflections, and Check-Ins
 * Supports filtering by tone, session type, topic, and person
 */

import React, { useState, useMemo } from "react";
import { api } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import JournalEntryCard from "@/components/journal/JournalEntryCard";

const MOOD_OPTIONS = [
  { value: "grateful", label: "🙏 Grateful" },
  { value: "hopeful", label: "✨ Hopeful" },
  { value: "reflective", label: "🤔 Reflective" },
  { value: "vulnerable", label: "💙 Vulnerable" },
  { value: "thoughtful", label: "💭 Thoughtful" },
  { value: "honest", label: "✓ Honest" },
  { value: "great", label: "🌟 Great" },
  { value: "good", label: "👍 Good" },
  { value: "okay", label: "→ Okay" },
  { value: "tough", label: "⚠️ Tough" },
  { value: "difficult", label: "🌊 Difficult" },
];

const TYPE_OPTIONS = [
  { value: "coach", label: "AI Coach Sessions" },
  { value: "reflection", label: "Daily Reflections" },
  { value: "check-in", label: "Weekly Check-Ins" },
];

const TOPIC_OPTIONS = [
  { value: "communication", label: "Communication" },
  { value: "conflict", label: "Conflict" },
  { value: "intimacy", label: "Intimacy" },
  { value: "growth", label: "Growth" },
  { value: "gratitude", label: "Gratitude" },
  { value: "vulnerability", label: "Vulnerability" },
  { value: "dreams", label: "Dreams & Future" },
  { value: "memories", label: "Memories" },
  { value: "values", label: "Values" },
  { value: "healing", label: "Healing" },
];

export default function RelationshipJournal() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedPerson, setSelectedPerson] = useState("");

  // Fetch all sources
  const { data: coachSessions = [] } = useQuery({
    queryKey: ["coach-journal"],
    queryFn: () => api.entities.CoachSession.list("-created_date", 100),
  });

  const { data: reflections = [] } = useQuery({
    queryKey: ["reflections-journal"],
    queryFn: () => api.entities.DailyReflection.list("-created_date", 100),
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ["checkins-journal"],
    queryFn: () => api.entities.CheckIn.list("-created_date", 100),
  });

  // Aggregate and normalize entries
  const allEntries = useMemo(() => {
    const entries = [];

    // Coach sessions
    coachSessions.forEach((s) => {
      entries.push({
        id: `coach-${s.id}`,
        type: "coach",
        date: new Date(s.created_date),
        person_name: s.speaker,
        content: s.situation,
        direction: `${s.speaker}→${s.speaking_to}`,
        speaker: s.speaker,
        speaking_to: s.speaking_to,
        searchText: `${s.situation} ${s.speaker}`.toLowerCase(),
      });
    });

    // Daily reflections
    reflections.forEach((r) => {
      entries.push({
        id: `reflection-${r.id}`,
        type: "reflection",
        date: new Date(r.reflection_date || r.created_date),
        person_name: r.person_name,
        content: r.answer,
        mood: r.mood,
        topic: r.mood, // Mood acts as topic filter
        searchText: `${r.answer} ${r.person_name}`.toLowerCase(),
      });
    });

    // Check-ins
    checkIns.forEach((c) => {
      entries.push({
        id: `checkin-${c.id}`,
        type: "check-in",
        date: new Date(c.created_date),
        person_name: c.person_name,
        content: `What worked: ${c.what_worked}. Could improve: ${c.what_could_improve}`,
        what_worked: c.what_worked,
        what_could_improve: c.what_could_improve,
        gratitude: c.gratitude,
        mood: c.mood,
        searchText: `${c.what_worked} ${c.what_could_improve} ${c.person_name}`.toLowerCase(),
      });
    });

    return entries.sort((a, b) => b.date - a.date);
  }, [coachSessions, reflections, checkIns]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return allEntries.filter((entry) => {
      // Search query
      if (
        searchQuery.trim() &&
        !entry.searchText.includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Type filter
      if (selectedType && entry.type !== selectedType) {
        return false;
      }

      // Mood/Tone filter
      if (selectedMood && entry.mood !== selectedMood) {
        return false;
      }

      // Topic filter
      if (selectedTopic && !entry.searchText.includes(selectedTopic.toLowerCase())) {
        return false;
      }

      // Person filter
      if (selectedPerson && entry.person_name !== selectedPerson) {
        return false;
      }

      return true;
    });
  }, [allEntries, searchQuery, selectedType, selectedMood, selectedTopic, selectedPerson]);

  // Group by date for timeline
  const groupedByDate = useMemo(() => {
    const groups = {};
    filteredEntries.forEach((entry) => {
      const dateKey = format(entry.date, "MMMM d, yyyy");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(entry);
    });
    return groups;
  }, [filteredEntries]);

  const hasActiveFilters =
    searchQuery || selectedType || selectedMood || selectedTopic || selectedPerson;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedType("");
    setSelectedMood("");
    setSelectedTopic("");
    setSelectedPerson("");
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center space-y-2">
          <h1 className="font-display text-4xl font-bold tracking-tight">
            Relationship Journal
          </h1>
          <p className="text-muted-foreground text-lg">
            Your searchable timeline of growth, reflections, and moments together
          </p>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <Card className="border-2">
        <CardContent className="p-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search entries by content, names, emotions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm bg-background"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Type
              </label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All types</SelectItem>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Tone
              </label>
              <Select value={selectedMood} onValueChange={setSelectedMood}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All tones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All tones</SelectItem>
                  {MOOD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Topic
              </label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All topics</SelectItem>
                  {TOPIC_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Person
              </label>
              <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Both people" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Both people</SelectItem>
                  <SelectItem value="Tony">Tony</SelectItem>
                  <SelectItem value="Drew">Drew</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-1.5 text-xs text-muted-foreground hover:text-foreground w-full"
                >
                  <X className="w-3 h-3" />
                  Clear filters
                </Button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/40">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>
              Showing <strong>{filteredEntries.length}</strong> of{" "}
              <strong>{allEntries.length}</strong> entries
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {filteredEntries.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedByDate).map(([dateKey, entries]) => (
            <motion.div
              key={dateKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {/* Date header */}
              <div className="sticky top-0 z-10 flex items-center gap-3 bg-background/80 backdrop-blur-sm py-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-sm font-semibold text-muted-foreground px-3 whitespace-nowrap">
                  {dateKey}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Entries for this date */}
              <div className="space-y-3 pl-2 sm:pl-0">
                {entries.map((entry, idx) => (
                  <JournalEntryCard key={entry.id} entry={entry} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center space-y-3">
            <Filter className="w-8 h-8 text-muted-foreground/40 mx-auto" />
            <p className="text-muted-foreground">
              {searchQuery || selectedType || selectedMood || selectedTopic || selectedPerson
                ? "No entries match your filters. Try adjusting them."
                : "No journal entries yet. Start with AI Coach, Daily Reflections, or Check-Ins!"}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="mt-3">
                Clear filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Growth summary (show if entries exist) */}
      {allEntries.length > 0 && (
        <Card className="border-2 border-primary/30 bg-primary/5">
          <CardContent className="p-6">
            <p className="text-sm text-foreground leading-relaxed">
              <span className="font-semibold">Your journey:</span> You've recorded{" "}
              <strong>{coachSessions.length}</strong> coaching moments,{" "}
              <strong>{reflections.length}</strong> reflections, and{" "}
              <strong>{checkIns.length}</strong> weekly check-ins together. Each entry is a
              step in understanding each other better.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}