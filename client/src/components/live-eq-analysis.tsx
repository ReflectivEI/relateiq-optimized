import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingUp, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EQMetricCard } from "./eq-metric-card";
import { eqMetrics, getPerformanceLevel, type EQMetric } from "@/lib/data";

export interface EQScore {
  metricId: string;
  score: number;
  maxScore: number;
  feedback?: string;
}

export interface EQAnalysisResult {
  scores: EQScore[];
  overallScore: number;
  summary?: string;
  timestamp: string;
}

interface LiveEQAnalysisProps {
  analysis: EQAnalysisResult | null;
  isLoading?: boolean;
  hasMessages?: boolean;
}

function getOverallColor(score: number): string {
  const level = getPerformanceLevel(score);
  return level.color;
}

function getOverallBgColor(score: number): string {
  const level = getPerformanceLevel(score);
  return level.bgColor;
}

export function LiveEQAnalysis({ analysis, isLoading, hasMessages }: LiveEQAnalysisProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getScoreForMetric = (metricId: string): EQScore | undefined => {
    return analysis?.scores.find(s => s.metricId === metricId);
  };

  // Group metrics in two rows as shown in the screenshot
  const topRow = ["empathy", "clarity", "compliance", "discovery", "objection-handling"];
  const bottomRow = ["confidence", "active-listening", "adaptability", "action-insight", "resilience"];

  // Empty state - no messages yet
  if (!hasMessages && !analysis) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Live EI Analysis</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          <Sparkles className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">
            EI analysis will appear as you progress<br />through the conversation
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && !analysis) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <h3 className="font-semibold">Analyzing...</h3>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with overall score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Live EI Analysis</h3>
          {analysis && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`flex items-center gap-2 px-2 py-0.5 rounded-full ${getOverallBgColor(analysis.overallScore)}`}
            >
              <TrendingUp className={`h-3 w-3 ${getOverallColor(analysis.overallScore)}`} />
              <span className={`text-sm font-bold ${getOverallColor(analysis.overallScore)}`}>
                {analysis.overallScore.toFixed(1)}/5
              </span>
              <Badge variant="outline" className={`text-xs py-0 ${getOverallColor(analysis.overallScore)}`}>
                {getPerformanceLevel(analysis.overallScore).label}
              </Badge>
            </motion.div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          data-testid="button-toggle-eq-panel"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3">
              {/* Metrics Grid - Top Row */}
              <div className="grid grid-cols-5 gap-2">
                {topRow.map(metricId => {
                  const metric = eqMetrics.find(m => m.id === metricId);
                  if (!metric) return null;
                  return (
                    <EQMetricCard
                      key={metric.id}
                      metric={metric}
                      score={getScoreForMetric(metric.id)}
                      isLoading={isLoading}
                    />
                  );
                })}
              </div>

              {/* Metrics Grid - Bottom Row */}
              <div className="grid grid-cols-5 gap-2">
                {bottomRow.map(metricId => {
                  const metric = eqMetrics.find(m => m.id === metricId);
                  if (!metric) return null;
                  return (
                    <EQMetricCard
                      key={metric.id}
                      metric={metric}
                      score={getScoreForMetric(metric.id)}
                      isLoading={isLoading}
                    />
                  );
                })}
              </div>

              {/* Summary feedback */}
              {analysis?.summary && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-muted/50 border"
                >
                  <p className="text-sm text-muted-foreground">
                    {analysis.summary}
                  </p>
                </motion.div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs py-0">
                    EI rubric v2.0
                  </Badge>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="flex items-center gap-1 hover:text-primary transition-colors">
                        <Info className="h-3 w-3" />
                        scoring guide
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="text-xs space-y-2">
                        <p>
                          <strong>EI Scoring (1-5 scale):</strong> Measures demonstrated capability through observable behaviors.
                        </p>
                        <div className="space-y-0.5">
                          <p className="text-green-600">4.5-5.0: Exceptional</p>
                          <p className="text-blue-600">3.5-4.4: Strong</p>
                          <p className="text-yellow-600">2.5-3.4: Developing</p>
                          <p className="text-orange-600">1.5-2.4: Emerging</p>
                          <p className="text-red-600">1.0-1.4: Needs Focus</p>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
                {analysis && (
                  <span className="text-xs opacity-50">
                    Updated: {new Date(analysis.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact version for sidebar or smaller spaces
interface CompactEQAnalysisProps {
  analysis: EQAnalysisResult | null;
  isLoading?: boolean;
  hasMessages?: boolean;
}

export function CompactEQAnalysis({ analysis, isLoading, hasMessages }: CompactEQAnalysisProps) {
  // Get top 3 and bottom 3 scores
  const sortedScores = [...(analysis?.scores || [])].sort((a, b) => b.score - a.score);
  const topScores = sortedScores.slice(0, 3);
  const bottomScores = sortedScores.slice(-3).reverse();
  const hasAnalysis = analysis !== null && analysis !== undefined;

  // Empty state
  if (!hasMessages && !hasAnalysis) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-medium">Live EI Analysis</h4>
        </div>
        <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
          <Sparkles className="h-8 w-8 mb-2 opacity-30" />
          <p className="text-xs">
            EI analysis will appear as you progress through the conversation
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && !hasAnalysis) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <h4 className="text-sm font-medium">Analyzing...</h4>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-medium">Live EI Analysis</h4>
        </div>
        {analysis && (
          <Badge 
            variant="outline" 
            className={`text-xs ${getOverallColor(analysis.overallScore)}`}
          >
            {analysis.overallScore.toFixed(1)}/5
          </Badge>
        )}
      </div>

      {analysis && (
        <div className="space-y-2">
          {/* Show all metrics in a compact grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {analysis.scores.map(score => {
              const metric = eqMetrics.find(m => m.id === score.metricId);
              if (!metric) return null;
              return (
                <EQMetricCard
                  key={metric.id}
                  metric={metric}
                  score={score}
                  isLoading={isLoading}
                />
              );
            })}
          </div>

          <div className="text-xs text-muted-foreground text-center pt-1">
            <Badge variant="outline" className="text-xs py-0">
              EI rubric v2.0
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
