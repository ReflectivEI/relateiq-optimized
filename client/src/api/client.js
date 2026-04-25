const API_BASE =
  import.meta.env.VITE_WORKER_URL ||
  "https://relate-iq-growth-api.tonyabdelmalak.workers.dev";

const AUTH_TOKEN_KEY = "relateiq.auth.token";
const RELATIONSHIP_ID_KEY = "relateiq.active.relationship";
const REQUEST_TIMEOUT_MS = 12000;

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(buildUrl(path, options.params), {
      method: options.method || "GET",
      headers,
      body,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Request timed out. Please refresh and try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
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
      });
    },
    update(id, data) {
      return request(`/api/data/${entity}/${id}`, {
        method: "PUT",
        body: data,
      });
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
      const result = await request("/api/auth/login", {
        method: "POST",
        body: payload,
        headers: { "X-Relationship-Id": "" },
      });
      if (result?.token) setStoredAuthToken(result.token);
      if (result?.default_relationship_id) setStoredRelationshipId(result.default_relationship_id);
      return result;
    },
    async register(payload) {
      const result = await request("/api/auth/register", {
        method: "POST",
        body: payload,
        headers: { "X-Relationship-Id": "" },
      });
      if (result?.token) setStoredAuthToken(result.token);
      if (result?.default_relationship_id) setStoredRelationshipId(result.default_relationship_id);
      return result;
    },
    async bootstrap() {
      const result = await request("/api/auth/me", {
        headers: { "X-Relationship-Id": getStoredRelationshipId() || "" },
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
