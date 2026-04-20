import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  ChevronDown,
  ChevronUp,
  Eye,
  MessageCircle,
  Clock,
  AlertCircle,
  Lightbulb,
  TrendingUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface ObservableSignal {
  id: string;
  type: "verbal" | "conversational" | "engagement" | "contextual";
  signal: string;
  interpretation: string;
  suggestedResponse?: string;
  timestamp?: string;
}

interface SignalIntelligencePanelProps {
  signals: ObservableSignal[];
  isLoading?: boolean;
  hasActivity?: boolean;
  compact?: boolean;
}

const signalTypeConfig = {
  verbal: {
    label: "Verbal",
    icon: MessageCircle,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30"
  },
  conversational: {
    label: "Conversational",
    icon: MessageCircle,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30"
  },
  engagement: {
    label: "Engagement",
    icon: Eye,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30"
  },
  contextual: {
    label: "Contextual",
    icon: Clock,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30"
  }
};

function getSafeSignalType(type: unknown): ObservableSignal["type"] {
  if (type === "verbal" || type === "conversational" || type === "engagement" || type === "contextual") {
    return type;
  }
  return "contextual";
}

function getSignalConfig(type: unknown) {
  return signalTypeConfig[getSafeSignalType(type)];
}

function SignalCard({ signal }: { signal: ObservableSignal }) {
  const config = getSignalConfig((signal as any)?.type) ?? signalTypeConfig.contextual;
  const Icon = config.icon ?? TrendingUp;
  const signalText = (signal as any)?.signal ?? "";
  const interpretationText = (signal as any)?.interpretation ?? "";
  const suggestedResponseText = (signal as any)?.suggestedResponse;

  // Defensive guard: skip rendering if signal has no meaningful content
  if (!signalText && !interpretationText) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border p-3 ${config.bgColor} ${config.borderColor}`}
    >
      <div className="flex items-start gap-2">
        <Icon className={`h-4 w-4 mt-0.5 ${config.color} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={`text-xs py-0 ${config.color}`}>
              {config.label}
            </Badge>
          </div>
          {signalText && <p className="text-sm font-medium">{signalText}</p>}
          {interpretationText && <p className="text-xs text-muted-foreground mt-1">{interpretationText}</p>}
          {suggestedResponseText && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-primary">
              <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{suggestedResponseText}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function SignalIntelligencePanel({
  signals,
  isLoading,
  hasActivity,
  compact = false
}: SignalIntelligencePanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasSignals = signals.length > 0;

  if (!hasActivity && !hasSignals) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-medium">Signal Intelligence</h4>
        </div>
        <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
          <Radio className="h-8 w-8 mb-2 opacity-30" />
          <p className="text-xs">
            Observable signals will appear<br />as the conversation progresses
          </p>
        </div>
      </div>
    );
  }

  if (isLoading && !hasSignals) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary animate-pulse" />
          <h4 className="text-sm font-medium">Detecting signals...</h4>
        </div>
        <div className="space-y-2">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const recentSignals = compact ? signals.slice(-3) : signals;
  // Filter out any signals that don't have meaningful content
  const validSignals = recentSignals.filter(s => 
    (s?.signal && String(s.signal).trim()) || 
    (s?.interpretation && String(s.interpretation).trim())
  );

  // If after filtering we have no valid signals, show appropriate empty state
  if (validSignals.length === 0 && hasActivity) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-medium">Signal Intelligence</h4>
        </div>
        <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
          <Radio className="h-8 w-8 mb-2 opacity-30" />
          <p className="text-xs">
            No significant behavioral signals detected yet.<br />Continue the conversation naturally.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-medium">Signal Intelligence</h4>
          {validSignals.length > 0 && (
            <Badge variant="secondary" className="text-xs py-0">
              {validSignals.length} detected
            </Badge>
          )}
        </div>
        {!compact && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid="button-toggle-signals"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      <AnimatePresence>
        {(isExpanded || compact) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2">
              {validSignals.map((signal, index) => (
                <SignalCard key={signal.id || index} signal={signal} />
              ))}
            </div>

            {!compact && validSignals.length > 3 && (
              <div className="text-xs text-muted-foreground text-center mt-2">
                Showing most recent 3 signals
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
            <AlertCircle className="h-3 w-3" />
            <span>Observable signals only</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">
            Signal Intelligence observes verbal, conversational, and engagement cues.
            These are interpretive hypotheses, not definitive conclusions about
            emotional state, personality, or intent.
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function SignalBadge({ signal }: { signal: ObservableSignal }) {
  const config = getSignalConfig((signal as any)?.type) ?? signalTypeConfig.contextual;
  const Icon = config.icon ?? TrendingUp;
  const signalText = (signal as any)?.signal ?? "";
  const interpretationText = (signal as any)?.interpretation ?? "";
  const suggestedResponseText = (signal as any)?.suggestedResponse;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className={`text-xs py-0.5 cursor-help ${config.color} ${config.borderColor}`}
        >
          <Icon className="h-3 w-3 mr-1" />
          {signalText}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-xs font-medium mb-1">{config.label} Signal</p>
        <p className="text-xs text-muted-foreground">{interpretationText}</p>
        {suggestedResponseText && (
          <p className="text-xs text-primary mt-1">
            <Lightbulb className="h-3 w-3 inline mr-1" />
            {suggestedResponseText}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
