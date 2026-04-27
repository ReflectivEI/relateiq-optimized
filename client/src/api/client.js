import { detectRiskSignals } from "@/lib/earlyWarningEngine";
import { globalState } from "@/lib/globalState";
import { synthesizeRelationshipIntelligence } from "@/lib/relationshipIntelligenceEngine";

const API_BASE =
  import.meta.env.VITE_WORKER_URL ||
  "https://relate-iq-growth-api.tonyabdelmalak.workers.dev";

const AUTH_TOKEN_KEY = "relateiq.auth.token";
const RELATIONSHIP_ID_KEY = "relateiq.active.relationship";
const REQUEST_TIMEOUT_MS = 12000;
const RELATIONSHIP_MEMORY_PREFIX = "relateiq.relationship.memory.v1";

const LOCAL_QUESTIONNAIRE_FILES = {
  Tony: "/data/relateiq/tony.questionnaire.json",
  Drew: "/data/relateiq/drew.questionnaire.json",
};

function buildUrl(path, params) {
  const url = new URL(path, API_BASE.endsWith("/") ? API_BASE : `${API_BASE}/`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function relationshipMemoryKey(relationshipId) {
  return `${RELATIONSHIP_MEMORY_PREFIX}:${relationshipId}`;
}

function readRelationshipMemorySnapshot(relationshipId) {
  if (!relationshipId || !canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(relationshipMemoryKey(relationshipId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeRelationshipMemorySnapshot(relationshipId, snapshot) {
  if (!relationshipId || !canUseStorage()) return;
  try {
    window.localStorage.setItem(relationshipMemoryKey(relationshipId), JSON.stringify(snapshot));
  } catch {
    // Ignore storage failures.
  }
}

function uniqueById(records = []) {
  return [...new Map(records.filter(Boolean).map((record) => [record.id, record])).values()];
}

function upsertRecord(records = [], nextRecord) {
  return uniqueById([nextRecord, ...records]);
}

function deriveParticipants(memory) {
  const people = [
    ...(memory.profiles || []).map((profile) => normalizeText(profile.person_name)),
    ...(memory.questionnaireResponses || []).map((record) => normalizeText(record.person_name)),
    ...(memory.checkIns || []).map((record) => normalizeText(record.person_name)),
    ...(memory.dailyReflections || []).map((record) => normalizeText(record.person_name)),
    ...(memory.journalEntries || []).map((record) => normalizeText(record.person_name)),
    ...(memory.notes || []).map((record) => normalizeText(record.person_name)),
    ...(memory.triggers || []).map((record) => normalizeText(record.owner)),
    ...(memory.coachSessions || []).flatMap((record) => [normalizeText(record.speaker), normalizeText(record.speaking_to)]),
  ].filter(Boolean);
  return [...new Set(people)].slice(0, 2);
}

function mergeRecordIntoMemory(memory, entity, record) {
  switch (entity) {
    case "QuestionnaireResponse":
      return { ...memory, questionnaireResponses: upsertRecord(memory.questionnaireResponses, record) };
    case "CheckIn":
      return { ...memory, checkIns: upsertRecord(memory.checkIns, record) };
    case "CoachSession":
      return { ...memory, coachSessions: upsertRecord(memory.coachSessions, record) };
    case "Note":
      return { ...memory, notes: upsertRecord(memory.notes, record) };
    case "DailyReflection":
      return { ...memory, dailyReflections: upsertRecord(memory.dailyReflections, record) };
    case "JournalEntry":
      return { ...memory, journalEntries: upsertRecord(memory.journalEntries, record) };
    case "InsightEntry":
      return { ...memory, insightEntries: upsertRecord(memory.insightEntries, record) };
    case "VisionPin":
      return { ...memory, visionPins: upsertRecord(memory.visionPins, record) };
    case "TriggerEntry":
      return { ...memory, triggers: upsertRecord(memory.triggers, record) };
    case "RepairEntry":
      return { ...memory, repairEntries: upsertRecord(memory.repairEntries, record) };
    case "OutcomeLog":
      return { ...memory, outcomeLogs: upsertRecord(memory.outcomeLogs, record) };
    case "UserProfile":
      return { ...memory, profiles: upsertRecord(memory.profiles, record) };
    case "RelationshipDynamic":
      return { ...memory, relationshipDynamics: record };
    default:
      return memory;
  }
}

function buildEmptyRelationshipMemory() {
  return {
    events: [],
    questionnaireResponses: [],
    checkIns: [],
    coachSessions: [],
    notes: [],
    dailyReflections: [],
    journalEntries: [],
    insightEntries: [],
    visionPins: [],
    triggers: [],
    repairEntries: [],
    outcomeLogs: [],
    relationshipDynamics: null,
    riskSignals: null,
    participants: [],
    profiles: [],
    lastUpdated: null,
  };
}

function inferScopedPerson(record = {}) {
  if (normalizeText(record.person_name)) return normalizeText(record.person_name);
  if (normalizeText(record.owner)) return normalizeText(record.owner);
  if (normalizeText(record.speaker)) return normalizeText(record.speaker);
  const pinnedBy = normalizeText(record.pinned_by);
  if (pinnedBy && !pinnedBy.includes("_")) return pinnedBy;
  const scope = normalizeText(record.scope);
  if (scope && !scope.includes("_")) return scope;
  return "shared";
}

function updateLegacyGlobalState(entity, record) {
  const person = normalizeText(record.person_name || record.owner || record.speaker);
  if (!person) return;
  if (entity === "QuestionnaireResponse") {
    const current = person === "Tony" ? globalState.getState().tonyResponses : person === "Drew" ? globalState.getState().drewResponses : [];
    const next = upsertRecord(current, record);
    globalState.setResponses(person, next);
  }
  if (entity === "UserProfile") {
    globalState.setProfile(person, record);
  }
  if (entity === "CheckIn") {
    const state = globalState.getState();
    globalState.setState({ checkIns: upsertRecord(state.checkIns, record) });
  }
  if (entity === "TriggerEntry") {
    const state = globalState.getState();
    globalState.setTriggers(upsertRecord(state.triggers, record));
  }
  if (entity === "CoachSession") {
    globalState.addCoachSession(record);
  }
  if (entity === "InsightEntry") {
    globalState.addInsight(record);
  }
}

async function recordLearningEvent(entity, action, record) {
  const relationshipId = normalizeText(record?.relationship_id) || getStoredRelationshipId();
  if (!entity || !record || !relationshipId) return record;

  try {
    const currentMemory = readRelationshipMemorySnapshot(relationshipId) || globalState.getState().relationshipMemory?.[relationshipId] || buildEmptyRelationshipMemory();
    const mergedMemory = mergeRecordIntoMemory(currentMemory, entity, record);
    const participants = deriveParticipants(mergedMemory);
    const [primaryPerson = "Person A", secondaryPerson = "Other Person"] = participants;
    const primaryProfile = (mergedMemory.profiles || []).find((profile) => normalizeText(profile.person_name) === primaryPerson) || null;
    const secondaryProfile = (mergedMemory.profiles || []).find((profile) => normalizeText(profile.person_name) === secondaryPerson) || null;

    const riskSignals = detectRiskSignals({
      checkIns: mergedMemory.checkIns || [],
      tonyProfile: primaryProfile,
      drewProfile: secondaryProfile,
    });

    const relationshipDynamics = synthesizeRelationshipIntelligence({
      participants: participants.length ? participants : ["Person A", "Other Person"],
      profiles: mergedMemory.profiles || [],
      recentCoachSessions: mergedMemory.coachSessions || [],
      recentCheckIns: mergedMemory.checkIns || [],
      repairEntries: mergedMemory.repairEntries || [],
      triggers: mergedMemory.triggers || [],
      predictiveOutputs: {},
    });

    const nextMemory = {
      ...mergedMemory,
      participants,
      relationshipDynamics,
      riskSignals,
      events: [
        {
          id: `${entity}:${record.id}:${Date.now()}`,
          entity,
          action,
          relationship_id: relationshipId,
          person: inferScopedPerson(record),
          record_id: record.id,
          created_date: new Date().toISOString(),
        },
        ...(mergedMemory.events || []),
      ].slice(0, 500),
      lastUpdated: new Date().toISOString(),
    };

    globalState.mergeRelationshipMemory(relationshipId, nextMemory);
    globalState.setRiskSummary(riskSignals);
    globalState.setState({ relationshipDynamics });
    updateLegacyGlobalState(entity, record);
    writeRelationshipMemorySnapshot(relationshipId, nextMemory);
  } catch (error) {
    console.error("[api] learning ingestion failed", error);
  }

  return record;
}

export function getStoredAuthToken() {
  return typeof window === "undefined" ? "" : window.localStorage.getItem(AUTH_TOKEN_KEY) || "";
}

export function setStoredAuthToken(token) {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function getStoredRelationshipId() {
  return typeof window === "undefined" ? "" : window.localStorage.getItem(RELATIONSHIP_ID_KEY) || "";
}

export function setStoredRelationshipId(relationshipId) {
  if (typeof window === "undefined") return;
  if (relationshipId) {
    window.localStorage.setItem(RELATIONSHIP_ID_KEY, relationshipId);
  } else {
    window.localStorage.removeItem(RELATIONSHIP_ID_KEY);
  }
}

export function clearStoredSession() {
  setStoredAuthToken("");
  setStoredRelationshipId("");
}

async function request(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };
  const authToken = getStoredAuthToken();
  const relationshipId = options.relationshipId || getStoredRelationshipId();
  const body =
    options.body === undefined
      ? undefined
      : options.body instanceof FormData
      ? options.body
      : JSON.stringify(options.body);

  if (!(body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (authToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  if (relationshipId && !headers["X-Relationship-Id"]) {
    headers["X-Relationship-Id"] = relationshipId;
  }

  const timeoutMs = options.timeoutMs === undefined ? REQUEST_TIMEOUT_MS : options.timeoutMs;
  const controller = typeof AbortController !== "undefined" && timeoutMs > 0 ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  let response;
  try {
    response = await fetch(buildUrl(path, options.params), {
      method: options.method || "GET",
      headers,
      body,
      signal: controller?.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Request timed out. Please refresh and try again.");
    }
    throw error;
  } finally {
    if (timeout) clearTimeout(timeout);
  }

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(text || `Request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

async function blobToBase64(blob) {
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

async function loadLocalQuestionnaire(personName) {
  const path = LOCAL_QUESTIONNAIRE_FILES[personName];
  if (!path) return [];

  const response = await fetch(path, { headers: { Accept: "application/json" } });
  if (!response.ok) return [];

  const payload = await response.json();
  return Array.isArray(payload) ? payload : [];
}

async function questionnaireFallback(params) {
  const personName = params?.person_name;
  const relationshipId = getStoredRelationshipId();
  if (relationshipId && relationshipId !== "relationship_tony_drew_romantic") {
    return [];
  }
  if (!personName || !LOCAL_QUESTIONNAIRE_FILES[personName]) return [];
  return loadLocalQuestionnaire(personName);
}

function entityClient(entity) {
  return {
    list(sort, limit, skip, fields) {
      return request(`/api/data/${entity}`, {
        params: {
          sort,
          limit,
          skip,
          fields: Array.isArray(fields) ? fields.join(",") : fields,
        },
      }).catch(async (error) => {
        if (entity === "QuestionnaireResponse") {
          return questionnaireFallback({});
        }
        throw error;
      });
    },
    filter(query, sort, limit, skip, fields) {
      return request(`/api/data/${entity}`, {
        params: {
          q: JSON.stringify(query || {}),
          sort,
          limit,
          skip,
          fields: Array.isArray(fields) ? fields.join(",") : fields,
        },
      })
        .then(async (records) => {
          if (entity === "QuestionnaireResponse" && Array.isArray(records) && records.length === 0) {
            return questionnaireFallback(query);
          }
          return records;
        })
        .catch(async (error) => {
          if (entity === "QuestionnaireResponse") {
            return questionnaireFallback(query);
          }
          throw error;
        });
    },
    get(id) {
      return request(`/api/data/${entity}/${id}`);
    },
    create(data) {
      return request(`/api/data/${entity}`, {
        method: "POST",
        body: data,
      }).then((record) => recordLearningEvent(entity, "create", record));
    },
    update(id, data) {
      return request(`/api/data/${entity}/${id}`, {
        method: "PUT",
        body: data,
      }).then((record) => recordLearningEvent(entity, "update", record));
    },
    delete(id) {
      return request(`/api/data/${entity}/${id}`, {
        method: "DELETE",
      });
    },
  };
}

export const api = {
  request,
  session: {
    getStoredAuthToken,
    setStoredAuthToken,
    getStoredRelationshipId,
    setStoredRelationshipId,
    clearStoredSession,
  },
  entities: {
    Relationship: entityClient("Relationship"),
    AhaCard: entityClient("AhaCard"),
    CheckIn: entityClient("CheckIn"),
    CoachSession: entityClient("CoachSession"),
    DailyQuestion: entityClient("DailyQuestion"),
    DailyReflection: entityClient("DailyReflection"),
    InsightEntry: entityClient("InsightEntry"),
    JournalEntry: entityClient("JournalEntry"),
    Note: entityClient("Note"),
    OutcomeLog: entityClient("OutcomeLog"),
    PlayLabResponse: entityClient("PlayLabResponse"),
    PlayLabResult: entityClient("PlayLabResult"),
    PlayLabSession: entityClient("PlayLabSession"),
    QuestionnaireResponse: entityClient("QuestionnaireResponse"),
    RelationshipDynamic: entityClient("RelationshipDynamic"),
    RepairEntry: entityClient("RepairEntry"),
    SideQuest: entityClient("SideQuest"),
    TriggerEntry: entityClient("TriggerEntry"),
    UserProfile: entityClient("UserProfile"),
    VisionPin: entityClient("VisionPin"),
  },
  relationships: {
    list() {
      return request("/api/relationships");
    },
    manage() {
      return request("/api/relationships/manage");
    },
    create(payload) {
      return request("/api/relationships/create", {
        method: "POST",
        body: payload,
      });
    },
    invite(payload) {
      return request("/api/relationships/invite", {
        method: "POST",
        body: payload,
      });
    },
    onboard(payload) {
      return request("/api/relationships/onboarding", {
        method: "POST",
        body: payload,
      });
    },
    updateManaged(relationshipId, payload) {
      return request(`/api/relationships/manage/${relationshipId}`, {
        method: "PATCH",
        body: payload,
      });
    },
    deleteManaged(relationshipId) {
      return request(`/api/relationships/manage/${relationshipId}`, {
        method: "DELETE",
      });
    },
  },
  invites: {
    lookup(token) {
      return request(`/api/invite/${token}`);
    },
    accept(token) {
      return request(`/api/invite/${token}`, { method: "POST" });
    },
  },
  questionnaire: {
    prefillFromBaseline(payload) {
      return request("/api/questionnaire/prefill", {
        method: "POST",
        body: payload,
      });
    },
  },
  audit: {
    list(params) {
      return request("/api/audit", { params });
    },
    restore(eventId) {
      return request("/api/audit/restore", {
        method: "POST",
        body: { event_id: eventId },
      });
    },
  },
  playLab: {
    createSession(payload) {
      return request("/api/play-lab/session", {
        method: "POST",
        body: payload,
      });
    },
    refreshPrompt(payload) {
      return request("/api/play-lab/refresh", {
        method: "POST",
        body: payload,
      });
    },
    submitAnswer(payload) {
      return request("/api/play-lab/submit", {
        method: "POST",
        body: payload,
      });
    },
    evaluate(payload) {
      return request("/api/play-lab/evaluate", {
        method: "POST",
        body: payload,
      });
    },
    generateRepairPlan(payload) {
      return request("/api/play-lab/repair-plan", {
        method: "POST",
        body: payload,
      });
    },
    generateAhaCard(payload) {
      return request("/api/play-lab/aha", {
        method: "POST",
        body: payload,
      });
    },
    assignSideQuest(payload) {
      return request("/api/play-lab/side-quest", {
        method: "POST",
        body: payload,
      });
    },
    logOutcome(payload) {
      return request("/api/play-lab/outcome", {
        method: "POST",
        body: payload,
      });
    },
    fetchHistory(params) {
      return request("/api/play-lab/history", { params });
    },
    fetchAhaCards(params) {
      return request("/api/play-lab/aha-cards", { params });
    },
    fetchSideQuests(params) {
      return request("/api/play-lab/side-quests", { params });
    },
    explain(payload) {
      return request("/api/play-lab/explain", {
        method: "POST",
        body: payload,
      });
    },
    elaborate(payload) {
      return request("/api/play-lab/elaborate", {
        method: "POST",
        body: payload,
      });
    },
    exportSummary(payload) {
      return request("/api/play-lab/export", {
        method: "POST",
        body: payload,
      });
    },
  },
  integrations: {
    Core: {
      InvokeLLM(params) {
        return request("/api/llm", {
          method: "POST",
          body: params,
        });
      },
      async UploadFile({ file, filename, metadata } = {}) {
        if (!(file instanceof Blob)) {
          throw new Error("file_blob_required");
        }

        const base64 = await blobToBase64(file);
        return request("/api/files/upload", {
          method: "POST",
          body: {
            fileName: filename || file.name || "upload.bin",
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            data: base64,
            metadata: metadata || {},
          },
        });
      },
      SendEmail(payload) {
        return request("/api/email/send", {
          method: "POST",
          body: payload,
        });
      },
    },
  },
  auth: {
    async login(payload) {
      clearStoredSession();
      const result = await request("/api/auth/login", {
        method: "POST",
        body: payload,
        headers: { "X-Relationship-Id": "" },
        timeoutMs: 0,
      });
      if (result?.token) setStoredAuthToken(result.token);
      if (result?.default_relationship_id) setStoredRelationshipId(result.default_relationship_id);
      return result;
    },
    async register(payload) {
      clearStoredSession();
      const result = await request("/api/auth/register", {
        method: "POST",
        body: payload,
        headers: { "X-Relationship-Id": "" },
        timeoutMs: 0,
      });
      if (result?.token) setStoredAuthToken(result.token);
      if (result?.default_relationship_id) setStoredRelationshipId(result.default_relationship_id);
      return result;
    },
    async bootstrap() {
      const result = await request("/api/auth/me", {
        headers: { "X-Relationship-Id": getStoredRelationshipId() || "" },
        timeoutMs: 15000,
      });
      if (result?.default_relationship_id && !getStoredRelationshipId()) {
        setStoredRelationshipId(result.default_relationship_id);
      }
      return result;
    },
    async me() {
      const result = await this.bootstrap();
      return result?.user || result;
    },
    logout() {
      clearStoredSession();
      return null;
    },
    redirectToLogin() {
      window.location.href = "/?auth=1";
    },
  },
};

export default api;
