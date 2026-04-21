/**
 * NotesPanel.jsx — Take and share notes on responses/insights
 */

import React, { useState } from "react";
import { api } from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Plus, Send, Share2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NotesPanel({
  section = "general",
  relatedItemId = null,
  personName = "Tony",
}) {
  const [expanded, setExpanded] = useState(false);
  const [newNote, setNewNote] = useState("");
  const queryClient = useQueryClient();

  // Fetch notes for this section
  const { data: notes = [] } = useQuery({
    queryKey: ["notes", section, relatedItemId],
    queryFn: () =>
      api.entities.Note.filter({
        related_section: section,
        related_item_id: relatedItemId || "any",
      }),
  });

  // My notes
  const myNotes = notes.filter((n) => n.person_name === personName);
  const partnerName = personName === "Tony" ? "Drew" : "Tony";
  const sharedNotes = notes.filter(
    (n) => n.person_name === partnerName && n.shared_with_partner
  );

  // Create note
  const createNoteMutation = useMutation({
    mutationFn: (content) =>
      api.entities.Note.create({
        person_name: personName,
        content,
        related_section: section,
        related_item_id: relatedItemId,
      }),
    onSuccess: () => {
      setNewNote("");
      queryClient.invalidateQueries({ queryKey: ["notes", section, relatedItemId] });
      toast.success("Note saved");
    },
  });

  // Share note
  const shareNoteMutation = useMutation({
    mutationFn: (noteId) =>
      api.entities.Note.update(noteId, { shared_with_partner: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", section, relatedItemId] });
      toast.success("Note shared with your partner");
    },
  });

  // Delete note
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId) => api.entities.Note.delete(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", section, relatedItemId] });
      toast.success("Note deleted");
    },
  });

  const handleSaveNote = () => {
    if (!newNote.trim()) return;
    createNoteMutation.mutate(newNote.trim());
  };

  return (
    <Card className="border-2 border-muted/40 bg-muted/5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              📝 Your Notes
            </CardTitle>
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <CardContent className="space-y-4 border-t border-border/40 pt-4">
              {/* Add new note */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Jot down lessons learned, insights, or anything to remember..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[80px] resize-none bg-background text-sm"
                />
                <Button
                  onClick={handleSaveNote}
                  disabled={!newNote.trim() || createNoteMutation.isPending}
                  className="border-2 border-primary text-sm gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Save Note
                </Button>
              </div>

              {/* Your notes */}
              {myNotes.length > 0 && (
                <div className="space-y-2 border-t border-border/40 pt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Your Notes ({myNotes.length})
                  </p>
                  {myNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-lg bg-background/60 border border-border/40 space-y-2 text-sm"
                    >
                      <p className="text-foreground">{note.content}</p>
                      <div className="flex gap-2 pt-2">
                        {!note.shared_with_partner ? (
                          <Button
                            onClick={() => shareNoteMutation.mutate(note.id)}
                            disabled={shareNoteMutation.isPending}
                            size="sm"
                            variant="ghost"
                            className="text-xs border border-teal-600 text-teal-700 hover:bg-teal-50"
                          >
                            <Share2 className="w-3 h-3 mr-1" />
                            Share
                          </Button>
                        ) : (
                          <span className="text-xs text-teal-700 font-semibold px-2 py-1">
                            ✓ Shared
                          </span>
                        )}
                        <Button
                          onClick={() => deleteNoteMutation.mutate(note.id)}
                          disabled={deleteNoteMutation.isPending}
                          size="sm"
                          variant="ghost"
                          className="text-xs text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Partner's shared notes */}
              {sharedNotes.length > 0 && (
                <div className="space-y-2 border-t border-border/40 pt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {partnerName}'s Shared Notes ({sharedNotes.length})
                  </p>
                  {sharedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-lg bg-accent/10 border border-accent/30 space-y-1 text-sm"
                    >
                      <p className="text-foreground">{note.content}</p>
                      <p className="text-xs text-muted-foreground">
                        Shared by {partnerName}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {myNotes.length === 0 && sharedNotes.length === 0 && (
                <p className="text-xs text-muted-foreground/60 text-center py-4">
                  No notes yet. Start capturing insights!
                </p>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}