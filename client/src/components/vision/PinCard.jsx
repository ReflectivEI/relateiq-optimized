/**
 * PinCard.jsx — displays a single vision board pin with progress and edit actions
 */
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Pencil, Trash2, MoreHorizontal, Circle, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Dark-friendly category styles (no light bg — use border + tinted text only)
const CATEGORY_STYLES = {
  dream:     { accent: "border-purple-400/40", badge: "text-purple-300 bg-purple-400/15", label: "Dream" },
  goal:      { accent: "border-blue-400/40",   badge: "text-blue-300 bg-blue-400/15",     label: "Goal"  },
  value:     { accent: "border-green-400/40",  badge: "text-green-300 bg-green-400/15",   label: "Value" },
  memory:    { accent: "border-rose-400/40",   badge: "text-rose-300 bg-rose-400/15",     label: "Memory"},
  intention: { accent: "border-orange-400/40", badge: "text-orange-300 bg-orange-400/15", label: "Intention"},
};

const PROGRESS_CONFIG = {
  not_started: { icon: Circle, label: "Not started", color: "text-muted-foreground" },
  in_progress: { icon: Clock,  label: "In progress", color: "text-blue-400" },
  achieved:    { icon: Check,  label: "Achieved ✨",  color: "text-green-400" },
};

export default function PinCard({
  pin,
  participants = ["Person A", "Other Person"],
  sharedScope = `${participants[0]}_${participants[1]}`,
  onUpdate,
  onDelete,
}) {
  const style = CATEGORY_STYLES[pin.category] || CATEGORY_STYLES.dream;
  const progress = PROGRESS_CONFIG[pin.progress] || PROGRESS_CONFIG.not_started;
  const ProgressIcon = progress.icon;

  const cycleProgress = () => {
    const order = ["not_started", "in_progress", "achieved"];
    const next = order[(order.indexOf(pin.progress) + 1) % order.length];
    onUpdate(pin.id, { progress: next });
  };

  return (
    <Card className={cn("border-2 transition-all hover:shadow-md bg-card", style.accent)}>
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {pin.emoji && <span className="text-2xl shrink-0">{pin.emoji}</span>}
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight truncate text-foreground">
                {pin.title}
              </p>
              <span className={cn("text-[11px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded", style.badge)}>
                {style.label}
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded hover:bg-muted transition-colors shrink-0">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onUpdate(pin.id, null, true)}>
                <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(pin.id)} className="text-destructive">
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {pin.description && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {pin.description}
          </p>
        )}

        {/* Notes */}
        {pin.notes && (
          <div className="px-2 py-1.5 rounded-lg bg-muted/50 text-xs text-muted-foreground italic">
            {pin.notes}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border/30">
          <button
            onClick={cycleProgress}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-70",
              progress.color
            )}
          >
            <ProgressIcon className="w-3.5 h-3.5" />
            {progress.label}
          </button>

          <span className="text-[11px] text-muted-foreground">
            {pin.pinned_by === sharedScope ? `${participants[0]} & ${participants[1]}` : pin.pinned_by}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
