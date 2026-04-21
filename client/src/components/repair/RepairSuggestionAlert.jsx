/**
 * RepairSuggestionAlert — Push-style dashboard alert for repair bids.
 * Shows when friction is detected. Displays 3 Gottman-style repair bids
 * targeted at the partner less likely to initiate resolution.
 */
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartHandshake, X, ChevronDown, ChevronUp, Copy, AlertTriangle, Loader2, Waves, Heart, Wrench, ThumbsUp } from "lucide-react";

const BID_TYPE_ICONS = {
  de_escalation: Waves,
  reconnection: Heart,
  repair_attempt: Wrench,
  validation: ThumbsUp,
};
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GOTTMAN_BID_TYPES } from "@/lib/repairSuggestionEngine";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const URGENCY_STYLES = {
  high: "border-red-200 bg-red-50",
  medium: "border-amber-200 bg-amber-50/60",
  low: "border-primary/20 bg-primary/5",
};

const URGENCY_BADGE = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-primary/10 text-primary border-primary/20",
};

const DELIVERY_LABELS = {
  verbal: "Say it",
  text: "Send as text",
  action: "Do this",
};

function BidCard({ bid, index }) {
  const [expanded, setExpanded] = useState(index === 0); // first bid open by default
  const bidType = GOTTMAN_BID_TYPES[bid.type] || GOTTMAN_BID_TYPES.reconnection;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(bid.bid);
    toast.success("Copied to clipboard");
  };

  return (
    <div className={cn("rounded-xl border overflow-hidden", bidType.color)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-80 transition-opacity"
      >
        {React.createElement(BID_TYPE_ICONS[bid.type] || HeartHandshake, { className: "w-4 h-4 shrink-0 opacity-70" })}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
              Bid {bid.id} · {bidType.label}
            </span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded border font-medium",
              bid.effort === "low" ? "bg-green-100 border-green-300 text-green-700" : "bg-yellow-100 border-yellow-300 text-yellow-700"
            )}>
              {bid.effort === "low" ? "Easy" : "Medium effort"}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded border bg-white/60 border-current/20 font-medium opacity-70">
              {DELIVERY_LABELS[bid.delivery] || bid.delivery}
            </span>
          </div>
          {!expanded && (
            <p className="text-sm font-medium mt-0.5 line-clamp-1">"{bid.bid}"</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-white/40 transition-colors"
            title="Copy bid"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 opacity-50" /> : <ChevronDown className="w-4 h-4 opacity-50" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-current/10">
              {/* The bid itself */}
              <blockquote className="mt-3 text-sm font-medium leading-relaxed border-l-2 border-current/30 pl-3">
                "{bid.bid}"
              </blockquote>

              {/* Why this works */}
              <p className="text-xs opacity-70 leading-relaxed">{bid.why}</p>

              {/* Gottman principle */}
              {bid.gottman_principle && (
                <div className="flex items-start gap-1.5 text-xs opacity-60">
                  <span className="font-semibold shrink-0">Gottman:</span>
                  <span>{bid.gottman_principle}</span>
                </div>
              )}

              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1.5 bg-white/50 border-current/20"
                onClick={handleCopy}
              >
                <Copy className="w-3 h-3" /> Copy this bid
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RepairSuggestionAlert({ suggestion, loading, onDismiss, onRefresh }) {
  const [minimized, setMinimized] = useState(false);

  if (loading) {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Scanning for repair opportunities...</p>
          <p className="text-xs text-muted-foreground mt-0.5">Analyzing check-ins, sessions, and repair history</p>
        </div>
      </div>
    );
  }

  if (!suggestion) return null;

  const urgencyStyle = URGENCY_STYLES[suggestion.urgency] || URGENCY_STYLES.medium;
  const urgencyBadge = URGENCY_BADGE[suggestion.urgency] || URGENCY_BADGE.medium;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn("rounded-xl border overflow-hidden", urgencyStyle)}
    >
      {/* Alert Header */}
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center shrink-0 mt-0.5">
          <HeartHandshake className="w-4 h-4 text-foreground/70" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">Repair Opportunity Detected</p>
            <Badge className={cn("text-[10px] border font-medium", urgencyBadge)}>
              {suggestion.urgency === "high" ? "High friction" : suggestion.urgency === "medium" ? "Moderate tension" : "Low tension"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Suggested initiator: <span className="font-semibold text-foreground">{suggestion.suggested_initiator}</span>
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setMinimized(!minimized)}
            className="p-1.5 rounded hover:bg-white/40 transition-colors text-muted-foreground"
            title={minimized ? "Expand" : "Minimize"}
          >
            {minimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded hover:bg-white/40 transition-colors text-muted-foreground"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!minimized && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-current/10">
              {/* Friction summary */}
              <p className="text-sm text-foreground/80 leading-relaxed pt-3">
                {suggestion.friction_summary}
              </p>

              {/* Why this person */}
              <div className="text-xs text-muted-foreground bg-white/40 rounded-lg px-3 py-2 leading-relaxed">
                <span className="font-semibold">Why {suggestion.suggested_initiator}?</span> {suggestion.initiator_reasoning}
              </div>

              {/* Friction signals */}
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Signals detected</p>
                {suggestion.friction_signals.map((s, i) => (
                  <div key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                    {s}
                  </div>
                ))}
              </div>

              {/* 3 Repair bids */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  3 Repair Bids for {suggestion.suggested_initiator}
                </p>
                {suggestion.repair_bids.map((bid, i) => (
                  <BidCard key={bid.id || i} bid={bid} index={i} />
                ))}
              </div>

              {/* What to avoid */}
              {suggestion.what_to_avoid && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-white/40 border border-orange-200/60">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-semibold text-orange-700">Avoid right now: </span>
                    <span className="text-foreground/70">{suggestion.what_to_avoid}</span>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                <p className="text-[10px] text-muted-foreground/60">
                  Based on Gottman repair research · {new Date(suggestion.generated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                {onRefresh && (
                  <button
                    onClick={onRefresh}
                    className="text-[11px] text-primary hover:text-primary/80 underline-offset-2 hover:underline"
                  >
                    Refresh
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}