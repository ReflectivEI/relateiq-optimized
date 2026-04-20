import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Activity, Info, CheckCircle2, X, Radio } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { readEnabledEIMetricIds, writeEnabledEIMetricIds } from "@/lib/eiMetricSettings";
import { 
  eqMetrics, 
  getPerformanceLevel, 
  getScoreColor, 
  getScoreBgColor,
  performanceLevels,
  type EQMetric 
} from "@/lib/data";

interface MetricWithScore extends EQMetric {
  score: number;
  signalsCaptured?: number;
  totalSignals?: number;
  enabled?: boolean;
}

const coreMetricsWithScores: MetricWithScore[] = eqMetrics
  .filter(m => m.isCore)
  .map(m => ({
    ...m,
    score: m.id === "empathy" ? 4.2 : m.id === "clarity" ? 4.5 : m.id === "discovery" ? 3.8 : 4.0,
    signalsCaptured: m.id === "empathy" ? 7 : m.id === "clarity" ? 11 : m.id === "discovery" ? 7 : 17,
    totalSignals: m.id === "empathy" ? 8 : m.id === "clarity" ? 12 : m.id === "discovery" ? 9 : 20,
  }));

const extendedMetricsWithScores: MetricWithScore[] = eqMetrics
  .filter(m => !m.isCore)
  .map(m => ({
    ...m,
    score: m.id === "compliance" ? 5.0 : m.id === "active-listening" ? 4.3 : m.id === "objection-handling" ? 4.1 : 
           m.id === "confidence" ? 3.9 : m.id === "action-insight" ? 3.7 : 3.5,
    signalsCaptured: m.id === "compliance" ? 15 : m.id === "active-listening" ? 9 : m.id === "objection-handling" ? 17 :
                     m.id === "confidence" ? 8 : m.id === "action-insight" ? 9 : 7,
    totalSignals: m.id === "compliance" ? 15 : m.id === "active-listening" ? 10 : m.id === "objection-handling" ? 20 :
                  m.id === "confidence" ? 10 : m.id === "action-insight" ? 11 : 9,
    enabled: ["compliance", "active-listening", "objection-handling", "action-insight"].includes(m.id),
  }));

