import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, X, BookOpen, Lightbulb, Calculator, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  type EQMetric, 
  getPerformanceLevel, 
  getScoreColor as getScoreColorFromData, 
  getScoreBgColor as getScoreBgColorFromData 
} from "@/lib/data";

interface EQScore {
  metricId: string;
  score: number;
  maxScore: number;
  feedback?: string;
}

interface EQMetricCardProps {
  metric: EQMetric;
  score?: EQScore;
  isLoading?: boolean;
}

function getScoreColor(score: number, maxScore: number): string {
  return getScoreColorFromData(score);
}

function getScoreBgColor(score: number, maxScore: number): string {
  return getScoreBgColorFromData(score);
}

export function EQMetricCard({ metric, score, isLoading }: EQMetricCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const displayScore = score?.score ?? 0;
  const maxScore = score?.maxScore ?? 5;

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          relative cursor-pointer rounded-lg border p-3 transition-colors
          hover-elevate
          ${score ? getScoreBgColor(displayScore, maxScore) : "bg-muted/30 border-border"}
        `}
        onClick={() => setIsOpen(true)}
        data-testid={`eq-metric-card-${metric.id}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">
                {metric.displayName || metric.name}
              </span>
              <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            </div>
            <div className="flex items-baseline gap-0.5 mt-1">
              {isLoading ? (
                <div className="h-8 w-12 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <span className={`text-2xl font-bold ${score ? getScoreColor(displayScore, maxScore) : "text-muted-foreground"}`}>
                    {displayScore}
                  </span>
                  <span className="text-sm text-muted-foreground">/{maxScore}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <div 
              className="h-1.5 w-full rounded-full mb-4" 
              style={{ background: `linear-gradient(90deg, ${metric.color} 0%, ${metric.color}80 100%)` }}
            />
            <div className="flex items-center gap-2">
              <DialogTitle className="text-xl font-bold">{metric.displayName || metric.name}</DialogTitle>
              {score && (
                <Badge className={`${getScoreBgColor(displayScore, maxScore)} ${getScoreColor(displayScore, maxScore)} border-0`}>
                  {getPerformanceLevel(displayScore).label}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {metric.description}
            </p>
          </DialogHeader>

          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              {/* Calculation Section */}
              <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
                  <Calculator className="h-4 w-4" />
                  Calculation
                </div>
                <p className="text-sm italic text-foreground/80">
                  {metric.calculation}
                </p>
              </div>

              {/* Sample Indicators */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Sample Indicators
                </h4>
                <div className="h-px bg-gradient-to-r from-green-500/50 to-transparent mb-3" />
                <ul className="space-y-2">
                  {metric.sampleIndicators.map((indicator, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + idx * 0.05 }}
                      className="text-sm text-foreground/80 flex items-start gap-2"
                    >
                      <span className="text-muted-foreground mt-1">•</span>
                      {indicator}
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Key Tip */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 p-3"
              >
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-cyan-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm italic text-cyan-700 dark:text-cyan-300">
                    {metric.keyTip}
                  </p>
                </div>
              </motion.div>

              {/* What Good Looks Like */}
              {score && displayScore < maxScore && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="rounded-lg bg-muted/50 p-3"
                >
                  <h4 className="font-semibold text-sm mb-1">What Good Looks Like</h4>
                  <p className="text-sm text-muted-foreground">
                    {metric.whatGoodLooksLike}
                  </p>
                </motion.div>
              )}

              {/* Learn More */}
              {metric.learnMoreLink && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    <BookOpen className="h-4 w-4" />
                    LEARN MORE
                  </div>
                  <a
                    href={metric.learnMoreLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    data-testid={`link-learn-more-${metric.id}`}
                  >
                    Emotional Intelligence in AI Sales Agents
                    <ChevronRight className="h-3 w-3" />
                  </a>
                </motion.div>
              )}

              {/* Got it button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="flex justify-end pt-2"
              >
                <Button
                  onClick={() => setIsOpen(false)}
                  className="px-6"
                  style={{ backgroundColor: metric.color }}
                  data-testid={`button-got-it-${metric.id}`}
                >
                  Got it!
                </Button>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Summary grid component for displaying all metrics
interface EQScoreSummaryProps {
  scores: EQScore[];
  isLoading?: boolean;
}

export function EQScoreSummary({ scores, isLoading }: EQScoreSummaryProps) {
  // Import metrics dynamically to avoid circular dependency
  const { eqMetrics } = require("@/lib/data");

  const getScoreForMetric = (metricId: string) => {
    return scores.find(s => s.metricId === metricId);
  };

  // Group metrics in two rows as shown in the screenshot
  const topRow = ["empathy", "clarity", "compliance", "discovery", "objection-handling"];
  const bottomRow = ["confidence", "active-listening", "adaptability", "action-insight", "resilience"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Emotional Intelligence Summary</h3>
        <Badge variant="outline" className="text-xs">
          EI rubric v2.0
        </Badge>
      </div>
      
      <div className="space-y-2">
        {/* Top Row */}
        <div className="grid grid-cols-5 gap-2">
          {topRow.map(metricId => {
            const metric = eqMetrics.find((m: { id: string }) => m.id === metricId);
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
        
        {/* Bottom Row */}
        <div className="grid grid-cols-5 gap-2">
          {bottomRow.map(metricId => {
            const metric = eqMetrics.find((m: { id: string }) => m.id === metricId);
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
      </div>

      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <span>Scored via EI rubric v2.0</span>
        <span>•</span>
        <button className="text-primary hover:underline" data-testid="link-scoring-guide">
          scoring guide
        </button>
        <span>•</span>
        <button className="text-primary hover:underline" data-testid="link-view-details">
          view details
        </button>
      </div>
    </div>
  );
}
