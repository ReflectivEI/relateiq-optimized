/**
 * Coach.jsx — AI Coach: "Start a Conversation" Experience
 * Context-aware guidance with smart suggestions, multi-output modes, and predictive layer.
 * Routes through pipelineEngine → deterministic pattern analysis → AI Coach
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { pipelineEngine } from "@/lib/pipelineEngine";
import { handleError, validateInput, ERROR_TYPES } from "@/lib/errorBoundary";
import { globalState } from "@/lib/globalState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Sparkles,
  MessageCircle,
  Copy,
  AlertTriangle,
  Wrench,
  MapPin,
  Search,
  Pencil,
  Trash2,
  Waves,
  RefreshCw,
  MessageSquare,
  Clock3,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { buildCoachPrompt } from "@/lib/prompts";
import { safeInvokeLLM, buildFallbackCoachResponse, validateCoachOutput, CreditLimitError } from "@/lib/aiSafe";
import AILoadingState from "@/components/ui/AILoadingState";
import { serializeTriggers } from "@/lib/triggerService";
import CreditLimitBanner from "@/components/ui/CreditLimitBanner";
import DataSourceBadge from "@/components/ui/DataSourceBadge";
import PrivacyBanner from "@/components/ui/PrivacyBanner";
import { toast } from "sonner";
import CoachSuggestionPills from "@/components/coach/CoachSuggestionPills";
import { Slider } from "@/components/ui/slider";
import CoachOutputModes from "@/components/coach/CoachOutputModes";
import PredictiveOutcomeBlock from "@/components/coach/PredictiveOutcomeBlock";
import { computePatternProfile } from "@/lib/patternEngine";
import { predictOutcome } from "@/lib/predictiveEngine";
import { matchFrameworks } from "@/lib/frameworkEngine";
import TracePanel from "@/components/trace/TracePanel";
import ErrorFallback from "@/components/errors/ErrorFallback";
import ResponseExportBar from "@/components/export/ResponseExportBar";
import NotesPanel from "@/components/notes/NotesPanel";
import { enforceCoachStructure, deriveCoachModes } from "@/lib/coachStructureEnforcer";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import {
  buildActiveConnectionContext,
  buildActiveConnectionContextBlock,
  buildParticipantData,
  getForeignParticipantNames,
  getPartnerName,
  getRelationshipTerms,
  isTextVisibleForRelationshipContext,
  presentRelationshipText,
  validateOutputScope,
} from "@/lib/relationshipParticipants";

const SUGGESTION_PILLS = [
  { id: "handling_conflict", label: "Handling Conflict", icon: AlertTriangle, description: "Get grounded guidance before a hard conversation escalates." },
  { id: "repair_after_tension", label: "Repair After Tension", icon: Wrench, description: "Find the cleanest way to reconnect after friction or distance." },
  { id: "feel_misunderstood", label: "I Feel Misunderstood", icon: MessageSquare, description: "Clarify what landed wrong and how to say it more clearly." },
  { id: "they_feel_distant", label: "They Feel Distant", icon: MapPin, description: "Respond when the other person feels emotionally farther away." },
  { id: "something_felt_off", label: "Something Felt Off", icon: Search, description: "Make sense of a subtle moment that felt tense or unclear." },
  { id: "say_this_better", label: "I Want to Say This Better", icon: Pencil, description: "Rewrite a thought into language that is steadier and easier to receive." },
  { id: "overwhelmed_triggered", label: "I'm Overwhelmed / Triggered", icon: Waves, description: "Slow down and regulate before the next move." },
  { id: "repeating_pattern", label: "We Keep Repeating This Pattern", icon: RefreshCw, description: "Name the cycle and interrupt it with a better response." },
];

const COACH_FEEDBACK_OPTIONS = [
  { id: "helpful", label: "Helpful" },
  { id: "too_generic", label: "Too Generic" },
  { id: "too_long", label: "Too Long" },
  { id: "too_soft", label: "Too Soft" },
  { id: "too_direct", label: "Too Direct" },
];

function cleanSituationText(value) {
  if (!value || typeof value !== "string") return "";
  return value
    .replace(/\[[^\]]+\]\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildCoachEntryText(entry) {
  return Object.values(entry || {})
    .filter((value) => typeof value === "string")
    .join("\n");
}

function sanitizeCoachEntry(entry, participants, activeRelationship) {
  return Object.fromEntries(
    Object.entries(entry || {}).map(([key, value]) => [
      key,
      typeof value === "string" ? presentRelationshipText(value, participants, activeRelationship) : value,
    ]),
  );
}

function summarizeCoachSession(session) {
  const rawText = cleanSituationText(session?.situation);
  const text = rawText.length > 140 ? `${rawText.slice(0, 137)}...` : rawText;
  const lower = rawText.toLowerCase();

  let title = "Recent Coaching Request";
  let description = text || "A recent request for connection guidance.";

  if (lower.includes("repair") || lower.includes("reconnect")) {
    title = "Reconnection Support";
  } else if (lower.includes("misunderstood") || lower.includes("misheard") || lower.includes("dismissed")) {
    title = "Feeling Misunderstood";
  } else if (lower.includes("conflict") || lower.includes("tension")) {
    title = "Conflict Navigation";
  } else if (lower.includes("trigger") || lower.includes("overwhelmed")) {
    title = "Regulation Support";
  } else if (lower.includes("say") || lower.includes("phrase") || lower.includes("word")) {
    title = "Wording Support";
  } else if (session?.situation?.includes("[Questionnaire")) {
    title = "Questionnaire Follow-Up";
    description = rawText && rawText.toLowerCase() !== "hi"
      ? text
      : `A short follow-up started from ${session.speaker}'s questionnaire context.`;
  }

  if (!rawText || rawText.toLowerCase() === "hi") {
    description = `A brief coaching prompt was opened for ${session.speaker} speaking to ${session.speaking_to}.`;
  }

  return { title, description };
}

function normalizeParticipantSelection(value, participants, fallback) {
  if (typeof value === "string" && participants.includes(value)) return value;
  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();
    const match = participants.find((participant) => participant.toLowerCase() === normalizedValue);
    if (match) return match;
  }
  return fallback;
}

function resolveCoachTarget(speakerValue, targetValue, participants) {
  const normalizedParticipants = [...new Set((participants || []).map((person) => String(person || "").trim()).filter(Boolean))].slice(0, 2);
  const normalizedSpeaker = normalizeParticipantSelection(speakerValue, normalizedParticipants, normalizedParticipants[0] || "");
  const fallbackTarget = normalizedParticipants.length === 2 ? getPartnerName(normalizedSpeaker, normalizedParticipants) : "";
  const normalizedTarget = normalizeParticipantSelection(targetValue, normalizedParticipants, fallbackTarget);

  if (!normalizedSpeaker) {
    return { speaker: "", speakingTo: "" };
  }

  if (normalizedParticipants.length < 2) {
    return { speaker: normalizedSpeaker, speakingTo: "" };
  }

  if (!normalizedTarget || normalizedTarget === normalizedSpeaker) {
    return { speaker: normalizedSpeaker, speakingTo: fallbackTarget };
  }

  return { speaker: normalizedSpeaker, speakingTo: normalizedTarget };
}

function parseJsonObjectFromText(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch (_) {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  }
}

function isUsefulModeText(value) {
  return typeof value === "string" && value.trim().length >= 120;
}

function trimSessionText(value, max = 260) {
  const clean = cleanSituationText(value);
  if (!clean) return "";
  return clean.length > max ? `${clean.slice(0, max - 3)}...` : clean;
}

function summarizePredictiveEvidence(entries = []) {
  return entries
    .map((entry, index) => {
      const prediction = entry?.prediction || {};
      const methods = Array.isArray(prediction.methodologies)
        ? prediction.methodologies
          .map((method) => `${method.label} (${method.focus})`)
          .join("; ")
        : "No methodology tags";
      return [
        `${index + 1}. ${entry.scenario}`,
        `- risk: ${prediction.risk_level || "unknown"}${Number.isFinite(prediction.risk_score) ? ` (${prediction.risk_score}/100)` : ""}`,
        `- predicted_behavior: ${trimSessionText(prediction.predicted_behavior, 220)}`,
        `- likely_misinterpretation: ${trimSessionText(prediction.likely_misinterpretation, 220)}`,
        `- recommended_preemptive_action: ${trimSessionText(prediction.recommended_preemptive_action, 220)}`,
        `- methods: ${methods}`,
        `- rationale: ${trimSessionText(prediction.evidence_rationale, 220)}`,
      ].join("\n");
    })
    .join("\n\n");
}

function summarizeMethodologySources(entries = []) {
  const seen = new Set();
  const lines = [];
  for (const entry of entries) {
    const methods = Array.isArray(entry?.prediction?.methodologies) ? entry.prediction.methodologies : [];
    for (const method of methods) {
      const key = method?.id || method?.label;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      lines.push(`- ${method.label}: ${method.source}. Focus: ${method.focus}. Why selected: ${method.why_selected}`);
    }
  }
  return lines.join("\n");
}

function normalizeFeedbackHistory(entries = []) {
  if (!Array.isArray(entries)) return [];
  const seen = new Set();
  return entries
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => ({
      feedbackType: String(entry.feedbackType || entry.feedback_type || "helpful").trim() || "helpful",
      mode: String(entry.mode || "full").trim() || "full",
      methodologyIds: [...new Set((Array.isArray(entry.methodologyIds || entry.methodology_ids) ? (entry.methodologyIds || entry.methodology_ids) : []).map((id) => String(id || "").trim()).filter(Boolean))].slice(0, 12),
      createdAt: String(entry.createdAt || entry.created_date || new Date().toISOString()),
    }))
    .filter((entry) => {
      const key = `${entry.createdAt}::${entry.feedbackType}::${entry.mode}::${entry.methodologyIds.join(",")}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 40);
}

function normalizeMethodologyStats(stats = {}) {
  if (!stats || typeof stats !== "object") return {};
  return Object.fromEntries(
    Object.entries(stats)
      .map(([key, value]) => {
        const normalizedKey = String(key || "").trim();
        const source = value && typeof value === "object" ? value : {};
        const helpful = Number(source.helpful || 0) || 0;
        const corrective = Number(source.corrective || 0) || 0;
        const total = Math.max(Number(source.total || 0) || 0, helpful + corrective);
        const score = Number(source.score);
        return [normalizedKey, {
          helpful,
          corrective,
          total,
          score: Number.isFinite(score) ? score : (helpful + 1) / (helpful + corrective + 2),
        }];
      })
      .filter(([key]) => key),
  );
}

function feedbackDecayWeight(createdAt, halfLifeDays = 14) {
  const timestamp = new Date(createdAt).getTime();
  if (!Number.isFinite(timestamp)) return 0.25;
  const ageDays = Math.max(0, (Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  return Math.exp((-Math.log(2) * ageDays) / halfLifeDays);
}

function summarizeBayesianFeedbackTrends(feedbackHistory = []) {
  const history = normalizeFeedbackHistory(feedbackHistory);
  const categoryWeights = {
    helpful: 0,
    too_generic: 0,
    too_long: 0,
    too_soft: 0,
    too_direct: 0,
  };

  let helpfulAlpha = 1;
  let correctiveBeta = 1;
  for (const entry of history) {
    const weight = feedbackDecayWeight(entry.createdAt);
    if (entry.feedbackType === "helpful") {
      helpfulAlpha += weight;
    } else {
      correctiveBeta += weight;
    }
    if (Object.prototype.hasOwnProperty.call(categoryWeights, entry.feedbackType)) {
      categoryWeights[entry.feedbackType] += weight;
    }
  }

  const posteriorHelpful = helpfulAlpha / (helpfulAlpha + correctiveBeta);
  const specificityNeed = categoryWeights.too_generic / Math.max(1, helpfulAlpha + correctiveBeta);
  const brevityNeed = categoryWeights.too_long / Math.max(1, helpfulAlpha + correctiveBeta);
  const directnessNeed = categoryWeights.too_soft / Math.max(1, helpfulAlpha + correctiveBeta);
  const softnessNeed = categoryWeights.too_direct / Math.max(1, helpfulAlpha + correctiveBeta);

  return {
    posteriorHelpful: Number(posteriorHelpful.toFixed(3)),
    specificityNeed: Number(specificityNeed.toFixed(3)),
    brevityNeed: Number(brevityNeed.toFixed(3)),
    directnessNeed: Number(directnessNeed.toFixed(3)),
    softnessNeed: Number(softnessNeed.toFixed(3)),
    summaryLine: `Helpful posterior ${posteriorHelpful.toFixed(2)}. Push specificity ${specificityNeed.toFixed(2)}, brevity ${brevityNeed.toFixed(2)}, more directness ${directnessNeed.toFixed(2)}, more softness ${softnessNeed.toFixed(2)}.`,
  };
}

function computeMethodologyPreferences(methodologyStats = {}, feedbackHistory = []) {
  const normalizedStats = normalizeMethodologyStats(methodologyStats);
  const history = normalizeFeedbackHistory(feedbackHistory);
  const methods = new Set([
    ...Object.keys(normalizedStats),
    ...history.flatMap((entry) => entry.methodologyIds || []),
  ]);

  return [...methods]
    .map((methodId) => {
      let helpful = Number(normalizedStats[methodId]?.helpful || 0);
      let corrective = Number(normalizedStats[methodId]?.corrective || 0);

      for (const entry of history) {
        if (!(entry.methodologyIds || []).includes(methodId)) continue;
        const weight = feedbackDecayWeight(entry.createdAt, 10);
        if (entry.feedbackType === "helpful") helpful += weight;
        else corrective += weight;
      }

      const posterior = (helpful + 1) / (helpful + corrective + 2);
      return {
        id: methodId,
        weight: Number(posterior.toFixed(3)),
        helpful: Number(helpful.toFixed(2)),
        corrective: Number(corrective.toFixed(2)),
        evidence: Number((helpful + corrective).toFixed(2)),
      };
    })
    .filter((entry) => entry.evidence > 0)
    .sort((a, b) => b.weight - a.weight || b.evidence - a.evidence)
    .slice(0, 6);
}

function summarizeMethodologyPreferences(preferences = []) {
  if (!preferences.length) return "No learned methodology preference yet.";
  return preferences
    .map((entry) => `${entry.id}: weight ${entry.weight.toFixed(2)} from ${entry.evidence.toFixed(2)} weighted signals`)
    .join(" | ");
}

function extractMethodologyIdsFromPredictiveOutput(predictiveOutput) {
  const ids = (predictiveOutput?.scenarios || []).flatMap((entry) =>
    Array.isArray(entry?.prediction?.methodologies)
      ? entry.prediction.methodologies.map((method) => String(method?.id || "").trim()).filter(Boolean)
      : [],
  );
  return [...new Set(ids)].slice(0, 12);
}

function buildCounterfactualSimulatorSection(predictiveEvidence = [], methodologyPreferences = []) {
  if (!Array.isArray(predictiveEvidence) || predictiveEvidence.length === 0) return "";

  const rows = predictiveEvidence.map((entry) => {
    const prediction = entry?.prediction || {};
    const riskText = prediction.risk_level || "unknown";
    const riskScore = Number.isFinite(prediction.risk_score) ? ` (${prediction.risk_score}/100)` : "";
    return `### ${entry.scenario}
- Next 24h: ${trimSessionText(prediction.predicted_behavior, 200)}
- Next 7d: ${trimSessionText(prediction.likely_misinterpretation, 200)}
- Best lever: ${trimSessionText(prediction.recommended_preemptive_action, 200)}
- Risk: ${riskText}${riskScore}`;
  });

  const methodologyLine = methodologyPreferences.length
    ? `Preferred methodology weighting for this connection: ${summarizeMethodologyPreferences(methodologyPreferences)}.`
    : "Preferred methodology weighting for this connection is still stabilizing, so the simulator is using the full evidence blend.";

  return `## Counterfactual Simulator\n${rows.join("\n\n")}\n\n${methodologyLine}`;
}

function appendCounterfactualSection(text, predictiveEvidence = [], methodologyPreferences = []) {
  if (typeof text !== "string") return text;
  if (text.toLowerCase().includes("counterfactual simulator")) return text;
  const section = buildCounterfactualSimulatorSection(predictiveEvidence, methodologyPreferences);
  if (!section) return text;
  return `${text.trim()}\n\n${section}`.trim();
}

const COACH_MODE_LEARNING_KEY = "relateiq.coach.modeLearning.v1";

function getLearningStore() {
  try {
    const raw = localStorage.getItem(COACH_MODE_LEARNING_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function setLearningStore(nextStore) {
  try {
    localStorage.setItem(COACH_MODE_LEARNING_KEY, JSON.stringify(nextStore));
  } catch {
    // Ignore storage failures in private mode or quota pressure.
  }
}

function getLearningProfileKey(relationshipId, speaker, target) {
  return [relationshipId || "no-relationship", speaker || "unknown-speaker", target || "unknown-target"].join("::");
}

function getLearningSignals(relationshipId, speaker, target) {
  const store = getLearningStore();
  return store[getLearningProfileKey(relationshipId, speaker, target)] || {
    modeUsage: { full: 0, explain: 0, "60second": 0, action: 0, script: 0 },
    copiedByMode: { full: 0, explain: 0, "60second": 0, action: 0, script: 0 },
    feedbackSignals: { helpful: 0, too_generic: 0, too_long: 0, too_soft: 0, too_direct: 0 },
    recentSituations: [],
    successfulOpenings: [],
    feedbackHistory: [],
    methodologyStats: {},
    updatedAt: null,
  };
}

function updateLearningSignals(relationshipId, speaker, target, updater) {
  const store = getLearningStore();
  const key = getLearningProfileKey(relationshipId, speaker, target);
  const current = getLearningSignals(relationshipId, speaker, target);
  const next = updater(current) || current;
  store[key] = {
    ...next,
    updatedAt: new Date().toISOString(),
  };
  setLearningStore(store);
  return store[key];
}

function normalizeLearningSignalsShape(raw) {
  if (!raw || typeof raw !== "object") return null;

  const normalizeCounterMap = (value) => {
    const source = value && typeof value === "object" ? value : {};
    return {
      full: Number(source.full || 0) || 0,
      explain: Number(source.explain || 0) || 0,
      "60second": Number(source["60second"] || 0) || 0,
      action: Number(source.action || 0) || 0,
      script: Number(source.script || 0) || 0,
    };
  };

  return {
    modeUsage: normalizeCounterMap(raw.modeUsage || raw.mode_usage),
    copiedByMode: normalizeCounterMap(raw.copiedByMode || raw.copied_by_mode),
    feedbackSignals: {
      helpful: Number(raw?.feedbackSignals?.helpful || raw?.feedback_signals?.helpful || 0) || 0,
      too_generic: Number(raw?.feedbackSignals?.too_generic || raw?.feedback_signals?.too_generic || 0) || 0,
      too_long: Number(raw?.feedbackSignals?.too_long || raw?.feedback_signals?.too_long || 0) || 0,
      too_soft: Number(raw?.feedbackSignals?.too_soft || raw?.feedback_signals?.too_soft || 0) || 0,
      too_direct: Number(raw?.feedbackSignals?.too_direct || raw?.feedback_signals?.too_direct || 0) || 0,
    },
    recentSituations: Array.isArray(raw.recentSituations || raw.recent_situations)
      ? (raw.recentSituations || raw.recent_situations).filter(Boolean).slice(0, 8)
      : [],
    successfulOpenings: Array.isArray(raw.successfulOpenings || raw.successful_openings)
      ? (raw.successfulOpenings || raw.successful_openings).filter(Boolean).slice(0, 10)
      : [],
    feedbackHistory: normalizeFeedbackHistory(raw.feedbackHistory || raw.feedback_history),
    methodologyStats: normalizeMethodologyStats(raw.methodologyStats || raw.methodology_stats),
    updatedAt: raw.updatedAt || raw.updated_date || null,
  };
}

function mergeLearningSignals(localSignals, remoteSignals) {
  if (!remoteSignals) return localSignals;

  const mergedCounter = (localMap, remoteMap) => ({
    full: Math.max(Number(localMap?.full || 0), Number(remoteMap?.full || 0)),
    explain: Math.max(Number(localMap?.explain || 0), Number(remoteMap?.explain || 0)),
    "60second": Math.max(Number(localMap?.["60second"] || 0), Number(remoteMap?.["60second"] || 0)),
    action: Math.max(Number(localMap?.action || 0), Number(remoteMap?.action || 0)),
    script: Math.max(Number(localMap?.script || 0), Number(remoteMap?.script || 0)),
  });

  const mergeList = (localList, remoteList, limit) =>
    [...new Set([...(remoteList || []), ...(localList || [])].filter(Boolean))].slice(0, limit);

  const mergeFeedback = (localMap, remoteMap) => ({
    helpful: Math.max(Number(localMap?.helpful || 0), Number(remoteMap?.helpful || 0)),
    too_generic: Math.max(Number(localMap?.too_generic || 0), Number(remoteMap?.too_generic || 0)),
    too_long: Math.max(Number(localMap?.too_long || 0), Number(remoteMap?.too_long || 0)),
    too_soft: Math.max(Number(localMap?.too_soft || 0), Number(remoteMap?.too_soft || 0)),
    too_direct: Math.max(Number(localMap?.too_direct || 0), Number(remoteMap?.too_direct || 0)),
  });

  const mergeMethodologyStats = (localStats, remoteStats) => {
    const merged = {};
    const keys = new Set([...Object.keys(normalizeMethodologyStats(localStats)), ...Object.keys(normalizeMethodologyStats(remoteStats))]);
    for (const key of keys) {
      const local = normalizeMethodologyStats(localStats)[key] || { helpful: 0, corrective: 0, total: 0, score: 0.5 };
      const remote = normalizeMethodologyStats(remoteStats)[key] || { helpful: 0, corrective: 0, total: 0, score: 0.5 };
      const helpful = Math.max(local.helpful, remote.helpful);
      const corrective = Math.max(local.corrective, remote.corrective);
      const total = Math.max(local.total, remote.total, helpful + corrective);
      merged[key] = {
        helpful,
        corrective,
        total,
        score: Number((((helpful + 1) / (helpful + corrective + 2)) || 0.5).toFixed(3)),
      };
    }
    return merged;
  };

  return {
    modeUsage: mergedCounter(localSignals?.modeUsage, remoteSignals?.modeUsage),
    copiedByMode: mergedCounter(localSignals?.copiedByMode, remoteSignals?.copiedByMode),
    feedbackSignals: mergeFeedback(localSignals?.feedbackSignals, remoteSignals?.feedbackSignals),
    recentSituations: mergeList(localSignals?.recentSituations, remoteSignals?.recentSituations, 8),
    successfulOpenings: mergeList(localSignals?.successfulOpenings, remoteSignals?.successfulOpenings, 10),
    feedbackHistory: normalizeFeedbackHistory([...(remoteSignals?.feedbackHistory || []), ...(localSignals?.feedbackHistory || [])]),
    methodologyStats: mergeMethodologyStats(localSignals?.methodologyStats, remoteSignals?.methodologyStats),
    updatedAt: remoteSignals.updatedAt || localSignals?.updatedAt || null,
  };
}

async function getLearningSignalsHybrid(relationshipId, speaker, target) {
  const localSignals = getLearningSignals(relationshipId, speaker, target);
  if (!relationshipId || !speaker || !target) return localSignals;

  try {
    const envelope = await api.coachLearning.getState({
      relationship_id: relationshipId,
      speaker,
      target,
    });
    const remoteSignals = normalizeLearningSignalsShape(envelope?.learning || envelope);
    if (!remoteSignals) return localSignals;

    const merged = mergeLearningSignals(localSignals, remoteSignals);
    updateLearningSignals(relationshipId, speaker, target, () => merged);
    return merged;
  } catch {
    return localSignals;
  }
}

function trackLearningEventServer(payload) {
  if (!payload || !payload.relationship_id || !payload.speaker || !payload.target) return;

  api.coachLearning
    .trackEvent(payload)
    .then((envelope) => {
      const remoteSignals = normalizeLearningSignalsShape(envelope?.learning || envelope);
      if (!remoteSignals) return;
      updateLearningSignals(payload.relationship_id, payload.speaker, payload.target, (current) =>
        mergeLearningSignals(current, remoteSignals)
      );
    })
    .catch(() => null);
}

export default function Coach() {
  const { activeRelationshipId, activeRelationship, participants, relationships } = useRelationshipAuth();
  const activeParticipants = useMemo(
    () => [...new Set((participants || []).map((person) => String(person || "").trim()).filter(Boolean))].slice(0, 2),
    [participants],
  );
  const participantA = activeParticipants[0] || "";
  const participantB = activeParticipants[1] || "";
  const hiddenParticipantNames = useMemo(
    () => getForeignParticipantNames(relationships, activeParticipants),
    [relationships, activeParticipants],
  );
  const [speaker, setSpeaker] = useState(activeParticipants[0] || "");
  const [speakingTo, setSpeakingTo] = useState(activeParticipants[1] || "");
  const [situation, setSituation] = useState("");
  const [severity, setSeverity] = useState(3);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [outputMode, setOutputMode] = useState("full");
  const [baseResponse, setBaseResponse] = useState(null);
  const [coachModes, setCoachModes] = useState(null);
  const [creditError, setCreditError] = useState(false);
  const [refreshingModes, setRefreshingModes] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [predictiveOutput, setPredictiveOutput] = useState(null);
  const [selectedPill, setSelectedPill] = useState(null);
  const [pipelineTrace, setPipelineTrace] = useState(null);
  const [error, setError] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const responseRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (activeParticipants.length < 2) {
      setSpeaker(activeParticipants[0] || "");
      setSpeakingTo("");
      return;
    }

    setSpeaker(activeParticipants[0]);
    setSpeakingTo(activeParticipants[1]);
  }, [activeParticipants, activeRelationshipId]);

  useEffect(() => {
    const normalizedSpeaker = normalizeParticipantSelection(speaker, activeParticipants, activeParticipants[0]);
    if (normalizedSpeaker !== speaker) setSpeaker(normalizedSpeaker);

    const normalizedTarget = normalizeParticipantSelection(
      speakingTo,
      activeParticipants,
      getPartnerName(normalizedSpeaker, activeParticipants),
    );
    if (normalizedTarget !== speakingTo || normalizedTarget === normalizedSpeaker) {
      setSpeakingTo(getPartnerName(normalizedSpeaker, activeParticipants));
    }
  }, [activeParticipants, speaker, speakingTo]);

  const currentSelection = resolveCoachTarget(speaker, speakingTo, activeParticipants);
  const currentSpeaker = currentSelection.speaker;
  const currentSpeakingTo = currentSelection.speakingTo;
  const canSubmitCoach =
    activeParticipants.length >= 2 &&
    Boolean(currentSpeaker) &&
    Boolean(currentSpeakingTo) &&
    currentSpeaker !== currentSpeakingTo &&
    situation.trim().length >= 10;

  const { data: triggers = [] } = useQuery({
    queryKey: ["triggers-coach", activeRelationshipId],
    queryFn: () => api.entities.TriggerEntry.list(),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-coach", activeRelationshipId],
    queryFn: () => api.entities.UserProfile.list(),
  });

  const { data: pastSessions = [] } = useQuery({
    queryKey: ["coach-sessions", activeRelationshipId],
    queryFn: () => api.entities.CoachSession.list("-created_date", 20),
  });

  const { data: recentCheckIns = [] } = useQuery({
    queryKey: ["coach-checkins", activeRelationshipId],
    queryFn: () => api.entities.CheckIn.list("-created_date", 20),
  });

  const { data: tonyResponses = [] } = useQuery({
    queryKey: ["responses-coach-person-a", activeRelationshipId, participantA],
    queryFn: () => (participantA ? api.entities.QuestionnaireResponse.filter({ person_name: participantA }) : Promise.resolve([])),
    enabled: Boolean(participantA),
  });

  const { data: drewResponses = [] } = useQuery({
    queryKey: ["responses-coach-person-b", activeRelationshipId, participantB],
    queryFn: () => (participantB ? api.entities.QuestionnaireResponse.filter({ person_name: participantB }) : Promise.resolve([])),
    enabled: Boolean(participantB),
  });

  const { legacySlots } = buildParticipantData(
    participants,
    profiles,
    tonyResponses,
    drewResponses,
  );

  const safePastSessions = useMemo(
    () =>
      pastSessions
        .filter((entry) => isTextVisibleForRelationshipContext(buildCoachEntryText(entry), hiddenParticipantNames, activeRelationship))
        .map((entry) => sanitizeCoachEntry(entry, activeParticipants, activeRelationship))
        .filter((entry) => isTextVisibleForRelationshipContext(buildCoachEntryText(entry), hiddenParticipantNames, activeRelationship)),
    [pastSessions, hiddenParticipantNames, activeRelationship, activeParticipants],
  );

  const safeRecentCheckIns = useMemo(
    () =>
      recentCheckIns
        .filter((entry) => isTextVisibleForRelationshipContext(buildCoachEntryText(entry), hiddenParticipantNames, activeRelationship))
        .map((entry) => sanitizeCoachEntry(entry, activeParticipants, activeRelationship))
        .filter((entry) => isTextVisibleForRelationshipContext(buildCoachEntryText(entry), hiddenParticipantNames, activeRelationship)),
    [recentCheckIns, hiddenParticipantNames, activeRelationship, activeParticipants],
  );

  // Sync data to global state
  useEffect(() => {
    globalState.setState({
      tony: legacySlots.tony,
      drew: legacySlots.drew,
      tonyResponses: legacySlots.tonyResponses,
      drewResponses: legacySlots.drewResponses,
      triggers,
      checkIns: safeRecentCheckIns,
      coachSessions: safePastSessions,
    });
  }, [legacySlots, triggers, safeRecentCheckIns, safePastSessions]);

  const speakerProfile = profiles.find((p) => p.person_name === currentSpeaker);
  const targetProfile = profiles.find((p) => p.person_name === currentSpeakingTo);
  const speakerResponses = currentSpeaker === participantA ? tonyResponses : drewResponses;
  const targetResponses = currentSpeakingTo === participantA ? tonyResponses : drewResponses;
  const speakerPatternProfile = useMemo(
    () => computePatternProfile(currentSpeaker, speakerResponses),
    [currentSpeaker, speakerResponses],
  );
  const targetPatternProfile = useMemo(
    () => computePatternProfile(currentSpeakingTo, targetResponses),
    [currentSpeakingTo, targetResponses],
  );
  const terms = getRelationshipTerms(activeRelationship);

  const runCoachCall = async (situationText, overrides = {}) => {
    setError(null);
    setPipelineTrace(null);
    const normalizedParticipants = activeParticipants;
    const requestedSpeaker =
      overrides.speakerOverride ??
      currentSpeaker ??
      speaker;
    const requestedTarget =
      overrides.speakingToOverride ??
      currentSpeakingTo ??
      speakingTo;
    const repairedSelection = resolveCoachTarget(requestedSpeaker, requestedTarget, normalizedParticipants);
    const normalizedSpeaker = repairedSelection.speaker;
    const resolvedTarget = repairedSelection.speakingTo;

    if (normalizedSpeaker !== speaker) setSpeaker(normalizedSpeaker);
    if (resolvedTarget !== speakingTo) setSpeakingTo(resolvedTarget);

    try {
      if (normalizedParticipants.length < 2) {
        throw new Error(`We need both people in this ${terms.bond} before AI Coach can generate guidance.`);
      }
      if (!normalizedSpeaker || !resolvedTarget) {
        throw new Error("Please choose both people in this connection before asking AI Coach for guidance.");
      }
      if (normalizedSpeaker === resolvedTarget) {
        throw new Error(`The speaker and ${terms.counterpart} cannot be the same person.`);
      }
      validateInput({
        speaker: String(normalizedSpeaker),
        speakingTo: String(resolvedTarget),
        situation: situationText,
      });
    } catch (err) {
      const fallback = handleError(err, ERROR_TYPES.INVALID_INPUT);
      if (err instanceof Error && err.message) {
        fallback.message = err.message;
      }
      setError(fallback);
      return;
    }

    if (!normalizedSpeaker || !resolvedTarget || !situationText.trim()) return;

    setLoading(true);
    setResponse(null);
    setBaseResponse(null);
    setPredictiveOutput(null);
    setCreditError(false);

    try {
      const pipelineResult = await pipelineEngine.executePipeline({
        speaker: normalizedSpeaker,
        speakingTo: resolvedTarget,
        situation: situationText,
      });

      if (pipelineResult?.trace) {
        setPipelineTrace(pipelineResult.trace);
      }
      if (pipelineResult?.error) {
        console.warn("[Coach] deterministic pipeline error", pipelineResult.error);
      }
    } catch (err) {
      console.warn("[Coach] continuing without deterministic pipeline", err);
    }

    const triggerCtx = [
      serializeTriggers(triggers, normalizedSpeaker),
      serializeTriggers(triggers, resolvedTarget),
    ]
      .filter(Boolean)
      .join("\n\n");

    const prompt = buildCoachPrompt({
      speaker: normalizedSpeaker,
      speakingTo: resolvedTarget,
      situation: situationText,
      speakerProfile: profiles.find((p) => p.person_name === normalizedSpeaker),
      targetProfile: profiles.find((p) => p.person_name === resolvedTarget),
      speakerResponses: normalizedSpeaker === activeParticipants[0] ? tonyResponses : drewResponses,
      targetResponses: resolvedTarget === activeParticipants[0] ? tonyResponses : drewResponses,
      pastSessions: safePastSessions
        .filter((s) => s.speaker === normalizedSpeaker || s.speaking_to === normalizedSpeaker)
        .slice(0, 10),
    }) + (triggerCtx ? `\n\nTRIGGER MEMORY:\n${triggerCtx}` : "") + `\n\nSITUATION SEVERITY: ${severity}/5 (${["Very Low", "Low", "Moderate", "High", "Critical"][severity - 1]})\nCalibrate the tone, urgency, and directness of your guidance accordingly. ${severity >= 4 ? "High-stakes — be direct, specific, and action-focused." : severity <= 2 ? "Low-intensity — be exploratory, educational, and calm." : "Balanced — thorough but measured."}`;

    const scopeContext = buildActiveConnectionContext({
      pairId: activeRelationshipId,
      activeConnectionId: activeRelationshipId,
      activeRelationship,
      actorUser: normalizedSpeaker,
      targetUser: resolvedTarget,
      allowedPeople: activeParticipants,
      forbiddenPeople: hiddenParticipantNames,
      availableDataSources: [
        speakerProfile ? "speakerProfile" : "",
        targetProfile ? "targetProfile" : "",
        speakerResponses.length ? "speakerResponses" : "",
        targetResponses.length ? "targetResponses" : "",
        safePastSessions.length ? "coachSessions" : "",
      ].filter(Boolean),
    });

    if ((scopeContext.availableDataSources || []).length === 0) {
      setLoading(false);
      setResponse("Not enough information is available for this connection yet.");
      setBaseResponse("Not enough information is available for this connection yet.");
      setCoachModes(deriveCoachModes("Not enough information is available for this connection yet."));
      return;
    }

    const scopedPrompt = `${buildActiveConnectionContextBlock(scopeContext)}\n\n${prompt}`;

    let result;
    try {
      result = await safeInvokeLLM(
        {
          prompt: scopedPrompt,
          model: "claude_sonnet_4_6",
          partnerLanguage: { personName: normalizedSpeaker, partnerName: resolvedTarget },
        },
        35000,
        null,
        validateCoachOutput
      );
    } catch (err) {
      if (err instanceof CreditLimitError) {
        setCreditError(true);
        setLoading(false);
        return;
      }
      throw err;
    }

    if (!result) {
      result = buildFallbackCoachResponse(normalizedSpeaker, resolvedTarget, situationText);
    }

    let validation = validateOutputScope(result, scopeContext);
    if (!validation.ok) {
      const strictRetry = await safeInvokeLLM(
        {
          prompt: `${scopedPrompt}\n\nSTRICT REGENERATION RULES:\nA prior output was rejected for: ${validation.violations.join(", ")}.\nOnly mention allowedPeople and follow relationshipStatus language rules exactly.`,
          model: "claude_sonnet_4_6",
          partnerLanguage: { personName: normalizedSpeaker, partnerName: resolvedTarget },
        },
        35000,
        null,
        validateCoachOutput
      );
      validation = validateOutputScope(strictRetry, scopeContext);
      if (validation.ok) {
        result = strictRetry;
      } else {
        result = "This response could not be safely generated for the active connection. Please try again.";
      }
    }

    // ENFORCE STRUCTURE
    const structuredOutput = enforceCoachStructure(result, situationText);
    const fallbackModes = deriveCoachModes(structuredOutput);
    const actorResponses = normalizedSpeaker === activeParticipants[0] ? tonyResponses : drewResponses;
    const targetResolvedResponses = resolvedTarget === activeParticipants[0] ? tonyResponses : drewResponses;
    const actorPatternProfile = computePatternProfile(normalizedSpeaker, actorResponses);
    const targetPatternProfile = computePatternProfile(resolvedTarget, targetResolvedResponses);
    const predictiveEvidence = [
      {
        scenario: "If no one addresses this",
        prediction: predictOutcome({
          actor: normalizedSpeaker,
          target: resolvedTarget,
          scenarioText: `avoidance: ${situationText}`,
          actorTraits: actorPatternProfile?.traits || {},
          targetTraits: targetPatternProfile?.traits || {},
        }),
      },
      {
        scenario: "If the next response is reactive",
        prediction: predictOutcome({
          actor: normalizedSpeaker,
          target: resolvedTarget,
          scenarioText: `reactive escalation: ${situationText}`,
          actorTraits: actorPatternProfile?.traits || {},
          targetTraits: targetPatternProfile?.traits || {},
        }),
      },
      {
        scenario: "If guidance is applied intentionally",
        prediction: predictOutcome({
          actor: normalizedSpeaker,
          target: resolvedTarget,
          scenarioText: `intentional repair: ${situationText}`,
          actorTraits: actorPatternProfile?.traits || {},
          targetTraits: targetPatternProfile?.traits || {},
        }),
      },
    ];
    setPredictiveOutput({ scenarios: predictiveEvidence, computed_at: new Date().toISOString() });

    const buildAdaptiveModes = async () => {
      const learningSignals = await getLearningSignalsHybrid(activeRelationshipId, normalizedSpeaker, resolvedTarget);
      const actorTraits = actorPatternProfile?.traits || {};
      const targetTraits = targetPatternProfile?.traits || {};
      const feedbackTrendSummary = summarizeBayesianFeedbackTrends(learningSignals.feedbackHistory || []);
      const methodologyPreferences = computeMethodologyPreferences(
        learningSignals.methodologyStats || {},
        learningSignals.feedbackHistory || [],
      );

      const scenarioHint = predictiveEvidence[2]?.prediction?.trace?.scenario_id || predictiveEvidence[0]?.prediction?.trace?.scenario_id || null;
      const frameworkMatches = matchFrameworks({
        traits: actorTraits,
        other_traits: targetTraits,
        scenario_id: scenarioHint,
        patterns: [],
        perspective: `${normalizedSpeaker}→${resolvedTarget}`,
        lgbtq_context: false,
      });

      setPredictiveOutput({
        scenarios: predictiveEvidence,
        frameworks: frameworkMatches,
        methodologyPreferences,
        feedbackTrendSummary,
        computed_at: new Date().toISOString(),
      });

      const recentSessionEvidence = safePastSessions
        .filter((s) => s.speaker === normalizedSpeaker || s.speaking_to === normalizedSpeaker)
        .slice(0, 8)
        .map((s, index) => `${index + 1}. ${s.speaker} -> ${s.speaking_to}: ${trimSessionText(s.situation)}`)
        .join("\n");

      const checkInEvidence = safeRecentCheckIns
        .filter((c) => c.person_name === normalizedSpeaker || c.person_name === resolvedTarget)
        .slice(0, 6)
        .map((c, index) => `${index + 1}. ${c.person_name}: mood=${c.mood || "n/a"}, worked="${trimSessionText(c.what_worked, 120)}", improve="${trimSessionText(c.what_could_improve, 120)}"`)
        .join("\n");

      const adaptivePrompt = `${buildActiveConnectionContextBlock(scopeContext)}

You are generating specialized output modes for RelateIQ AI Coach.
Use all available relationship evidence and avoid generic language.

CURRENT SITUATION
- Speaker: ${normalizedSpeaker}
- Speaking to: ${resolvedTarget}
- Severity: ${severity}/5
- Situation text: ${situationText}

PROFILE AND QUESTIONNAIRE EVIDENCE
- ${normalizedSpeaker} profile summary: ${speakerProfile?.ai_behavioral_summary || "Not available"}
- ${resolvedTarget} profile summary: ${targetProfile?.ai_behavioral_summary || "Not available"}
- ${normalizedSpeaker} questionnaire count: ${speakerResponses.length}
- ${resolvedTarget} questionnaire count: ${targetResponses.length}

RECENT COACH SESSIONS
${recentSessionEvidence || "None"}

RECENT CHECK-IN SIGNALS
${checkInEvidence || "None"}

LEARNING SIGNALS FROM THIS CONNECTION
- Mode usage counts: ${JSON.stringify(learningSignals.modeUsage || {})}
- Copy/save preference counts: ${JSON.stringify(learningSignals.copiedByMode || {})}
- Explicit feedback counts: ${JSON.stringify(learningSignals.feedbackSignals || {})}
- Bayesian recency-weighted trend summary: ${feedbackTrendSummary.summaryLine}
- Recent situations where coaching was requested: ${(learningSignals.recentSituations || []).join(" | ") || "None"}
- Openings that were previously copied/saved most often: ${(learningSignals.successfulOpenings || []).join(" | ") || "None"}
- Methodology preferences learned for this connection: ${summarizeMethodologyPreferences(methodologyPreferences)}

PREDICTIVE EVIDENCE (DETERMINISTIC, METHOD-BLENDED)
${summarizePredictiveEvidence(predictiveEvidence)}

METHODOLOGY SOURCES TO INTEGRATE
${summarizeMethodologySources(predictiveEvidence) || "- Gottman Method, EFT, CBT, DBT, NVC, and Polyvagal-informed state regulation"}

FRAMEWORK MATCHES FOR THIS SPECIFIC CONTEXT
${frameworkMatches.map((item) => `- ${item.framework}: ${item.reason}. Application: ${item.application}`).join("\n") || "- GOTTMAN: Repair and de-escalation"}

Use these signals to adapt voice and level of detail while staying specific to current context.

FULL GUIDANCE TO REWRITE BY MODE
${fallbackModes.full}

Return ONLY valid JSON (no markdown wrapper) with keys:
{
  "explain": "...",
  "60second": "...",
  "action": "...",
  "script": "..."
}

Mode requirements:
1) explain:
- Must explain why the AI reached this guidance, including evidence from profiles/questionnaires/sessions.
- Include sections with markdown headings: Core Dynamic, Evidence, Predictive Read, Why This Recommendation.
- Must feel analytical and specific to ${normalizedSpeaker} and ${resolvedTarget}.

2) 60second:
- This is NOT a short generic blurb.
- Produce a robust compressed briefing that summarizes full guidance in about 45-90 seconds of reading.
- Include headings: Snapshot, Drivers, Main Risk, What To Do First, What To Do Next, Exact Line To Use.

3) action:
- Produce a tailored numbered plan with 5-7 concrete steps, each specific to this situation.
- Include at least one branching step (for example: If they become defensive, do X; if they go quiet, do Y).
- Include a short completion checkpoint at the end.

4) script:
- Produce a dynamic dialogue toolkit, not one static line.
- Include headings: Opening, If They Are Defensive, If They Withdraw, If They Engage, Boundary Line, Close.
- Every line must sound natural and specific to this scenario.

Hard constraints:
- Mention only allowed participants from scope.
- No placeholders like "Person A" or "partner" when names are known.
- No generic fallback statements.
- In each mode, explicitly name at least one methodology-informed tactic and one predictive risk mitigator.`;

      const adaptiveRaw = await safeInvokeLLM(
        {
          prompt: adaptivePrompt,
          model: "claude_sonnet_4_6",
          partnerLanguage: { personName: normalizedSpeaker, partnerName: resolvedTarget },
        },
        35000,
        null,
      );

      const parsed = parseJsonObjectFromText(adaptiveRaw);
      if (!parsed || typeof parsed !== "object") {
        return null;
      }

      const candidate = {
        explain: String(parsed.explain || "").trim(),
        "60second": String(parsed["60second"] || "").trim(),
        action: String(parsed.action || "").trim(),
        script: String(parsed.script || "").trim(),
      };

      candidate.explain = appendCounterfactualSection(candidate.explain, predictiveEvidence, methodologyPreferences);

      if (!isUsefulModeText(candidate.explain) || !isUsefulModeText(candidate["60second"]) || !isUsefulModeText(candidate.action) || !isUsefulModeText(candidate.script)) {
        return null;
      }

      const explainScope = validateOutputScope(candidate.explain, scopeContext);
      const summaryScope = validateOutputScope(candidate["60second"], scopeContext);
      const actionScope = validateOutputScope(candidate.action, scopeContext);
      const scriptScope = validateOutputScope(candidate.script, scopeContext);
      if (!explainScope.ok || !summaryScope.ok || !actionScope.ok || !scriptScope.ok) {
        return null;
      }

      return {
        ...fallbackModes,
        ...candidate,
      };
    };

    // Save session with structured output
    const session = await api.entities.CoachSession.create({
      speaker: normalizedSpeaker,
      speaking_to: resolvedTarget,
      situation: situationText,
      ai_response: fallbackModes.full, // Store full mode by default
      tool_type: "coach",
    });
    setSessionId(session?.id || null);

    setBaseResponse(result);
    setCoachModes(fallbackModes);
    setResponse(fallbackModes.full);
    setSelectedFeedback("");
    setOutputMode("full");
    setLoading(false);
    queryClient.invalidateQueries({ queryKey: ["coach-sessions", activeRelationshipId] });

    updateLearningSignals(activeRelationshipId, normalizedSpeaker, resolvedTarget, (current) => ({
      ...current,
      recentSituations: [
        trimSessionText(situationText, 180),
        ...(current.recentSituations || []),
      ]
        .filter(Boolean)
        .slice(0, 8),
    }));
    trackLearningEventServer({
      relationship_id: activeRelationshipId,
      speaker: normalizedSpeaker,
      target: resolvedTarget,
      eventType: "situation",
      situation: trimSessionText(situationText, 180),
    });

    setRefreshingModes(true);
    buildAdaptiveModes()
      .then((adaptiveModes) => {
        if (!adaptiveModes) return;
        setCoachModes(adaptiveModes);

        const adaptiveOpenings = String(adaptiveModes.script || "")
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.startsWith('"') && line.endsWith('"'))
          .slice(0, 3)
          .map((line) => line.replace(/^"|"$/g, ""));

        updateLearningSignals(activeRelationshipId, normalizedSpeaker, resolvedTarget, (current) => ({
          ...current,
          successfulOpenings: [...adaptiveOpenings, ...(current.successfulOpenings || [])].filter(Boolean).slice(0, 10),
        }));
        trackLearningEventServer({
          relationship_id: activeRelationshipId,
          speaker: normalizedSpeaker,
          target: resolvedTarget,
          eventType: "openings",
          successfulOpenings: adaptiveOpenings,
        });

        setResponse((currentResponse) => {
          if (outputMode === "full") return currentResponse;
          return adaptiveModes[outputMode] || currentResponse;
        });
      })
      .finally(() => {
        setRefreshingModes(false);
      });
  };

  const handleSuggestionPill = (pillId) => {
    setSelectedPill(pillId);

    // Convert pill to situation text
    const situationMap = {
      handling_conflict: `We're having or heading into a conflict. I need help navigating this conversation and knowing how to approach it.`,
      repair_after_tension: `We had tension/conflict and now I need to repair. Help me know what to say and how to reconnect.`,
      feel_misunderstood: `I feel like ${currentSpeakingTo} isn't really understanding me. I feel misheard or dismissed.`,
      they_feel_distant: `${currentSpeakingTo} seems distant or withdrawn. I'm concerned and don't know how to reconnect.`,
      something_felt_off: `Something felt off in our interaction but I can't quite place what. Help me understand what might have happened.`,
      say_this_better: `I want to say something but I'm worried it will come out wrong. Help me phrase it in a way that won't trigger them.`,
      overwhelmed_triggered: `I'm feeling overwhelmed or triggered right now. Help me understand what's happening and how to navigate this state.`,
      repeating_pattern: `We keep repeating the same conflict or miscommunication. Help me understand the pattern and how to break it.`,
    };

    const text = situationMap[pillId];
    setSituation(text);
    setTimeout(
      () =>
        runCoachCall(text, {
          speakerOverride: currentSpeaker,
          speakingToOverride: currentSpeakingTo,
        }),
      100,
    );
  };

  const handleModeSwitch = (mode) => {
    setOutputMode(mode);
    updateLearningSignals(activeRelationshipId, currentSpeaker, currentSpeakingTo, (current) => ({
      ...current,
      modeUsage: {
        ...(current.modeUsage || {}),
        [mode]: Number(current?.modeUsage?.[mode] || 0) + 1,
      },
    }));
    trackLearningEventServer({
      relationship_id: activeRelationshipId,
      speaker: currentSpeaker,
      target: currentSpeakingTo,
      eventType: "mode_switch",
      mode,
    });

    if (coachModes?.[mode]) {
      setResponse(coachModes[mode]);
      return;
    }
    // Legacy fallback for older stored sessions
    if (baseResponse) {
      const structuredOutput = enforceCoachStructure(baseResponse);
      const modes = deriveCoachModes(structuredOutput);
      setCoachModes(modes);
      setResponse(modes[mode] || modes.full);
    }
  };

  const handleCopyResponse = () => {
    if (!response) return;
    navigator.clipboard.writeText(response);
    updateLearningSignals(activeRelationshipId, currentSpeaker, currentSpeakingTo, (current) => ({
      ...current,
      copiedByMode: {
        ...(current.copiedByMode || {}),
        [outputMode]: Number(current?.copiedByMode?.[outputMode] || 0) + 1,
      },
    }));
    trackLearningEventServer({
      relationship_id: activeRelationshipId,
      speaker: currentSpeaker,
      target: currentSpeakingTo,
      eventType: "copy",
      mode: outputMode,
    });
    toast.success("Response copied to clipboard");
  };

  const handleGuidanceFeedback = async (feedbackType) => {
    if (!response || !activeRelationshipId || !currentSpeaker || !currentSpeakingTo || feedbackSubmitting) return;

    setFeedbackSubmitting(true);
    setSelectedFeedback(feedbackType);
    const methodologyIds = extractMethodologyIdsFromPredictiveOutput(predictiveOutput);
    const feedbackEntry = {
      feedbackType,
      mode: outputMode,
      methodologyIds,
      createdAt: new Date().toISOString(),
    };

    updateLearningSignals(activeRelationshipId, currentSpeaker, currentSpeakingTo, (current) => ({
      ...current,
      feedbackSignals: {
        ...(current.feedbackSignals || { helpful: 0, too_generic: 0, too_long: 0, too_soft: 0, too_direct: 0 }),
        [feedbackType]: Number(current?.feedbackSignals?.[feedbackType] || 0) + 1,
      },
      feedbackHistory: normalizeFeedbackHistory([feedbackEntry, ...(current.feedbackHistory || [])]),
      methodologyStats: methodologyIds.reduce((acc, methodologyId) => {
        const currentStats = acc[methodologyId] || { helpful: 0, corrective: 0, total: 0, score: 0.5 };
        const helpful = currentStats.helpful + (feedbackType === "helpful" ? 1 : 0);
        const corrective = currentStats.corrective + (feedbackType === "helpful" ? 0 : 1);
        const total = helpful + corrective;
        acc[methodologyId] = {
          helpful,
          corrective,
          total,
          score: Number((((helpful + 1) / (total + 2)) || 0.5).toFixed(3)),
        };
        return acc;
      }, { ...(current.methodologyStats || {}) }),
    }));

    trackLearningEventServer({
      relationship_id: activeRelationshipId,
      speaker: currentSpeaker,
      target: currentSpeakingTo,
      eventType: "feedback",
      feedbackType,
      mode: outputMode,
      methodologyIds,
      relatedSessionId: sessionId,
    });

    setFeedbackSubmitting(false);
    toast.success("Feedback captured. Guidance will adapt.");
  };

  const loadSessionIntoComposer = (session) => {
    const cleanedSituation = cleanSituationText(session.situation);
    const repairedSelection = resolveCoachTarget(session.speaker, session.speaking_to, activeParticipants);
    setSpeaker(repairedSelection.speaker);
    setSpeakingTo(repairedSelection.speakingTo);
    setSituation(cleanedSituation);
    const structured = enforceCoachStructure(session.ai_response, cleanedSituation);
    const modes = deriveCoachModes(structured);
    setBaseResponse(session.ai_response);
    setCoachModes(modes);
    setOutputMode("full");
    setResponse(modes.full);
    setEditingSessionId(session.id);
    setSessionId(session.id);
  };

  const handleDeleteSession = async (targetId) => {
    await api.entities.CoachSession.delete(targetId);
    if (editingSessionId === targetId || sessionId === targetId) {
      setEditingSessionId(null);
      setSessionId(null);
    }
    queryClient.invalidateQueries({ queryKey: ["coach-sessions", activeRelationshipId] });
    toast.success("Conversation deleted");
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-3 pt-4"
      >
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
          Start a Conversation
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Get context-aware guidance based on your {terms.bond} patterns, emotional dynamics, and real situations.
        </p>
      </motion.div>

      <PrivacyBanner />

      {creditError && <CreditLimitBanner />}

      {error && (
        <ErrorFallback error={error} onRetry={() => setError(null)} />
      )}

      {/* Input Section */}
      <Card className="enterprise-panel border-2">
        <CardContent className="p-6 space-y-4">
          {/* Directional Mode */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              This is me → I'm speaking to
            </p>
            <div className="flex gap-2 flex-wrap">
              {activeParticipants.map((person) => (
                <Button
                  key={person}
                  variant={currentSpeaker === person ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSpeaker(person);
                    setSpeakingTo(getPartnerName(person, activeParticipants));
                  }}
                  className="text-xs"
                >
                  {person}
                </Button>
              ))}
              {currentSpeaker && (
                <>
                  <span className="text-xs text-muted-foreground px-2">→</span>
                  {activeParticipants.map((person) => {
                    if (person === currentSpeaker) return null;
                    return (
                      <Button
                        key={person}
                        variant={currentSpeakingTo === person ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSpeakingTo(person)}
                        className="text-xs"
                      >
                        {person}
                      </Button>
                    );
                  })}
                </>
              )}
            </div>
            {activeParticipants.length < 2 && (
              <p className="text-xs text-amber-700">
                We need both people in this {terms.bond} before AI Coach can tailor guidance correctly.
              </p>
            )}
          </div>

          {/* Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">What do you need help with right now?</label>
            <Textarea
              placeholder="Describe the situation, feeling, or conversation you need guidance on..."
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              className="min-h-[90px] resize-none bg-background/50 text-sm"
            />
          </div>

          {/* Situation Severity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Situation Severity</label>
              <span className="text-sm tabular-nums text-muted-foreground">
                {severity}/5 · {["Very Low", "Low", "Moderate", "High", "Critical"][severity - 1]}
              </span>
            </div>
            <Slider
              value={[severity]}
              onValueChange={([val]) => setSeverity(val)}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground select-none">
              {[1, 2, 3, 4, 5].map((n) => <span key={n}>{n}</span>)}
            </div>
            <p className="text-xs text-muted-foreground leading-5">
              Guidance keeps full depth and structure, while intensity and urgency are calibrated to this setting.
            </p>
          </div>

          {/* Suggestion Pills */}
          {currentSpeaker && currentSpeakingTo && situation.length < 10 && (
            <CoachSuggestionPills pills={SUGGESTION_PILLS} onSelect={handleSuggestionPill} loading={loading} />
          )}

          {/* Submit Button */}
          <Button
            onClick={() =>
              runCoachCall(situation, {
                speakerOverride: currentSpeaker,
                speakingToOverride: currentSpeakingTo,
              })
            }
            disabled={loading || !canSubmitCoach}
            className="w-full sm:w-auto gap-2"
            size="lg"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Analyzing..." : "Get Guidance"}
          </Button>
        </CardContent>
      </Card>

      <AILoadingState active={loading} mode="coach" />

      {/* Response Section */}
      <AnimatePresence>
        {response && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Output Mode Selector */}
            <CoachOutputModes mode={outputMode} onModeChange={handleModeSwitch} />
            {refreshingModes && (
              <p className="text-xs text-muted-foreground">Refreshing mode-specific guidance with full relationship context...</p>
            )}

            {/* Main Response */}
            <Card className="bg-card border border-primary/15" ref={responseRef}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Guidance for {currentSpeaker} → {currentSpeakingTo}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary">
                  <ReactMarkdown>{response}</ReactMarkdown>
                </div>

                <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rate This Guidance</p>
                  <div className="flex flex-wrap gap-2">
                    {COACH_FEEDBACK_OPTIONS.map((option) => (
                      <Button
                        key={option.id}
                        type="button"
                        size="sm"
                        variant={selectedFeedback === option.id ? "default" : "outline"}
                        onClick={() => handleGuidanceFeedback(option.id)}
                        disabled={feedbackSubmitting}
                        className="text-xs"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Data Source Badge */}
                <div className="pt-3 border-t border-border/40 space-y-3">
                  <DataSourceBadge
                    sources={[
                      { label: "profile fields", count: speakerProfile ? 8 : 0 },
                      { label: "questionnaire answers", count: speakerResponses.length + targetResponses.length },
                      { label: "past sessions", count: safePastSessions.filter((s) => s.tool_type === "coach").length },
                    ]}
                  />
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="ghost" onClick={handleCopyResponse} className="gap-1.5">
                      <Copy className="w-3.5 h-3.5" />
                      Copy Response
                    </Button>
                    <ResponseExportBar
                      contentRef={responseRef}
                      content={response}
                      filename={`coach-guidance-${currentSpeaker}-${currentSpeakingTo}.pdf`}
                      title={`Guidance: ${currentSpeaker} → ${currentSpeakingTo}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes Panel */}
            <NotesPanel
              section="coach"
              relatedItemId={sessionId}
              personName={currentSpeaker}
            />

            {/* Predictive Outcomes */}
            {baseResponse && (
              <PredictiveOutcomeBlock
                speaker={currentSpeaker}
                speakingTo={currentSpeakingTo}
                situation={situation}
                speakerProfile={speakerProfile}
                targetProfile={targetProfile}
                speakerTraits={speakerPatternProfile?.traits}
                targetTraits={targetPatternProfile?.traits}
              />
            )}

            {/* Trace Panel */}
            {pipelineTrace && (
              <TracePanel
                trace={pipelineTrace}
                metadata={{
                  perspective: `${currentSpeaker}→${currentSpeakingTo}`,
                  patterns: speakerProfile?.trait_weights || {},
                  frameworks: ["EFT", "GOTTMAN", "CBT"],
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Sessions */}
      {safePastSessions.filter((s) => s.tool_type === "coach").length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Recent Conversations</h2>
          <div className="space-y-3">
            {safePastSessions
              .filter((s) => s.tool_type === "coach")
              .slice(0, 8)
              .map((session) => {
                const summary = summarizeCoachSession(session);
                return (
                  <Card
                    key={session.id}
                    className="cursor-pointer border-2 border-primary/15 bg-white transition-all hover:border-primary/30 hover:shadow-sm"
                    onClick={() => loadSessionIntoComposer(session)}
                  >
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-[#eef7f8]">
                        <MessageCircle className="w-4 h-4 text-[#0e6f72]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <p className="text-sm font-semibold text-foreground">{summary.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {session.speaker} → {session.speaking_to}
                          </p>
                          <span className="hidden text-muted-foreground/40 sm:inline">•</span>
                          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock3 className="h-3 w-3" />
                            {new Date(session.created_date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-[#14263f]">
                          {summary.description}
                        </p>
                      </div>
                      <div className="ml-auto flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full border border-[#0e6f72]/15 bg-[#eef8f7] text-[#0e6f72] hover:bg-[#d9f4f1]"
                          onClick={(event) => {
                            event.stopPropagation();
                            loadSessionIntoComposer(session);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="delete-action-button h-8 w-8 rounded-full border border-[#c03b3b]/15 bg-[#fff6f6]"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                        >
                          <Trash2 className="delete-action-icon h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </div>
      )}
    </div>
  );
}