function MetricCard({ metric, onClick }: { metric: MetricWithScore; onClick: () => void }) {
  const performanceLevel = getPerformanceLevel(metric.score);
  const signalRate = metric.signalsCaptured && metric.totalSignals 
    ? Math.round((metric.signalsCaptured / metric.totalSignals) * 100) 
    : null;
  
  return (
    <div
      className={`rounded-xl p-5 cursor-pointer transition-all hover-elevate border ${getScoreBgColor(metric.score)}`}
      onClick={onClick}
      data-testid={`card-metric-${metric.id}`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {metric.displayName}
          </span>
          {metric.isCore && (
            <Badge variant="outline" className="text-xs py-0 bg-primary/10 text-primary border-primary/30">
              Core
            </Badge>
          )}
        </div>
        
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${getScoreColor(metric.score)}`}>
            {metric.score.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground">/5</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={`text-xs ${performanceLevel.bgColor} ${performanceLevel.color} border-0`}>
            {performanceLevel.label}
          </Badge>
          {signalRate !== null && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground flex items-center gap-1 cursor-help">
                  <Radio className="h-3 w-3" />
                  {signalRate}%
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Signal Capture Rate: {metric.signalsCaptured}/{metric.totalSignals} signals observed</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricDetailDialog({ metric, open, onOpenChange }: { 
  metric: MetricWithScore | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  if (!metric) return null;
  
  const performanceLevel = getPerformanceLevel(metric.score);
  const signalRate = metric.signalsCaptured && metric.totalSignals 
    ? Math.round((metric.signalsCaptured / metric.totalSignals) * 100) 
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{metric.displayName}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-2xl font-bold ${getScoreColor(metric.score)}`}>
                  {metric.score.toFixed(1)}/5
                </span>
                <Badge className={`${performanceLevel.bgColor} ${performanceLevel.color} border-0`}>
                  {performanceLevel.label}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Definition
            </h4>
            <p className="text-sm text-muted-foreground">{metric.description}</p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Scoring Method
            </h4>
            <div className="bg-muted/50 p-3 rounded-lg">
              <code className="text-sm font-mono">
                {metric.calculation}
              </code>
            </div>
          </div>

          {signalRate !== null && (
            <div>
              <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                <Radio className="h-4 w-4 text-primary" />
                Signal Capture Rate
              </h4>
              <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Signals captured:</span>
                  <span className="font-semibold">{metric.signalsCaptured}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total observable signals:</span>
                  <span className="font-semibold">{metric.totalSignals}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Capture rate:</span>
                    <code className={`text-sm font-bold px-2 py-1 rounded ${getScoreColor(metric.score)}`}>
                      {signalRate}%
                    </code>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Observable Indicators
            </h4>
            <ul className="space-y-1.5">
              {metric.sampleIndicators.map((indicator, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground flex-shrink-0" />
                  {indicator}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
            <h4 className="font-semibold text-sm mb-1">Key Tip</h4>
            <p className="text-sm text-muted-foreground italic">
              {metric.keyTip}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function EIMetricsPage() {
  const [selectedMetric, setSelectedMetric] = useState<MetricWithScore | null>(null);
  const [extendedMetricState, setExtendedMetricState] = useState<Record<string, boolean>>(() => {
    const defaults = extendedMetricsWithScores.reduce<Record<string, boolean>>(
      (acc, m) => ({ ...acc, [m.id]: m.enabled ?? false }),
      {}
    );
    const persisted = new Set(readEnabledEIMetricIds());
    if (persisted.size === 0) return defaults;
    const out: Record<string, boolean> = { ...defaults };
    for (const id of Object.keys(out)) {
      out[id] = persisted.has(id);
    }
    return out;
  });

  const toggleMetric = (id: string) => {
    setExtendedMetricState(prev => {
      const next = { ...prev, [id]: !prev[id] };
      const enabledIds = Object.entries(next)
        .filter(([, enabled]) => Boolean(enabled))
        .map(([metricId]) => metricId);
      writeEnabledEIMetricIds(enabledIds);
      return next;
    });
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold" data-testid="text-ei-metrics-title">EI Metrics</h1>
          </div>
          <p className="text-muted-foreground">
            Emotional Intelligence metrics measure <strong>demonstrated capability</strong> through observable behaviors.
            Click any metric to view its definition, scoring method, and coaching guidance.
          </p>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Layer 1 - Emotional Intelligence (Core Measurement)</p>
                <p className="text-sm text-muted-foreground">
                  EI refers to <strong>demonstrated capability</strong>: how effectively you perceive observable signals, 
                  interpret them in context, and adapt your communication. Metrics are scored 1-5 based on observable 
                  behaviors, not personality traits.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="font-medium">Performance Levels:</span>
          {Object.values(performanceLevels).map(level => (
            <span key={level.level} className={`flex items-center gap-1 ${level.color}`}>
              <span className={`w-2 h-2 rounded-full ${level.bgColor.replace('/10', '')}`} />
              {level.label} ({level.range})
            </span>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Core EI Metrics
              </h2>
              <p className="text-sm text-muted-foreground">
                These four metrics form the foundation of EI measurement across all coaching experiences
              </p>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/30">Always Active</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {coreMetricsWithScores.map((metric) => (
              <MetricCard 
                key={metric.id} 
                metric={metric} 
                onClick={() => setSelectedMetric(metric)}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Additional EI Metrics</h2>
              <p className="text-sm text-muted-foreground">
                Toggle metrics on/off based on your coaching priorities
              </p>
            </div>
            <Badge variant="outline">Configurable</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {extendedMetricsWithScores.map((metric) => {
              const isEnabled = extendedMetricState[metric.id];
              const performanceLevel = getPerformanceLevel(metric.score);
              
              return (
                <div
                  key={metric.id}
                  className={`rounded-xl border p-4 transition-all ${isEnabled ? 'opacity-100' : 'opacity-50'} ${getScoreBgColor(metric.score)}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div 
                      className="flex-1 cursor-pointer" 
                      onClick={() => setSelectedMetric({...metric, enabled: isEnabled})}
                    >
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {metric.displayName}
                      </span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className={`text-2xl font-bold ${getScoreColor(metric.score)}`}>
                          {metric.score.toFixed(1)}
                        </span>
                        <span className="text-sm text-muted-foreground">/5</span>
                      </div>
                      <Badge className={`text-xs mt-2 ${performanceLevel.bgColor} ${performanceLevel.color} border-0`}>
                        {performanceLevel.label}
                      </Badge>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={() => toggleMetric(metric.id)}
                      data-testid={`switch-metric-${metric.id}`}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{metric.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <MetricDetailDialog
        metric={selectedMetric}
        open={!!selectedMetric}
        onOpenChange={(open) => !open && setSelectedMetric(null)}
      />
    </div>
  );
}
