import {
  DEFAULT_RELATIONSHIP_ID,
  DEFAULT_USER_ID,
  RELATEIQ_STATE,
  RELATEIQ_STATES,
  type AppState,
  type PersonId,
  type QuestionnaireSummary,
  type PublicUser,
  type Relationship,
  type RelationshipInvite,
  type RelationshipMembership,
  type RelationshipOnboarding,
  type RelationshipSummary,
  type RelationshipType,
  type UploadedQuestionnaire,
  type User,
  buildCoachResponse,
  buildCheckInResponse,
  buildRepairResponse,
  buildFtueExplain,
  buildFtueResponse,
  getRelationshipsForUser,
  getFtueState,
  logFtueEvent,
  RELATEIQ_MEMBERSHIPS,
  RELATEIQ_ONBOARDING,
  RELATEIQ_RELATIONSHIPS,
  RELATEIQ_USERS,
  sanitizeUser,
  sha256Hex,
} from "../shared/relateiq";

type Env = {
  CORS_ORIGINS?: string;
  QUESTIONNAIRES?: KVNamespace;
  GROQ_API_KEY_STANDALONE?: string;
  GROQ_API_KEY_STANDALONE_1?: string;
  GROQ_API_KEY_STANDALONE_2?: string;
  GROQ_API_KEY_STANDALONE_3?: string;
  GROQ_MODEL?: string;
  RESEND_API_KEY?: string;
  AUTH_SECRET?: string;
  EMAIL_FROM?: string;
  EMAIL?: {
    send(message: {
      to: string | string[];
      from: string | { email: string; name?: string };
      subject: string;
      text?: string;
      html?: string;
      attachments?: Array<{
        content: string | ArrayBuffer;
        filename: string;
        type: string;
        disposition: "attachment" | "inline";
      }>;
    }): Promise<{ messageId: string }>;
  };
};

type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type StoredRecord = Record<string, unknown> & {
  id: string;
  created_date: string;
  updated_date: string;
};

type PlayLabModuleType =
  | "guess_my_inner_world"
  | "repair_quest"
  | "stress_decoder"
  | "two_truths_and_a_misread"
  | "aha_cards"
  | "side_quest"
  | "love_map_sprint";

type ProfileDimensionKey =
  | "seeks_understanding"
  | "seeks_acknowledgment"
  | "seeks_reassurance"
  | "seeks_affection"
  | "seeks_space"
  | "seeks_problem_solving"
  | "internal_processor"
  | "external_processor"
  | "shutdown_when_overwhelmed"
  | "asks_questions_to_connect"
  | "asks_questions_perceived_as_pressure"
  | "sensitive_to_tone"
  | "sensitive_to_follow_through"
  | "apology_needs_behavior_change"
  | "needs_emotional_reflection"
  | "prefers_directness"
  | "prefers_soft_start"
  | "conflict_repair_speed"
  | "loneliness_when_misunderstood"
  | "defensiveness_when_cornered";

type DimensionMap = Record<ProfileDimensionKey, number>;

type InterpretationInput = {
  sourceType: string;
  moduleContext: string;
  scope: string;
  speaker: PersonId;
  partner: PersonId;
  rawInput: string;
  desiredOutcome?: string;
  relatedId?: string | null;
  relatedSessionId?: string | null;
  contextObject?: Record<string, unknown> | null;
};

type MetricName =
  | "emotional_attunement"
  | "support_accuracy"
  | "trigger_sensitivity"
  | "repair_effectiveness"
  | "communication_alignment"
  | "response_flexibility"
  | "follow_through_consistency"
  | "emotional_safety_index";

type MetricSignal = {
  userId: PersonId;
  coupleId: string;
  metricName: MetricName;
  delta: number;
  weight: number;
  reason: string;
  sourceModule: string;
  contextObjectId?: string | null;
  relatedId?: string | null;
  relatedSessionId?: string | null;
};

const PLAY_LAB_MODULE_LABELS: Record<PlayLabModuleType, string> = {
  guess_my_inner_world: "Guess My Inner World",
  repair_quest: "Repair Quest",
  stress_decoder: "Stress Decoder",
  two_truths_and_a_misread: "Two Truths and a Misread",
  aha_cards: "Aha Cards",
  side_quest: "One Degree of Change",
  love_map_sprint: "Love Map Sprint",
};

const PLAY_LAB_PROMPTS: Record<PlayLabModuleType, string[]> = {
  guess_my_inner_world: [
    "What would make me feel most supported tonight?",
    "If I go quiet after a hard day, what do I most want from you?",
    "What makes an apology feel complete to me?",
    "What usually helps me feel most understood?",
    "What do I need first when I’m overwhelmed?",
    "What tends to make me feel alone in the relationship?",
  ],
  repair_quest: [
    "What still feels unresolved after this moment?",
    "What repair move would matter most right now?",
    "What part of the exchange still stings or feels unfinished?",
  ],
  stress_decoder: [
    "What support would actually land best right now?",
    "When stress is high, what helps most first?",
    "What kind of support would lower pressure fastest today?",
  ],
  two_truths_and_a_misread: [
    "Which part of this moment was probably misread?",
    "What are two likely truths and one likely misinterpretation here?",
  ],
  aha_cards: [
    "What pattern has the app learned lately that would help this couple most?",
  ],
  side_quest: [
    "What is one tiny behavior experiment worth trying this week?",
  ],
  love_map_sprint: [
    "What is draining your partner most this week?",
    "What kind of support are they most likely to want right now?",
    "What topic feels hardest for them right now?",
    "What kind of repair would matter most to them this month?",
  ],
};

const PROFILE_DIMENSION_KEYS: ProfileDimensionKey[] = [
  "seeks_understanding",
  "seeks_acknowledgment",
  "seeks_reassurance",
  "seeks_affection",
  "seeks_space",
  "seeks_problem_solving",
  "internal_processor",
  "external_processor",
  "shutdown_when_overwhelmed",
  "asks_questions_to_connect",
  "asks_questions_perceived_as_pressure",
  "sensitive_to_tone",
  "sensitive_to_follow_through",
  "apology_needs_behavior_change",
  "needs_emotional_reflection",
  "prefers_directness",
  "prefers_soft_start",
  "conflict_repair_speed",
  "loneliness_when_misunderstood",
  "defensiveness_when_cornered",
];

const SEEDED_PROFILE_DIMENSIONS: Record<PersonId, Partial<DimensionMap>> = {
  Tony: {
    seeks_understanding: 0.86,
    loneliness_when_misunderstood: 0.84,
    asks_questions_to_connect: 0.79,
    needs_emotional_reflection: 0.8,
    apology_needs_behavior_change: 0.72,
    internal_processor: 0.71,
    seeks_problem_solving: 0.64,
    prefers_directness: 0.61,
    sensitive_to_follow_through: 0.7,
  },
  Drew: {
    seeks_affection: 0.76,
    seeks_acknowledgment: 0.82,
    seeks_reassurance: 0.7,
    shutdown_when_overwhelmed: 0.73,
    asks_questions_perceived_as_pressure: 0.67,
    sensitive_to_tone: 0.82,
    prefers_soft_start: 0.79,
    conflict_repair_speed: 0.63,
    external_processor: 0.62,
  },
};

const METRIC_NAMES: MetricName[] = [
  "emotional_attunement",
  "support_accuracy",
  "trigger_sensitivity",
  "repair_effectiveness",
  "communication_alignment",
  "response_flexibility",
  "follow_through_consistency",
  "emotional_safety_index",
];

function getGroqApiKeys(env: Env): string[] {
  return [
    env.GROQ_API_KEY_STANDALONE,
    env.GROQ_API_KEY_STANDALONE_1,
    env.GROQ_API_KEY_STANDALONE_2,
    env.GROQ_API_KEY_STANDALONE_3,
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
}

function getGroqModel(env: Env, requestedModel?: string): string {
  if (requestedModel?.includes("llama")) return requestedModel;
  return env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";
}

function getRotatedKeys(keys: string[], seed: number): string[] {
  if (keys.length <= 1) return keys;
  const startIndex = Math.abs(seed) % keys.length;
  return keys.map((_, index) => keys[(startIndex + index) % keys.length]);
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function slugifyEntity(entity: string): string {
  return entity.replace(/[^a-zA-Z0-9_-]/g, "");
}

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix = "item"): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function decodeBase64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatResponseLine(response: Record<string, unknown>): string {
  const questionId = normalizeText(response.question_id);
  const questionText = normalizeText(response.question_text);
  const answer = typeof response.answer === "number" ? String(response.answer) : normalizeText(response.answer);
  const selected =
    Array.isArray(response.selected_options) && response.selected_options.length > 0
      ? response.selected_options.map((value) => normalizeText(value)).filter(Boolean).join(" | ")
      : "";
  const tags =
    Array.isArray(response.tags) && response.tags.length > 0
      ? response.tags.map((value) => normalizeText(value)).filter(Boolean).join(", ")
      : "";

  return [
    questionId ? `Question ${questionId}` : "",
    questionText ? `Prompt: ${questionText}` : "",
    answer ? `Answer: ${answer}` : "",
    selected ? `Selected: ${selected}` : "",
    tags ? `Tags: ${tags}` : "",
  ]
    .filter(Boolean)
    .join(" || ");
}

function buildQuestionnaireContext(questionnaire: UploadedQuestionnaire | null, person: PersonId): string {
  if (!questionnaire?.responses?.length) {
    return `${person}: no uploaded questionnaire responses available.`;
  }

  const lines = questionnaire.responses.map((response) => formatResponseLine(response));
  return `${person} questionnaire (${questionnaire.responses.length} responses):\n${lines.join("\n")}`;
}

function buildQuestionnaireContextFromRecords(records: Record<string, unknown>[], person: PersonId): string {
  if (!records.length) {
    return `${person}: no questionnaire responses available yet for this relationship.`;
  }

  const lines = records.map((response) => formatResponseLine(response));
  return `${person} questionnaire (${records.length} responses):\n${lines.join("\n")}`;
}

function getScopedParticipants(source?: { participants?: string[] } | null): [string, string] {
  const merged = mergeParticipantNames(source?.participants);
  if (merged.length >= 2) return [merged[0], merged[1]];
  if (merged.length === 1) return [merged[0], "Other Person"];
  return ["Tony", "Drew"];
}

function normalizeScopedPerson(
  value: unknown,
  participants: [string, string],
  fallbackIndex = 0,
): PersonId {
  const normalized = normalizeText(value);
  if (!normalized) return participants[fallbackIndex] || participants[0];

  const directMatch = participants.find(
    (participant) => normalizeText(participant).toLowerCase() === normalized.toLowerCase(),
  );
  if (directMatch) return directMatch;
  if (normalized === "Tony") return participants[0];
  if (normalized === "Drew") return participants[1] || participants[0];
  return normalized;
}

function getScopedPartner(person: PersonId, participants: [string, string]): PersonId {
  return participants.find((participant) => participant !== person) || participants[1] || participants[0] || person;
}

function normalizeScopedScope(value: unknown, participants: [string, string]) {
  const normalized = normalizeText(value);
  if (!normalized || normalized === "Tony+Drew") return `${participants[0]}+${participants[1]}`;
  if (normalized === "Tony→Drew") return `${participants[0]}→${participants[1]}`;
  if (normalized === "Drew→Tony") return `${participants[1]}→${participants[0]}`;
  if (normalized === "Tony") return participants[0];
  if (normalized === "Drew") return participants[1];
  return normalized;
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed);
    return isObject(parsed) ? parsed : null;
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[0]);
      return isObject(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
}

function buildSchemaFallback(schema: unknown): unknown {
  if (!isObject(schema)) {
    return {
      message: "The AI service is temporarily rate-limited. Please try again in a moment.",
      fallback: true,
    };
  }

  if (schema.type === "object" && isObject(schema.properties)) {
    const result: Record<string, unknown> = {};
    Object.entries(schema.properties).forEach(([key, value]) => {
      result[key] = buildSchemaFallback(value);
    });
    result.fallback = true;
    return result;
  }

  if (schema.type === "array") {
    return [];
  }

  if (schema.type === "number" || schema.type === "integer") {
    return 0;
  }

  if (schema.type === "boolean") {
    return false;
  }

  return "";
}

function buildLlmFallback(body: Record<string, unknown> | null, error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  const fallbackText =
    detail.includes("429") || detail.toLowerCase().includes("rate limit")
      ? "The AI service is temporarily rate-limited. Please try again in a moment."
      : "The AI service is temporarily unavailable. Please try again in a moment.";

  if (body?.response_json_schema) {
    return buildSchemaFallback(body.response_json_schema);
  }

  return fallbackText;
}

function toStringArray(value: unknown, fallback: string[] = []): string[] {
  if (!Array.isArray(value)) return fallback;
  const next = value.map((item) => normalizeText(item)).filter(Boolean);
  return next.length > 0 ? next : fallback;
}

async function callGroq(
  env: Env,
  messages: GroqMessage[],
  seed: number,
  options?: { jsonMode?: boolean; requestedModel?: string },
): Promise<{ text: string; model: string; keyIndex: number }> {
  const keys = getGroqApiKeys(env);
  if (keys.length === 0) {
    throw new Error("groq_not_configured");
  }

  const rotatedKeys = getRotatedKeys(keys, seed);
  const model = getGroqModel(env, options?.requestedModel);
  let lastError: Error | null = null;

  for (let index = 0; index < rotatedKeys.length; index += 1) {
    const apiKey = rotatedKeys[index];
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.25,
        ...(options?.jsonMode ? { response_format: { type: "json_object" } } : {}),
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const retryable = response.status === 429 || response.status >= 500;
      lastError = new Error(`groq_${response.status}: ${errorText}`);
      if (retryable && index < rotatedKeys.length - 1) continue;
      throw lastError;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      model?: string;
    };
    const text = payload.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("groq_empty_response");

    return {
      text,
      model: payload.model || model,
      keyIndex: keys.indexOf(apiKey),
    };
  }

  throw lastError || new Error("groq_failed");
}

function getCorsHeaders(request: Request, env: Env) {
  const origin = request.headers.get("origin") || "*";
  const configured = (env.CORS_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const previewSuffixes = [".relateiq-growth.pages.dev"];
  const isLocalPreviewOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  const originAllowedByPreviewSuffix = previewSuffixes.some(
    (suffix) =>
      origin.startsWith("https://") &&
      origin.endsWith(suffix) &&
      origin !== `https://${suffix.replace(/^\./, "")}`,
  );
  const allowOrigin =
    configured.length === 0 || configured.includes(origin) || originAllowedByPreviewSuffix || isLocalPreviewOrigin
      ? origin
      : configured[0] || "*";

  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    "access-control-allow-headers": "Content-Type, Authorization, X-Relationship-Id",
    "content-type": "application/json; charset=utf-8",
  };
}

function json(data: unknown, request: Request, env: Env, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: getCorsHeaders(request, env),
  });
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

type SessionPayload = {
  user_id: string;
  email: string;
  name: string;
  issued_at: string;
};

function base64UrlEncode(input: string) {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return atob(`${normalized}${padding}`);
}

function authSecret(env: Env) {
  return env.AUTH_SECRET || "relateiq-demo-secret";
}

async function signPayload(payload: string, env: Env) {
  return sha256Hex(`${payload}.${authSecret(env)}`);
}

async function createSessionToken(session: SessionPayload, env: Env) {
  const payload = base64UrlEncode(JSON.stringify(session));
  const signature = await signPayload(payload, env);
  return `relateiq.${payload}.${signature}`;
}

async function readSessionUser(request: Request, env: Env, allowDefault = true) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token.startsWith("relateiq.")) {
    if (!allowDefault) return null;
    const fallback = await getUserByIdPersistent(env, DEFAULT_USER_ID);
    return fallback ? sanitizeUser(fallback) : null;
  }

  const [, payload, signature] = token.split(".");
  if (!payload || !signature) {
    if (!allowDefault) return null;
    const fallback = await getUserByIdPersistent(env, DEFAULT_USER_ID);
    return fallback ? sanitizeUser(fallback) : null;
  }

  const expected = await signPayload(payload, env);
  if (expected !== signature) return null;

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as SessionPayload;
    const user = await getUserByIdPersistent(env, parsed.user_id);
    return user ? sanitizeUser(user) : null;
  } catch {
    return null;
  }
}

function relationshipIdFrom(request: Request, url: URL, body?: unknown) {
  const headerValue = request.headers.get("x-relationship-id");
  if (headerValue) return normalizeText(headerValue);
  const queryValue = url.searchParams.get("relationship_id");
  if (queryValue) return normalizeText(queryValue);
  if (body && typeof body === "object" && "relationship_id" in body && body.relationship_id) {
    return normalizeText(body.relationship_id);
  }
  return "";
}

async function requireScopedRelationship(
  request: Request,
  env: Env,
  url: URL,
  body?: unknown,
) {
  const user = await readSessionUser(request, env, false);
  if (!user) return { error: "unauthorized", status: 401 as const };

  const relationshipId = relationshipIdFrom(request, url, body);
  if (!relationshipId) {
    return { error: "relationship_id_required", status: 400 as const };
  }

  const relationship = await getRelationshipPersistent(env, relationshipId);
  if (!relationship) {
    return { error: "relationship_not_found", status: 404 as const };
  }

  const memberships = await getMembershipsForUserPersistent(env, user.id);
  const hasMembership = memberships.some((membership) => membership.relationship_id === relationshipId);
  const derivedRole = hasMembership ? null : await inferRelationshipRolePersistent(env, relationship, user.id, [], user);
  if (!hasMembership && derivedRole !== "owner") {
    return { error: "forbidden", status: 403 as const };
  }

  const state = await buildState(env, relationshipId);
  if (!state) {
    return { error: "relationship_state_not_found", status: 404 as const };
  }

  return { user, relationship, state, relationshipId } as const;
}

async function requireRelationshipOwner(
  request: Request,
  env: Env,
  url: URL,
  body?: unknown,
) {
  const scoped = await requireScopedRelationship(request, env, url, body);
  if ("error" in scoped) return scoped;
  const effectiveRole = await inferRelationshipRolePersistent(env, scoped.relationship, scoped.user.id);
  const membership = await getMembershipForUserPersistent(env, scoped.relationshipId, scoped.user.id);
  if (effectiveRole !== "owner") {
    return { error: "forbidden", status: 403 as const };
  }
  return {
    ...scoped,
    membership:
      membership ||
      ({
        id: `derived_owner_${scoped.relationshipId}_${scoped.user.id}`,
        relationship_id: scoped.relationshipId,
        user_id: scoped.user.id,
        role: "owner",
      } satisfies RelationshipMembership),
  } as const;
}

function withRelationshipScope<T extends Record<string, unknown>>(
  record: T,
  relationshipId: string,
) {
  return {
    ...record,
    relationship_id: normalizeText(record.relationship_id) || relationshipId,
  };
}

function getResponseArray(
  raw: Record<string, unknown> | Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.responses)) return raw.responses as Array<Record<string, unknown>>;
  return [];
}

async function kvGetJson<T>(env: Env, key: string): Promise<T | null> {
  if (!env.QUESTIONNAIRES) return null;
  const value = await env.QUESTIONNAIRES.get(key, "json");
  return (value as T | null) || null;
}

async function kvPutJson(env: Env, key: string, value: unknown): Promise<void> {
  if (!env.QUESTIONNAIRES) throw new Error("storage_unavailable");
  await env.QUESTIONNAIRES.put(key, JSON.stringify(value));
}

async function kvDelete(env: Env, key: string): Promise<void> {
  if (!env.QUESTIONNAIRES) throw new Error("storage_unavailable");
  await env.QUESTIONNAIRES.delete(key);
}

function authKey(entity: string, id: string) {
  return `auth:${entity}:${id}`;
}

function getFrontendOrigin(request: Request) {
  const origin = normalizeText(request.headers.get("Origin"));
  if (origin) return origin.replace(/\/$/, "");
  return "https://relateiq-growth.pages.dev";
}

async function listAuthRecords<T extends { id: string }>(env: Env, entity: string): Promise<T[]> {
  if (!env.QUESTIONNAIRES) return [];
  const prefix = `auth:${entity}:`;
  const list = await env.QUESTIONNAIRES.list({ prefix, limit: 1000 });
  const values = await Promise.all(list.keys.map((item) => kvGetJson<T>(env, item.name)));
  return values.filter((value): value is T => Boolean(value));
}

function dedupeById<T extends { id: string }>(records: T[]) {
  return [...new Map(records.map((record) => [record.id, record])).values()];
}

async function saveAuthRecord<T extends { id: string }>(env: Env, entity: string, record: T) {
  await kvPutJson(env, authKey(entity, record.id), record);
  return record;
}

async function listUsers(env: Env): Promise<User[]> {
  return dedupeById<User>([...RELATEIQ_USERS, ...(await listAuthRecords<User>(env, "user"))]);
}

async function getUserByEmailPersistent(env: Env, email: string) {
  const normalized = normalizeText(email).toLowerCase();
  const users = await listUsers(env);
  return users.find((user) => user.email.toLowerCase() === normalized) || null;
}

async function getUserByIdPersistent(env: Env, id: string) {
  const users = await listUsers(env);
  return users.find((user) => user.id === id) || null;
}

async function listRelationships(env: Env): Promise<Relationship[]> {
  const deduped = dedupeById<Relationship>([
    ...RELATEIQ_RELATIONSHIPS,
    ...(await listAuthRecords<Relationship>(env, "relationship")),
  ]);
  return Promise.all(deduped.map((relationship) => reconcileRelationshipParticipantsPersistent(env, relationship)));
}

async function getRelationshipPersistent(env: Env, id: string) {
  const direct = await kvGetJson<Relationship>(env, authKey("relationship", id));
  if (direct) {
    return reconcileRelationshipParticipantsPersistent(env, direct);
  }
  const relationships = await listRelationships(env);
  return relationships.find((relationship) => relationship.id === id) || null;
}

async function listMemberships(env: Env): Promise<RelationshipMembership[]> {
  const memberships = dedupeById<RelationshipMembership>([
    ...RELATEIQ_MEMBERSHIPS,
    ...(await listAuthRecords<RelationshipMembership>(env, "membership")),
  ]);
  return Promise.all(memberships.map((membership) => reconcileMembershipRolePersistent(env, membership)));
}

async function reconcileMembershipRolePersistent(env: Env, membership: RelationshipMembership) {
  const shouldBeOwner =
    membership.user_id === "tony" &&
    (membership.relationship_id === DEFAULT_RELATIONSHIP_ID ||
      membership.relationship_id === "relationship_tony_drew_friendship");

  if (!shouldBeOwner || membership.role === "owner") {
    return membership;
  }

  const repaired: RelationshipMembership = {
    ...membership,
    role: "owner",
  };

  await saveAuthRecord(env, "membership", repaired);
  return repaired;
}

async function getMembershipsForUserPersistent(env: Env, userId: string) {
  const memberships = await listMemberships(env);
  return memberships.filter((membership) => membership.user_id === userId);
}

async function listInvites(env: Env): Promise<RelationshipInvite[]> {
  return dedupeById<RelationshipInvite>([
    ...(await listAuthRecords<RelationshipInvite>(env, "invite")),
  ]);
}

async function listOnboardingRecords(env: Env): Promise<RelationshipOnboarding[]> {
  return dedupeById<RelationshipOnboarding>([
    ...RELATEIQ_ONBOARDING,
    ...(await listAuthRecords<RelationshipOnboarding>(env, "onboarding")),
  ]);
}

function getInviteStatusPersistent(invite: RelationshipInvite): RelationshipInvite["status"] {
  if (invite.status === "accepted") return "accepted";
  if (new Date(invite.expires_at).getTime() < Date.now()) return "expired";
  return invite.status;
}

async function findInviteByTokenPersistent(env: Env, token: string) {
  const invites = await listInvites(env);
  const invite = invites.find((entry) => entry.invite_token === token) || null;
  if (!invite) return null;
  invite.status = getInviteStatusPersistent(invite);
  return invite;
}

async function getLatestOnboardingPersistent(env: Env, relationshipId: string, userId: string) {
  const records = await listOnboardingRecords(env);
  return (
    records
      .filter((entry) => entry.relationship_id === relationshipId && entry.user_id === userId)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0] || null
  );
}

async function getMembershipForUserPersistent(env: Env, relationshipId: string, userId: string) {
  const memberships = await listMemberships(env);
  return (
    memberships.find(
      (membership) => membership.relationship_id === relationshipId && membership.user_id === userId,
    ) || null
  );
}

async function inferRelationshipRolePersistent(
  env: Env,
  relationship: Relationship,
  userId: string,
  relationshipMemberships?: RelationshipMembership[],
  currentUser?: User | null,
) {
  const memberships = relationshipMemberships || (await listMemberships(env)).filter(
    (membership) => membership.relationship_id === relationship.id,
  );
  const membership = memberships.find((entry) => entry.user_id === userId) || null;
  if (membership?.role === "owner") return "owner" as const;

  const resolvedCurrentUser = currentUser || (await getUserByIdPersistent(env, userId));
  const hasOwner = memberships.some((entry) => entry.role === "owner");
  const firstParticipant = relationship.participants?.[0]?.trim().toLowerCase();
  const currentName = resolvedCurrentUser?.name?.trim().toLowerCase();

  if (!hasOwner && resolvedCurrentUser && firstParticipant && firstParticipant === currentName) {
    return "owner" as const;
  }

  if (
    resolvedCurrentUser?.id === "tony" &&
    (relationship.id === DEFAULT_RELATIONSHIP_ID || relationship.id === "relationship_tony_drew_friendship")
  ) {
    return "owner" as const;
  }

  return (membership?.role as "owner" | "participant" | undefined) || "participant";
}

async function countQuestionnaireResponsesForPersonPersistent(
  env: Env,
  relationshipId: string,
  personName: string,
) {
  const records = await listQuestionnaireResponseRecords(env);
  const normalized = normalizeText(personName).toLowerCase();
  return records.filter((record) => {
    const entityRelationshipId =
      normalizeText(
        (record.relationship_id as string | undefined) ||
          (record.data?.relationship_id as string | undefined),
      );
    const responsePerson = normalizeText(
      (record.data?.person_name as string | undefined) ||
        (record.data?.person as string | undefined) ||
        (record.person_name as string | undefined),
    ).toLowerCase();
    return entityRelationshipId === relationshipId && responsePerson === normalized;
  }).length;
}

function isSeededBaselineRelationship(relationshipId: string) {
  return relationshipId === DEFAULT_RELATIONSHIP_ID || relationshipId === "relationship_tony_drew_friendship";
}

async function buildRelationshipSummaryPersistent(
  env: Env,
  relationship: Relationship,
  userId: string,
): Promise<RelationshipSummary> {
  const memberships = await listMemberships(env);
  const users = await listUsers(env);
  const relationshipMemberships = memberships
    .filter((membership) => membership.relationship_id === relationship.id)
  const memberIds = relationshipMemberships.map((membership) => membership.user_id);
  const memberNames = users
    .filter((user) => memberIds.includes(user.id))
    .map((user) => user.name);
  const participantNames =
    relationship.participants?.length >= 2
      ? mergeParticipantNames(relationship.participants)
      : mergeParticipantNames(relationship.participants, memberNames);
  const currentUser = users.find((user) => user.id === userId) || null;
  const currentPersonName =
    participantNames.find(
      (participant) => participant.trim().toLowerCase() === (currentUser?.name || "").trim().toLowerCase(),
    ) || participantNames[0] || currentUser?.name || "Tony";
  const memberCount =
    relationshipMemberships.length ||
    (currentUser && participantNames.some((participant) => participant.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
      ? 1
      : 0);
  const isSeededBaseline = isSeededBaselineRelationship(relationship.id);
  return {
    ...relationship,
    member_count: memberCount,
    participant_names: participantNames,
    needs_onboarding: isSeededBaseline ? false : !(await getLatestOnboardingPersistent(env, relationship.id, userId)),
    needs_questionnaire: isSeededBaseline
      ? false
      : (await countQuestionnaireResponsesForPersonPersistent(env, relationship.id, currentPersonName)) < 94,
    current_person_name: currentPersonName,
    current_user_role: await inferRelationshipRolePersistent(
      env,
      relationship,
      userId,
      relationshipMemberships,
      currentUser,
    ),
  };
}

async function getRelationshipsForUserPersistent(env: Env, userId: string): Promise<RelationshipSummary[]> {
  const memberships = await getMembershipsForUserPersistent(env, userId);
  const relationshipIds = new Set(memberships.map((membership) => membership.relationship_id));
  const relationships = await listRelationships(env);
  const allowed = relationships.filter((relationship) => relationshipIds.has(relationship.id));
  return Promise.all(allowed.map((relationship) => buildRelationshipSummaryPersistent(env, relationship, userId)));
}

function defaultProcessingStyle(value: string) {
  return value.includes("time") ? "needs_time" : value.includes("mixed") ? "mixed" : "mixed";
}

function mergeParticipantNames(...groups: Array<Array<string> | undefined>) {
  return [...new Set(groups.flat().map((value) => normalizeText(value)).filter(Boolean))];
}

function parseRelationshipParticipants(name: string, creatorName: string) {
  const normalizedName = normalizeText(name);
  const creator = normalizeText(creatorName);
  const parts = normalizedName
    .split(/\s*(?:&|and|\/|\+)\s*/i)
    .map((value) => normalizeText(value))
    .filter(Boolean);

  if (parts.length >= 2) {
    return mergeParticipantNames([parts[0], parts[1]]);
  }

  return mergeParticipantNames([creator, "Other Person"]);
}

function parseParticipantNamesFromRelationshipName(name: string) {
  const normalizedName = normalizeText(name)
    .replace(/\s+[·•|-]\s+(romantic|friendship|family|other)$/i, "")
    .replace(/\s+—\s+(friendship lens|romantic lens|family lens)$/i, "");
  const parts = normalizedName
    .split(/\s*(?:&|and|\/|\+)\s*/i)
    .map((value) => normalizeText(value))
    .filter(Boolean);

  return parts.length >= 2 ? mergeParticipantNames([parts[0], parts[1]]) : [];
}

function shouldRepairRelationshipParticipants(relationship: Relationship, parsedNames: string[]) {
  if (parsedNames.length < 2) return false;
  const current = mergeParticipantNames(relationship.participants);
  if (current.length !== 2) return true;
  if (current.join("|").toLowerCase() === parsedNames.join("|").toLowerCase()) return false;

  const currentIsLegacyPair =
    current.length === 2 &&
    current.some((name) => name.toLowerCase() === "tony") &&
    current.some((name) => name.toLowerCase() === "drew");
  const parsedIsDifferentPair =
    parsedNames.join("|").toLowerCase() !== "tony|drew" &&
    parsedNames.join("|").toLowerCase() !== "drew|tony";

  return currentIsLegacyPair && parsedIsDifferentPair;
}

async function reconcileRelationshipParticipantsPersistent(env: Env, relationship: Relationship) {
  const parsedNames = parseParticipantNamesFromRelationshipName(relationship.name);
  if (!shouldRepairRelationshipParticipants(relationship, parsedNames)) {
    return relationship;
  }

  const repaired: Relationship = {
    ...relationship,
    participants: parsedNames,
    updated_at: nowIso(),
  };
  await saveAuthRecord(env, "relationship", repaired);
  return repaired;
}

async function upsertOnboardingProfile(
  env: Env,
  relationshipId: string,
  relationshipType: RelationshipType,
  user: PublicUser,
  onboarding: RelationshipOnboarding,
) {
  const id = `profile_${relationshipId}_${normalizeText(user.name).toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
  const existing = await getEntityRecord(env, "UserProfile", id, relationshipId);
  const summary =
    [onboarding.self_description, onboarding.communication_note]
      .filter(Boolean)
      .join(" ")
      .trim() || `${user.name}'s profile will deepen as more relationship-specific data is collected.`;
  const payload = {
    id,
    relationship_id: relationshipId,
    person_name: user.name,
    communication_style: onboarding.self_description || existing?.communication_style || "Still learning communication style",
    conflict_tendencies: existing?.conflict_tendencies || "Still learning conflict tendencies",
    emotional_triggers: existing?.emotional_triggers || [],
    needs_during_conflict: onboarding.support_style || existing?.needs_during_conflict || "Still learning support needs",
    processing_style:
      existing?.processing_style ||
      defaultProcessingStyle(`${onboarding.support_style} ${onboarding.communication_note}`.toLowerCase()),
    values_priorities: existing?.values_priorities || [],
    personality_traits: existing?.personality_traits || [],
    growth_areas: existing?.growth_areas || [],
    past_patterns: existing?.past_patterns || "",
    partner_perception: existing?.partner_perception || "",
    love_language: existing?.love_language || (relationshipType === "friendship" ? "Quality time" : "Not yet inferred"),
    ai_behavioral_summary: summary,
  };

  if (existing) {
    await updateEntityRecord(env, "UserProfile", id, payload, relationshipId);
  } else {
    await createEntityRecord(env, "UserProfile", payload, relationshipId);
  }
}

async function createUserAccountPersistent(env: Env, input: {
  email: string;
  password: string;
  name: string;
}) {
  const email = normalizeText(input.email).toLowerCase();
  const name = normalizeText(input.name);
  if (!email || !name || !input.password) {
    return { ok: false as const, error: "missing_required_fields" };
  }
  if (await getUserByEmailPersistent(env, email)) {
    return { ok: false as const, error: "email_already_exists" };
  }
  const user: User = {
    id: createId("user"),
    email,
    password_hash: await sha256Hex(input.password),
    name,
  };
  await saveAuthRecord(env, "user", user);
  return { ok: true as const, user };
}

async function createRelationshipForUserPersistent(env: Env, input: {
  creatorUserId: string;
  name: string;
  type: RelationshipType;
}) {
  const creator = await getUserByIdPersistent(env, input.creatorUserId);
  if (!creator) return { ok: false as const, error: "creator_not_found" };
  const trimmedName = normalizeText(input.name);
  if (!trimmedName) return { ok: false as const, error: "relationship_name_required" };
  const normalizedName = trimmedName.toLowerCase();
  const memberships = await getMembershipsForUserPersistent(env, creator.id);
  const relationships = await listRelationships(env);
  const existingRelationship = relationships.find((relationship) => {
    const isOwnedByCreator = memberships.some((membership) => membership.relationship_id === relationship.id);
    return (
      isOwnedByCreator &&
      relationship.type === input.type &&
      normalizeText(relationship.name).toLowerCase() === normalizedName
    );
  });
  if (existingRelationship) {
    return {
      ok: true as const,
      relationship: existingRelationship,
      summary: await buildRelationshipSummaryPersistent(env, existingRelationship, creator.id),
      reused: true,
    };
  }
  const timestamp = nowIso();
  const relationship: Relationship = {
    id: `relationship_${trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${crypto.randomUUID().slice(0, 8)}`,
    name: trimmedName,
    type: input.type,
    participants: parseRelationshipParticipants(trimmedName, creator.name),
    created_at: timestamp,
    updated_at: timestamp,
  };
  const membership: RelationshipMembership = {
    id: createId("membership"),
    relationship_id: relationship.id,
    user_id: creator.id,
    role: "owner",
  };
  await saveAuthRecord(env, "relationship", relationship);
  await saveAuthRecord(env, "membership", membership);
  return {
    ok: true as const,
    relationship,
    summary: await buildRelationshipSummaryPersistent(env, relationship, creator.id),
  };
}

async function createRelationshipInvitePersistent(env: Env, input: {
  relationshipId: string;
  invitedEmail: string;
  invitedName?: string;
  provisionalPassword?: string;
}) {
  const relationship = await getRelationshipPersistent(env, input.relationshipId);
  if (!relationship) return { ok: false as const, error: "relationship_not_found" };
  const invited_email = normalizeText(input.invitedEmail).toLowerCase();
  if (!invited_email) return { ok: false as const, error: "invite_email_required" };
  const inferredName =
    normalizeText(input.invitedName) ||
    normalizeText(invited_email.split("@")[0]).replace(/\b\w/g, (match) => match.toUpperCase());
  if (inferredName && (!relationship.participants || relationship.participants.length < 2)) {
    relationship.participants = mergeParticipantNames(relationship.participants, [inferredName]);
    relationship.updated_at = nowIso();
    await saveAuthRecord(env, "relationship", relationship);
  }
  let provisionalUser: User | null = null;
  if (normalizeText(input.provisionalPassword)) {
    const existingUser = await getUserByEmailPersistent(env, invited_email);
    if (existingUser) {
      provisionalUser = existingUser;
    } else {
      provisionalUser = {
        id: createId("user"),
        email: invited_email,
        password_hash: await sha256Hex(String(input.provisionalPassword || "")),
        name: inferredName || "Invited User",
      };
      await saveAuthRecord(env, "user", provisionalUser);
    }
  }
  const invites = await listInvites(env);
  const existingPending = invites.find(
    (invite) =>
      invite.relationship_id === input.relationshipId &&
      invite.invited_email === invited_email &&
      getInviteStatusPersistent(invite) === "pending",
  );
  if (existingPending) {
    const updatedPending: RelationshipInvite = {
      ...existingPending,
      invited_name: inferredName || existingPending.invited_name,
      temporary_password: String(input.provisionalPassword || "").trim() || existingPending.temporary_password,
    };
    await saveAuthRecord(env, "invite", updatedPending);
    return { ok: true as const, invite: updatedPending, reused: true, provisionalUser: provisionalUser ? sanitizeUser(provisionalUser) : null };
  }
  const invite: RelationshipInvite = {
    id: createId("invite"),
    relationship_id: relationship.id,
    invited_email,
    invited_name: inferredName,
    provisional_user_id: provisionalUser?.id,
    temporary_password: String(input.provisionalPassword || "").trim() || undefined,
    invite_token: crypto.randomUUID().replace(/-/g, ""),
    status: "pending",
    created_at: nowIso(),
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
  };
  await saveAuthRecord(env, "invite", invite);
  return {
    ok: true as const,
    invite,
    reused: false,
    provisionalUser: provisionalUser ? sanitizeUser(provisionalUser) : null,
  };
}

async function listRelationshipAdminRowsPersistent(env: Env, ownerUserId: string) {
  const relationships = await getRelationshipsForUserPersistent(env, ownerUserId);
  const invites = await listInvites(env);
  const memberships = await listMemberships(env);
  const users = await listUsers(env);

  const ownedRelationships = relationships.filter((relationship) => relationship.current_user_role === "owner");

  return ownedRelationships
    .map((relationship) => {
      const invite = invites
        .filter((entry) => entry.relationship_id === relationship.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] || null;
      const relationshipMemberships = memberships.filter((entry) => entry.relationship_id === relationship.id);
      const secondaryMembership = relationshipMemberships.find((entry) => entry.user_id !== ownerUserId) || null;
      const secondaryUser = secondaryMembership ? users.find((user) => user.id === secondaryMembership.user_id) || null : null;
      return {
        relationship_id: relationship.id,
        relationship_name: relationship.name,
        relationship_type: relationship.type,
        user_name:
          invite?.invited_name ||
          secondaryUser?.name ||
          relationship.participant_names.find((name) => name.trim().toLowerCase() !== (relationship.current_person_name || "").trim().toLowerCase()) ||
          "Other Person",
        email: invite?.invited_email || secondaryUser?.email || "",
        temporary_password: invite?.temporary_password || "",
        invite_status: invite ? getInviteStatusPersistent(invite) : secondaryUser ? "accepted" : "pending",
        invite_link: invite ? `${getFrontendOrigin(new Request("https://relateiq-growth.pages.dev"))}/invite/${invite.invite_token}` : "",
        member_count: relationship.member_count,
        current_user_role: relationship.current_user_role,
      };
    })
    .sort((a, b) => a.relationship_name.localeCompare(b.relationship_name));
}

async function updateRelationshipAdminEntryPersistent(
  env: Env,
  ownerUserId: string,
  relationshipId: string,
  input: {
    relationshipName?: string;
    relationshipType?: RelationshipType;
    inviteName?: string;
    inviteEmail?: string;
    temporaryPassword?: string;
  },
) {
  const relationship = await getRelationshipPersistent(env, relationshipId);
  if (!relationship) return { ok: false as const, error: "relationship_not_found" };
  const role = await inferRelationshipRolePersistent(env, relationship, ownerUserId);
  if (role !== "owner") return { ok: false as const, error: "forbidden" };

  const trimmedRelationshipName = normalizeText(input.relationshipName || "");
  if (trimmedRelationshipName) {
    relationship.name = trimmedRelationshipName;
    relationship.type = (input.relationshipType || relationship.type) as RelationshipType;
    relationship.participants = parseRelationshipParticipants(trimmedRelationshipName, relationship.participants?.[0] || "Owner");
    relationship.updated_at = nowIso();
    await saveAuthRecord(env, "relationship", relationship);
  } else if (input.relationshipType && input.relationshipType !== relationship.type) {
    relationship.type = input.relationshipType;
    relationship.updated_at = nowIso();
    await saveAuthRecord(env, "relationship", relationship);
  }

  const invites = await listInvites(env);
  const invite = invites
    .filter((entry) => entry.relationship_id === relationshipId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] || null;

  if (invite) {
    const nextName = normalizeText(input.inviteName || "") || invite.invited_name || "";
    const nextEmail = normalizeText(input.inviteEmail || "").toLowerCase() || invite.invited_email;
    const nextPassword = String(input.temporaryPassword || "").trim() || invite.temporary_password || "";

    invite.invited_name = nextName || invite.invited_name;
    invite.invited_email = nextEmail;
    invite.temporary_password = nextPassword || undefined;
    await saveAuthRecord(env, "invite", invite);

    if (invite.provisional_user_id) {
      const provisionalUser = await getUserByIdPersistent(env, invite.provisional_user_id);
      if (provisionalUser) {
        provisionalUser.name = nextName || provisionalUser.name;
        provisionalUser.email = nextEmail || provisionalUser.email;
        if (nextPassword) {
          provisionalUser.password_hash = await sha256Hex(nextPassword);
        }
        await saveAuthRecord(env, "user", provisionalUser);
      }
    }
  }

  return { ok: true as const, relationships: await getRelationshipsForUserPersistent(env, ownerUserId), adminRows: await listRelationshipAdminRowsPersistent(env, ownerUserId) };
}

async function deleteRelationshipAdminEntryPersistent(env: Env, ownerUserId: string, relationshipId: string) {
  const relationship = await getRelationshipPersistent(env, relationshipId);
  if (!relationship) return { ok: false as const, error: "relationship_not_found" };
  if (relationshipId === DEFAULT_RELATIONSHIP_ID || relationshipId === "relationship_tony_drew_friendship") {
    return { ok: false as const, error: "cannot_delete_seeded_relationship" };
  }
  const role = await inferRelationshipRolePersistent(env, relationship, ownerUserId);
  if (role !== "owner") return { ok: false as const, error: "forbidden" };

  const memberships = await listMemberships(env);
  const invites = await listInvites(env);
  const onboarding = await listOnboardingRecords(env);

  await kvDelete(env, authKey("relationship", relationshipId));

  for (const membership of memberships.filter((entry) => entry.relationship_id === relationshipId)) {
    await kvDelete(env, authKey("membership", membership.id));
  }

  for (const invite of invites.filter((entry) => entry.relationship_id === relationshipId)) {
    await kvDelete(env, authKey("invite", invite.id));
  }

  for (const entry of onboarding.filter((item) => item.relationship_id === relationshipId)) {
    await kvDelete(env, authKey("onboarding", entry.id));
  }

  if (env.QUESTIONNAIRES) {
    const list = await env.QUESTIONNAIRES.list({ prefix: "data:", limit: 1000 });
    for (const key of list.keys) {
      const record = await kvGetJson<Record<string, unknown>>(env, key.name);
      if (normalizeText((record?.relationship_id as string | undefined) || "") === relationshipId) {
        await kvDelete(env, key.name);
      }
    }
  }

  return { ok: true as const, relationships: await getRelationshipsForUserPersistent(env, ownerUserId), adminRows: await listRelationshipAdminRowsPersistent(env, ownerUserId) };
}

async function getInviteLookupPersistent(env: Env, token: string, currentUserId?: string) {
  const invite = await findInviteByTokenPersistent(env, token);
  if (!invite) return null;
  const relationship = await getRelationshipPersistent(env, invite.relationship_id);
  if (!relationship) return null;
  const memberships = await listMemberships(env);
  const currentUser = currentUserId ? await getUserByIdPersistent(env, currentUserId) : null;
  const inviterMembership = memberships.find((membership) => membership.relationship_id === relationship.id);
  const inviter = inviterMembership ? await getUserByIdPersistent(env, inviterMembership.user_id) : null;
  return {
    invite,
    relationship: await buildRelationshipSummaryPersistent(env, relationship, currentUser?.id || DEFAULT_USER_ID),
    inviter: inviter ? sanitizeUser(inviter) : null,
    already_member: !!currentUser && memberships.some(
      (membership) => membership.relationship_id === relationship.id && membership.user_id === currentUser.id,
    ),
  };
}

async function acceptRelationshipInvitePersistent(env: Env, input: { token: string; userId: string }) {
  const invite = await findInviteByTokenPersistent(env, input.token);
  if (!invite) return { ok: false as const, error: "invite_not_found" };
  if (invite.status === "expired") return { ok: false as const, error: "invite_expired" };
  const user = await getUserByIdPersistent(env, input.userId);
  const relationship = await getRelationshipPersistent(env, invite.relationship_id);
  if (!user || !relationship) return { ok: false as const, error: "relationship_not_found" };
  const memberships = await listMemberships(env);
  let alreadyMember = memberships.some(
    (membership) => membership.relationship_id === relationship.id && membership.user_id === user.id,
  );
  if (!alreadyMember) {
    await saveAuthRecord(env, "membership", {
      id: createId("membership"),
      relationship_id: relationship.id,
      user_id: user.id,
      role: "participant",
    } satisfies RelationshipMembership);
    if (!relationship.participants || relationship.participants.length < 2) {
      relationship.participants = mergeParticipantNames(relationship.participants, [user.name]);
      relationship.updated_at = nowIso();
      await saveAuthRecord(env, "relationship", relationship);
    }
  }
  invite.status = "accepted";
  await saveAuthRecord(env, "invite", invite);
  return {
    ok: true as const,
    relationship,
    summary: await buildRelationshipSummaryPersistent(env, relationship, user.id),
    alreadyMember,
  };
}

async function submitRelationshipOnboardingPersistent(env: Env, input: {
  relationshipId: string;
  userId: string;
  selfDescription: string;
  supportStyle: string;
  supportNotes: string;
  communicationNote: string;
  skipped?: boolean;
}) {
  const relationship = await getRelationshipPersistent(env, input.relationshipId);
  const user = await getUserByIdPersistent(env, input.userId);
  if (!relationship || !user) {
    return { ok: false as const, error: "relationship_not_found" };
  }
  const entry: RelationshipOnboarding = {
    id: createId("onboarding"),
    relationship_id: relationship.id,
    user_id: user.id,
    self_description: normalizeText(input.selfDescription),
    support_style: normalizeText(input.supportStyle),
    support_notes: normalizeText(input.supportNotes),
    communication_note: normalizeText(input.communicationNote),
    skipped: Boolean(input.skipped),
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  await saveAuthRecord(env, "onboarding", entry);
  await upsertOnboardingProfile(env, relationship.id, relationship.type, sanitizeUser(user), entry);
  return { ok: true as const, onboarding: entry };
}

async function buildDynamicRelationshipState(env: Env, relationshipId: string): Promise<AppState | null> {
  const relationship = await getRelationshipPersistent(env, relationshipId);
  if (!relationship) return null;
  const participantNames = relationship.participants?.length > 0 ? relationship.participants : ["Participant", "Other Person"];
  const profiles = await queryEntityCollection(env, "UserProfile", new URL("https://local/api/data/UserProfile"), relationshipId);
  const questionnaireRecords = await listQuestionnaireResponseRecords(env);
  const counts = new Map<string, number>();
  questionnaireRecords
    .filter((record) => normalizeText(record.relationship_id) === relationshipId)
    .forEach((record) => {
      const person = normalizeText(record.person_name);
      if (!person) return;
      counts.set(person, (counts.get(person) || 0) + 1);
    });

  return {
    relationship_id: relationship.id,
    relationship,
    productName: "RelateIQ",
    migrationState: `${relationship.type} relationship context with isolated intelligence and memory.`,
    questionnaireImported: participantNames.every((person) => (counts.get(person) || 0) >= 94),
    profiles: participantNames.map((person) => {
      const existing = profiles.find((profile) => normalizeText(profile.person_name) === person);
      return {
        relationship_id: relationship.id,
        person,
        relationshipRole: relationship.type === "friendship" ? "Friend" : "Participant",
        communicationStyle: normalizeText(existing?.communication_style) || "Still learning from onboarding and future sessions",
        likelyNeedsUnderStress: [normalizeText(existing?.needs_during_conflict) || "Complete onboarding or questionnaire to seed support preferences"],
        repairPreferences: ["No repair preferences recorded yet"],
        appreciationLanguage: [normalizeText(existing?.love_language) || "Not captured yet"],
        summary:
          normalizeText(existing?.ai_behavioral_summary) ||
          `${person}'s profile for this relationship starts clean and grows only from this relationship's onboarding, questionnaire, and interaction history.`,
      };
    }),
    questionnaires: participantNames.map((person) => ({
      relationship_id: relationship.id,
      person,
      totalQuestions: 94,
      importedQuestions: counts.get(person) || 0,
      sourceFile: "",
      importReady: (counts.get(person) || 0) >= 94,
      notes: [
        "No cross-relationship data is used here.",
        "This participant's analysis will grow only from this relationship's questionnaire and activity.",
      ],
    } satisfies QuestionnaireSummary)),
    triggers: [],
    insights: [],
    tools: RELATEIQ_STATE.tools.map((tool) => ({ ...tool, relationship_id: relationship.id })),
  };
}

async function loadUploadedQuestionnaire(env: Env, person: PersonId): Promise<UploadedQuestionnaire | null> {
  return kvGetJson<UploadedQuestionnaire>(env, `questionnaire:${person}`);
}

async function listEntityRecords(env: Env, entity: string): Promise<StoredRecord[]> {
  if (!env.QUESTIONNAIRES) return [];
  const prefix = `data:${slugifyEntity(entity)}:`;
  const list = await env.QUESTIONNAIRES.list({ prefix, limit: 1000 });
  const values = await Promise.all(list.keys.map((item) => kvGetJson<StoredRecord>(env, item.name)));
  return values.filter((value): value is StoredRecord => Boolean(value));
}

function toQuestionnaireRecord(
  person: PersonId,
  response: Record<string, unknown>,
  uploadedAt?: string,
  relationshipId = DEFAULT_RELATIONSHIP_ID,
): StoredRecord {
  const questionId = normalizeText(response.question_id) || createId("question");
  return {
    ...response,
    id: `${person}:${questionId}`,
    relationship_id: relationshipId,
    person_name: response.person_name || person,
    created_date: normalizeText(response.created_date) || uploadedAt || nowIso(),
    updated_date: normalizeText(response.updated_date) || uploadedAt || nowIso(),
  };
}

async function listQuestionnaireResponseRecords(env: Env): Promise<StoredRecord[]> {
  const questionnaires = await Promise.all([
    loadUploadedQuestionnaire(env, "Tony"),
    loadUploadedQuestionnaire(env, "Drew"),
  ]);

  const uploadedRecords = questionnaires.flatMap((questionnaire) => {
    if (!questionnaire) return [];
    return questionnaire.responses.map((response) =>
      toQuestionnaireRecord(questionnaire.person, response, questionnaire.uploadedAt, DEFAULT_RELATIONSHIP_ID),
    );
  });

  const persistedRecords = await listEntityRecords(env, "QuestionnaireResponse");
  return [...uploadedRecords, ...persistedRecords];
}

async function getRelationshipQuestionnaireRecords(
  env: Env,
  relationshipId: string,
  person: PersonId,
) {
  const records = await listQuestionnaireResponseRecords(env);
  return records.filter(
    (record) =>
      normalizeText(record.relationship_id) === relationshipId &&
      normalizeText(record.person_name).toLowerCase() === normalizeText(person).toLowerCase(),
  );
}

async function getQuestionnaireContextForRelationshipParticipant(
  env: Env,
  relationshipId: string,
  person: PersonId,
) {
  if (relationshipId === DEFAULT_RELATIONSHIP_ID && (person === "Tony" || person === "Drew")) {
    return buildQuestionnaireContext(await loadUploadedQuestionnaire(env, person), person);
  }

  const records = await getRelationshipQuestionnaireRecords(env, relationshipId, person);
  return buildQuestionnaireContextFromRecords(records, person);
}

async function getQuestionnaireResponseRecord(env: Env, id: string): Promise<StoredRecord | null> {
  const records = await listQuestionnaireResponseRecords(env);
  return records.find((record) => record.id === id) || null;
}

type QuestionnairePrefillLabels = {
  counterpart: string;
  counterpartPossessive: string;
  yourCounterpart: string;
  myCounterpart: string;
  bond: string;
  careWord: string;
  affection: string;
  affectionExtended: string;
};

function getQuestionnairePrefillLabels(relationshipType: RelationshipType): QuestionnairePrefillLabels {
  switch (relationshipType) {
    case "friendship":
      return {
        counterpart: "friend",
        counterpartPossessive: "your friend's",
        yourCounterpart: "your friend",
        myCounterpart: "my friend",
        bond: "friendship",
        careWord: "cared for",
        affection: "Signs of closeness or warmth",
        affectionExtended: "Physical closeness or reassuring warmth",
      };
    case "family":
      return {
        counterpart: "family member",
        counterpartPossessive: "your family member's",
        yourCounterpart: "your family member",
        myCounterpart: "my family member",
        bond: "family connection",
        careWord: "cared for",
        affection: "Signs of warmth or reassurance",
        affectionExtended: "Physical closeness or reassuring warmth",
      };
    case "other":
      return {
        counterpart: "other person",
        counterpartPossessive: "the other person's",
        yourCounterpart: "the other person",
        myCounterpart: "the other person",
        bond: "connection",
        careWord: "cared for",
        affection: "Signs of warmth or closeness",
        affectionExtended: "Physical closeness or reassuring warmth",
      };
    case "romantic":
    default:
      return {
        counterpart: "partner",
        counterpartPossessive: "your partner's",
        yourCounterpart: "your partner",
        myCounterpart: "my partner",
        bond: "relationship",
        careWord: "loved",
        affection: "Lack of affection",
        affectionExtended: "Physical affection or closeness",
      };
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyQuestionnairePrefillTextReplacements(
  text: string,
  relationshipType: RelationshipType,
  sourceCounterpartName?: string,
  targetCounterpartName?: string,
) {
  const labels = getQuestionnairePrefillLabels(relationshipType);
  let next = String(text || "");
  if (sourceCounterpartName && targetCounterpartName && sourceCounterpartName !== targetCounterpartName) {
    const sourcePattern = new RegExp(`\\b${escapeRegExp(sourceCounterpartName)}\\b`, "gi");
    next = next.replace(sourcePattern, targetCounterpartName);
  }
  return next
    .replace(/\byour partner's\b/gi, labels.counterpartPossessive)
    .replace(/\byour partner\b/gi, labels.yourCounterpart)
    .replace(/\bmy partner\b/gi, labels.myCounterpart)
    .replace(/\bpartner's\b/gi, labels.counterpartPossessive)
    .replace(/\bpartner\b/gi, labels.counterpart)
    .replace(/\bthis relationship\b/gi, `this ${labels.bond}`)
    .replace(/\bthe relationship\b/gi, `the ${labels.bond}`)
    .replace(/\bin the relationship\b/gi, `in the ${labels.bond}`)
    .replace(/\bour relationship\b/gi, `our ${labels.bond}`)
    .replace(/\bthe relationship's\b/gi, `the ${labels.bond}'s`)
    .replace(/\brelationship\b/gi, labels.bond)
    .replace(/\bfully loved\b/gi, labels.careWord)
    .replace(/\blove look like\b/gi, relationshipType === "romantic" ? "love look like" : "care and closeness look like")
    .replace(/\bfeel loved or approved of\b/gi, relationshipType === "romantic" ? "feel loved or approved of" : "feel accepted, cared for, or approved of")
    .replace(/\blove, compliments, or care\b/gi, relationshipType === "romantic" ? "love, compliments, or care" : "care, compliments, or support")
    .replace(/\bLack of affection\b/gi, labels.affection)
    .replace(/\bPhysical affection or closeness\b/gi, labels.affectionExtended)
    .replace(/\bPhysical affection\b/gi, labels.affection);
}

const PREFILL_MANUAL_REVIEW_PATTERN =
  /\b(sex|sexual|kiss(?:ing)?|make\s*out|boyfriend|girlfriend|husband|wife|dating|date\s*night|romantic|marriage|married|top\b|bottom\b|dominant|submissive|bedroom|orgasm|foreplay)\b/i;

function questionnaireAnswerNeedsManualReview(value: unknown, relationshipType: RelationshipType) {
  if (relationshipType === "romantic") return false;
  return typeof value === "string" && PREFILL_MANUAL_REVIEW_PATTERN.test(value);
}

function adaptQuestionnaireFieldValue(
  value: unknown,
  relationshipType: RelationshipType,
  sourceCounterpartName?: string,
  targetCounterpartName?: string,
): unknown {
  if (typeof value === "string") {
    return applyQuestionnairePrefillTextReplacements(
      value,
      relationshipType,
      sourceCounterpartName,
      targetCounterpartName,
    );
  }
  if (Array.isArray(value)) {
    return value.map((entry) =>
      typeof entry === "string"
        ? applyQuestionnairePrefillTextReplacements(entry, relationshipType, sourceCounterpartName, targetCounterpartName)
        : entry,
    );
  }
  return value;
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function rewriteQuestionnaireAnswersWithAi(
  env: Env,
  relationship: RelationshipSummary,
  personName: string,
  sourceRecords: QuestionnaireSummary[],
  sourceCounterpartName?: string,
  targetCounterpartName?: string,
) {
  if (relationship.type === "romantic") return new Map<string, string>();

  const stringAnswerRecords = sourceRecords.filter(
    (record) => typeof record.answer === "string" && normalizeText(record.answer),
  );
  if (stringAnswerRecords.length === 0) return new Map<string, string>();

  const relationshipNoun =
    relationship.type === "friendship"
      ? "best-friend / close-friend relationship"
      : relationship.type === "family"
        ? "family relationship"
        : "non-romantic relationship";

  const rewrites = new Map<string, string>();
  const batches = chunkArray(stringAnswerRecords, 50);

  for (const batch of batches) {
    const messages: GroqMessage[] = [
      {
        role: "system",
        content:
          "You rewrite questionnaire answers for RelateIQ. Transform previously romantic answers so they fit a new relationship context without inventing new life history. Return strict JSON with one key: rewrites. rewrites must be an array of objects with question_id and answer. Rules: keep the speaker's personality, needs, habits, boundaries, stress patterns, and communication style intact; rewrite references to the original romantic counterpart so they fit the new context; for friendship, make the answer sound like it is about a close best friend; for family, make it sound like it is about a family member; for other, make it sound like it is about a meaningful but non-romantic person. Do not be romantic or sexual unless the new context is romantic. If the original answer is deeply romantic or sexual, convert it into the closest non-romantic equivalent around trust, closeness, comfort, boundaries, loyalty, or support. Keep answers concise, natural, and first-person. Do not mention that you are rewriting anything.",
      },
      {
        role: "user",
        content: JSON.stringify({
          relationship_type: relationship.type,
          relationship_name: relationship.name,
          target_relationship_context: relationshipNoun,
          speaker: personName,
          original_counterpart: sourceCounterpartName || "the original counterpart",
          new_counterpart: targetCounterpartName || "the other person",
          rewrites: batch.map((record) => ({
            question_id: normalizeText(record.question_id),
            question_text: normalizeText(record.question_text),
            original_answer: normalizeText(record.answer),
          })),
        }),
      },
    ];

    try {
      const groq = await callGroq(
        env,
        messages,
        batch.length + relationship.id.length + personName.length,
        { jsonMode: true },
      );
      const parsed = parseJsonObject(groq.text);
      const items = Array.isArray(parsed?.rewrites) ? parsed.rewrites : [];
      for (const item of items) {
        if (!isObject(item)) continue;
        const questionId = normalizeText(item.question_id);
        const answer = normalizeText(item.answer);
        if (!questionId || !answer) continue;
        rewrites.set(questionId, answer);
      }
    } catch {
      for (const record of batch) {
        const questionId = normalizeText(record.question_id);
        if (!questionId) continue;
        rewrites.set(
          questionId,
          String(
            adaptQuestionnaireFieldValue(
              record.answer,
              relationship.type,
              sourceCounterpartName,
              targetCounterpartName,
            ) || "",
          ),
        );
      }
    }
  }

  return rewrites;
}

async function prefillQuestionnaireForRelationshipPersistent(
  env: Env,
  relationship: RelationshipSummary,
  personName: string,
  options?: { overwrite?: boolean },
) {
  const normalizedPerson = normalizeText(personName);
  const sourceRecords = await getRelationshipQuestionnaireRecords(env, DEFAULT_RELATIONSHIP_ID, normalizedPerson);
  if (sourceRecords.length === 0) {
    return {
      ok: false as const,
      error: "baseline_questionnaire_not_found",
      relationship_id: relationship.id,
      relationship_name: relationship.name,
      person_name: normalizedPerson,
    };
  }

  const existingRecords = await getRelationshipQuestionnaireRecords(env, relationship.id, normalizedPerson);
  const existingByQuestionId = new Map(
    existingRecords.map((record) => [normalizeText(record.question_id), record]),
  );
  const targetCounterpartName =
    relationship.participant_names.find(
      (entry) => normalizeText(entry).toLowerCase() !== normalizedPerson.toLowerCase(),
    ) || relationship.participant_names[1] || "Other Person";
  const sourceCounterpartName = normalizedPerson === "Tony" ? "Drew" : normalizedPerson === "Drew" ? "Tony" : "";
  const aiRewrites = await rewriteQuestionnaireAnswersWithAi(
    env,
    relationship,
    normalizedPerson,
    sourceRecords,
    sourceCounterpartName,
    targetCounterpartName,
  );

  let copied = 0;
  let skippedExisting = 0;
  const manualReviewQuestionIds: string[] = [];

  for (const sourceRecord of sourceRecords) {
    const questionId = normalizeText(sourceRecord.question_id);
    if (!questionId) continue;
    const existing = existingByQuestionId.get(questionId);
    if (existing && !options?.overwrite) {
      skippedExisting += 1;
      continue;
    }

    const sourceAnswer = sourceRecord.answer;
    if (questionnaireAnswerNeedsManualReview(sourceAnswer, relationship.type)) {
      manualReviewQuestionIds.push(questionId);
      continue;
    }

    const payload: Record<string, unknown> = {
      ...sourceRecord,
      person_name: normalizedPerson,
      question_id: questionId,
      category: sourceRecord.category,
      question_text: adaptQuestionnaireFieldValue(
        sourceRecord.question_text,
        relationship.type,
        sourceCounterpartName,
        targetCounterpartName,
      ),
      answer:
        aiRewrites.get(questionId) ||
        adaptQuestionnaireFieldValue(
          sourceAnswer,
          relationship.type,
          sourceCounterpartName,
          targetCounterpartName,
        ),
      selected_options: adaptQuestionnaireFieldValue(
        sourceRecord.selected_options,
        relationship.type,
        sourceCounterpartName,
        targetCounterpartName,
      ),
      ranking: adaptQuestionnaireFieldValue(
        sourceRecord.ranking,
        relationship.type,
        sourceCounterpartName,
        targetCounterpartName,
      ),
      mode: sourceRecord.mode,
      tags: sourceRecord.tags,
      weight: sourceRecord.weight,
    };

    await upsertQuestionnaireResponse(env, payload, normalizeText(existing?.id), relationship.id);
    copied += 1;
  }

  return {
    ok: true as const,
    relationship_id: relationship.id,
    relationship_name: relationship.name,
    person_name: normalizedPerson,
    copied,
    skipped_existing: skippedExisting,
    manual_review_question_ids: manualReviewQuestionIds,
  };
}

async function prefillQuestionnairesFromBaselinePersistent(
  env: Env,
  user: PublicUser,
  options?: {
    relationshipId?: string;
    personName?: string;
    overwrite?: boolean;
    allEligible?: boolean;
  },
) {
  const relationships = await getRelationshipsForUserPersistent(env, user.id);
  const targetRelationships = relationships.filter((relationship) => {
    if (relationship.type === "romantic") return false;
    if (options?.relationshipId && relationship.id !== options.relationshipId) return false;
    if (options?.personName && normalizeText(relationship.current_person_name) !== normalizeText(options.personName)) return false;
    return Boolean(relationship.current_person_name);
  });

  const results = [];
  for (const relationship of targetRelationships) {
    results.push(
      await prefillQuestionnaireForRelationshipPersistent(env, relationship, relationship.current_person_name, {
        overwrite: options?.overwrite,
      }),
    );
    if (!options?.allEligible && options?.relationshipId) {
      break;
    }
  }
  return results;
}

async function upsertQuestionnaireResponse(
  env: Env,
  incoming: Record<string, unknown>,
  existingId?: string,
  relationshipId = DEFAULT_RELATIONSHIP_ID,
): Promise<StoredRecord> {
  if (relationshipId !== DEFAULT_RELATIONSHIP_ID) {
    const person = normalizeText(incoming.person_name) || normalizeText(existingId?.split(":")[0]) || "Participant";
    const questionId =
      normalizeText(incoming.question_id) ||
      normalizeText(existingId?.split(":").slice(1).join(":")) ||
      createId("question");
    const baseId =
      normalizeText(existingId) ||
      `question_${slugifyEntity(relationshipId)}_${slugifyEntity(person)}_${slugifyEntity(questionId)}`;
    const current = existingId ? await getEntityRecord(env, "QuestionnaireResponse", baseId, relationshipId) : null;
    const timestamp = nowIso();
    const record: StoredRecord = {
      ...(current || {}),
      ...withRelationshipScope(incoming, relationshipId),
      id: baseId,
      relationship_id: relationshipId,
      person_name: person,
      question_id: questionId,
      created_date: normalizeText(current?.created_date) || timestamp,
      updated_date: timestamp,
    };
    await kvPutJson(env, `data:${slugifyEntity("QuestionnaireResponse")}:${record.id}`, record);
    return record;
  }

  const person = incoming.person_name === "Drew" || existingId?.startsWith("Drew:") ? "Drew" : "Tony";
  const questionnaire = (await loadUploadedQuestionnaire(env, person)) || {
    person,
    fileName: `${person.toLowerCase()}.questionnaire.json`,
    uploadedAt: nowIso(),
    responses: [],
    raw: [],
  };

  const questionId =
    normalizeText(incoming.question_id) ||
    normalizeText(existingId?.split(":")[1]) ||
    createId("question");
  const existingIndex = questionnaire.responses.findIndex((response) => {
    const responseQuestionId = normalizeText(response.question_id);
    return responseQuestionId === questionId;
  });

  const current = existingIndex >= 0 ? questionnaire.responses[existingIndex] : {};
  const timestamp = nowIso();
  const nextResponse = {
    ...current,
    ...incoming,
    person_name: person,
    question_id: questionId,
    created_date:
      normalizeText(existingId) && isObject(current) && normalizeText(current.created_date)
        ? normalizeText(current.created_date)
        : timestamp,
    updated_date: timestamp,
  };

  if (existingIndex >= 0) {
    questionnaire.responses[existingIndex] = nextResponse;
  } else {
    questionnaire.responses.push(nextResponse);
  }

  questionnaire.uploadedAt = timestamp;
  questionnaire.raw = questionnaire.responses;
  await kvPutJson(env, `questionnaire:${person}`, questionnaire);
  return toQuestionnaireRecord(person, nextResponse, questionnaire.uploadedAt);
}

async function deleteQuestionnaireResponse(env: Env, id: string): Promise<boolean> {
  if (id.startsWith("question_")) {
    if (!env.QUESTIONNAIRES) return false;
    const key = `data:${slugifyEntity("QuestionnaireResponse")}:${id}`;
    const existing = await kvGetJson<StoredRecord>(env, key);
    if (!existing) return false;
    await env.QUESTIONNAIRES.delete(key);
    return true;
  }

  const [personPrefix, questionId] = id.split(":");
  const person: PersonId = personPrefix === "Drew" ? "Drew" : "Tony";
  const questionnaire = await loadUploadedQuestionnaire(env, person);
  if (!questionnaire) return false;

  const nextResponses = questionnaire.responses.filter(
    (response) => normalizeText(response.question_id) !== questionId,
  );
  if (nextResponses.length === questionnaire.responses.length) return false;

  questionnaire.responses = nextResponses;
  questionnaire.raw = nextResponses;
  questionnaire.uploadedAt = nowIso();
  await kvPutJson(env, `questionnaire:${person}`, questionnaire);
  return true;
}

function matchesQuery(record: Record<string, unknown>, query: Record<string, unknown>) {
  return Object.entries(query).every(([key, expected]) => {
    const actual = record[key];
    if (Array.isArray(expected)) {
      return Array.isArray(actual)
        ? expected.every((item) => actual.includes(item))
        : expected.includes(actual as never);
    }
    return String(actual ?? "") === String(expected ?? "");
  });
}

function sortRecords(records: StoredRecord[], sortValue?: string | null): StoredRecord[] {
  if (!sortValue) return records;
  const descending = sortValue.startsWith("-");
  const field = descending ? sortValue.slice(1) : sortValue;

  return [...records].sort((a, b) => {
    const left = a[field];
    const right = b[field];
    if (left === right) return 0;
    if (left === undefined || left === null) return descending ? 1 : -1;
    if (right === undefined || right === null) return descending ? -1 : 1;
    return descending
      ? String(right).localeCompare(String(left))
      : String(left).localeCompare(String(right));
  });
}

function sliceRecords(records: StoredRecord[], skipValue?: string | null, limitValue?: string | null) {
  const skip = Math.max(0, Number(skipValue || 0) || 0);
  const limit = Math.max(0, Number(limitValue || records.length) || records.length);
  return records.slice(skip, skip + limit);
}

const BASELINE_SEED_DATE = "2026-04-20T18:00:00.000Z";

const BASELINE_JOURNAL_SEEDS: StoredRecord[] = [
  {
    id: "journalentry_tony_drew_what_we_are_protecting",
    relationship_id: DEFAULT_RELATIONSHIP_ID,
    person_name: "Tony",
    title: "What We Are Trying To Protect",
    content:
      "What I want us to keep protecting is the feeling that we are on the same side, even when we miss each other. When we slow down, validate first, and stay curious instead of defensive, we do better. I want this relationship to feel intentional, emotionally safe, and honest for both of us.",
    entry_timestamp: BASELINE_SEED_DATE,
    created_date: BASELINE_SEED_DATE,
    updated_date: BASELINE_SEED_DATE,
  },
];

const BASELINE_VISION_PIN_SEEDS: StoredRecord[] = [
  {
    id: "visionpin_tony_drew_better_together",
    relationship_id: DEFAULT_RELATIONSHIP_ID,
    title: "Better Together",
    description:
      "Keep building a relationship that feels calmer, safer, and more intentional for both of us.",
    category: "intention",
    pinned_by: "Tony_Drew",
    emoji: "🫂",
    notes: "Lead with empathy, stay on the same side, and make repair visible.",
    shared: true,
    source: "seed",
    source_date: BASELINE_SEED_DATE.slice(0, 10),
    progress: "in_progress",
    created_date: BASELINE_SEED_DATE,
    updated_date: BASELINE_SEED_DATE,
  },
];

async function ensureBaselineSeedContent(env: Env, relationshipId = DEFAULT_RELATIONSHIP_ID) {
  if (!env.QUESTIONNAIRES) return;
  if (relationshipId !== DEFAULT_RELATIONSHIP_ID) return;

  const journalRecords = await listEntityRecords(env, "JournalEntry");
  const hasBaselineJournal = journalRecords.some(
    (record) => normalizeText(record.relationship_id) === DEFAULT_RELATIONSHIP_ID,
  );
  if (!hasBaselineJournal) {
    for (const seed of BASELINE_JOURNAL_SEEDS) {
      await kvPutJson(env, `data:${slugifyEntity("JournalEntry")}:${seed.id}`, seed);
    }
  }

  const visionRecords = await listEntityRecords(env, "VisionPin");
  const hasBaselineVision = visionRecords.some(
    (record) => normalizeText(record.relationship_id) === DEFAULT_RELATIONSHIP_ID,
  );
  if (!hasBaselineVision) {
    for (const seed of BASELINE_VISION_PIN_SEEDS) {
      await kvPutJson(env, `data:${slugifyEntity("VisionPin")}:${seed.id}`, seed);
    }
  }
}

function getBaselineSeedRecords(entity: string, relationshipId = DEFAULT_RELATIONSHIP_ID): StoredRecord[] {
  if (relationshipId !== DEFAULT_RELATIONSHIP_ID) return [];
  if (entity === "JournalEntry") return BASELINE_JOURNAL_SEEDS;
  if (entity === "VisionPin") return BASELINE_VISION_PIN_SEEDS;
  return [];
}

function mergeSeedRecords(records: StoredRecord[], entity: string, relationshipId = DEFAULT_RELATIONSHIP_ID) {
  const seeds = getBaselineSeedRecords(entity, relationshipId);
  if (seeds.length === 0) return records;
  const byId = new Map(records.map((record) => [normalizeText(record.id), record] as const));
  for (const seed of seeds) {
    if (!byId.has(normalizeText(seed.id))) {
      byId.set(normalizeText(seed.id), seed);
    }
  }
  return [...byId.values()];
}

function selectFields(records: StoredRecord[], fieldsValue?: string | null) {
  if (!fieldsValue) return records;
  const fields = fieldsValue.split(",").map((value) => value.trim()).filter(Boolean);
  if (fields.length === 0) return records;
  return records.map((record) => {
    const next: Record<string, unknown> = {};
    fields.forEach((field) => {
      next[field] = record[field];
    });
    return next;
  });
}

function dedupeMetricStateRecords(entity: string, records: StoredRecord[]) {
  if (entity !== "UserMetricState" && entity !== "CoupleMetricState") return records;

  const deduped = new Map<string, StoredRecord>();
  for (const record of records) {
    const ownerKey =
      entity === "UserMetricState"
        ? normalizeText(record.user_id)
        : normalizeText(record.couple_id);
    const metricKey = normalizeText(record.metric_name);
    if (!ownerKey || !metricKey) continue;

    const stableId =
      entity === "UserMetricState"
        ? `usermetricstate_${ownerKey}_${metricKey}`
        : `couplemetricstate_${ownerKey}_${metricKey}`;
    const compositeKey = `${ownerKey}:${metricKey}`;
    const current = deduped.get(compositeKey);
    if (!current) {
      deduped.set(compositeKey, record);
      continue;
    }

    const currentIsStable = normalizeText(current.id) === stableId;
    const nextIsStable = normalizeText(record.id) === stableId;
    if (nextIsStable && !currentIsStable) {
      deduped.set(compositeKey, record);
      continue;
    }
    if (nextIsStable === currentIsStable) {
      const currentUpdated = normalizeText(current.updated_date || current.created_date);
      const nextUpdated = normalizeText(record.updated_date || record.created_date);
      if (nextUpdated > currentUpdated) {
        deduped.set(compositeKey, record);
      }
    }
  }

  return [...deduped.values()];
}

async function queryEntityCollection(
  env: Env,
  entity: string,
  requestUrl: URL,
  relationshipId = DEFAULT_RELATIONSHIP_ID,
): Promise<Array<Record<string, unknown>>> {
  await ensureBaselineSeedContent(env, relationshipId);
  const records =
    entity === "QuestionnaireResponse"
      ? await listQuestionnaireResponseRecords(env)
      : await listEntityRecords(env, entity);

  const queryValue = requestUrl.searchParams.get("q");
  let filtered = dedupeMetricStateRecords(entity, mergeSeedRecords(records, entity, relationshipId));
  if (queryValue) {
    try {
      const parsed = JSON.parse(queryValue) as Record<string, unknown>;
      if (isObject(parsed)) {
        filtered = filtered.filter((record) => matchesQuery(record, parsed));
      }
    } catch {
      filtered = records;
    }
  }

  filtered = filtered.filter(
    (record) => normalizeText(record.relationship_id) === relationshipId,
  );

  const sorted = sortRecords(filtered, requestUrl.searchParams.get("sort"));
  const sliced = sliceRecords(sorted, requestUrl.searchParams.get("skip"), requestUrl.searchParams.get("limit"));
  return selectFields(sliced, requestUrl.searchParams.get("fields"));
}

async function getEntityRecord(
  env: Env,
  entity: string,
  id: string,
  relationshipId = DEFAULT_RELATIONSHIP_ID,
): Promise<StoredRecord | null> {
  await ensureBaselineSeedContent(env, relationshipId);
  if (entity === "QuestionnaireResponse") {
    const record = await getQuestionnaireResponseRecord(env, id);
    if (!record) return null;
    return normalizeText(record.relationship_id) === relationshipId ? record : null;
  }
  const record = await kvGetJson<StoredRecord>(env, `data:${slugifyEntity(entity)}:${id}`);
  if (!record) {
    const seeded = getBaselineSeedRecords(entity, relationshipId).find(
      (candidate) => normalizeText(candidate.id) === normalizeText(id),
    );
    return seeded || null;
  }
  return normalizeText(record.relationship_id) === relationshipId ? record : null;
}

async function createEntityRecord(
  env: Env,
  entity: string,
  body: Record<string, unknown>,
  relationshipId = DEFAULT_RELATIONSHIP_ID,
): Promise<StoredRecord> {
  if (entity === "QuestionnaireResponse") {
    return upsertQuestionnaireResponse(env, body, undefined, relationshipId);
  }

  const timestamp = nowIso();
  const record: StoredRecord = {
    ...withRelationshipScope(body, relationshipId),
    id: normalizeText(body.id) || createId(entity.toLowerCase()),
    created_date: normalizeText(body.created_date) || timestamp,
    updated_date: timestamp,
  };
  await kvPutJson(env, `data:${slugifyEntity(entity)}:${record.id}`, record);
  return record;
}

async function updateEntityRecord(
  env: Env,
  entity: string,
  id: string,
  body: Record<string, unknown>,
  relationshipId = DEFAULT_RELATIONSHIP_ID,
): Promise<StoredRecord | null> {
  if (entity === "QuestionnaireResponse") {
    return upsertQuestionnaireResponse(env, body, id, relationshipId);
  }

  const current = await getEntityRecord(env, entity, id, relationshipId);
  if (!current) return null;
  const record: StoredRecord = {
    ...current,
    ...withRelationshipScope(body, relationshipId),
    id,
    created_date: normalizeText(current.created_date) || nowIso(),
    updated_date: nowIso(),
  };
  await kvPutJson(env, `data:${slugifyEntity(entity)}:${id}`, record);
  return record;
}

async function deleteEntityRecord(
  env: Env,
  entity: string,
  id: string,
  relationshipId = DEFAULT_RELATIONSHIP_ID,
): Promise<boolean> {
  if (!env.QUESTIONNAIRES) return false;
  if (entity === "QuestionnaireResponse") {
    const existing = await getEntityRecord(env, entity, id, relationshipId);
    if (!existing) return false;
    return deleteQuestionnaireResponse(env, id);
  }
  const key = `data:${slugifyEntity(entity)}:${id}`;
  const existing = await kvGetJson<StoredRecord>(env, key);
  if (!existing) return false;
  if (normalizeText(existing.relationship_id) !== relationshipId) return false;
  await env.QUESTIONNAIRES.delete(key);
  return true;
}

async function buildState(env: Env, relationshipId = DEFAULT_RELATIONSHIP_ID): Promise<AppState> {
  const baseState =
    RELATEIQ_STATES[relationshipId] ||
    (await buildDynamicRelationshipState(env, relationshipId)) ||
    RELATEIQ_STATE;
  if (relationshipId !== DEFAULT_RELATIONSHIP_ID) {
    const records = await listQuestionnaireResponseRecords(env);
    const participantCounts = new Map<string, number>();
    records
      .filter((record) => normalizeText(record.relationship_id) === relationshipId)
      .forEach((record) => {
        const person = normalizeText(record.person_name) || "Participant";
        participantCounts.set(person, (participantCounts.get(person) || 0) + 1);
      });

    return {
      ...baseState,
      questionnaires: baseState.questionnaires.map((summary) => ({
        ...summary,
        importedQuestions: participantCounts.get(summary.person) || 0,
        importReady: (participantCounts.get(summary.person) || 0) >= summary.totalQuestions,
      })),
      questionnaireImported: baseState.questionnaires.every(
        (summary) => (participantCounts.get(summary.person) || 0) >= summary.totalQuestions,
      ),
    };
  }

  const questionnaires = await Promise.all(
    baseState.questionnaires.map(async (summary) => {
      const uploaded = await loadUploadedQuestionnaire(env, summary.person);
      const importedQuestions = uploaded?.responses.length || 0;
      const merged: QuestionnaireSummary = {
        ...summary,
        importedQuestions,
        importReady: importedQuestions === summary.totalQuestions,
        fileName: uploaded?.fileName || summary.fileName,
        uploadedAt: uploaded?.uploadedAt,
        notes: uploaded
          ? [
              `Uploaded to Cloudflare KV from ${uploaded.fileName}.`,
              `Detected ${importedQuestions} questionnaire responses for ${summary.person}.`,
            ]
          : summary.notes,
      };
      return merged;
    }),
  );

  return {
    ...baseState,
    questionnaireImported: questionnaires.every((item) => item.importReady),
    questionnaires,
  };
}

async function buildAiCoachResponse(
  env: Env,
  relationshipId: string,
  relationshipType: RelationshipType,
  speaker: PersonId,
  partner: PersonId,
  topic: string,
  goal: string,
): Promise<Record<string, unknown> | null> {
  const fallback = buildCoachResponse({ relationshipId, speaker, topic, goal });
  const [speakerQuestionnaire, partnerQuestionnaire] = await Promise.all([
    getQuestionnaireContextForRelationshipParticipant(env, relationshipId, speaker),
    getQuestionnaireContextForRelationshipParticipant(env, relationshipId, partner),
  ]);
  const sharedInterpretation = await runSharedInterpretation(env, {
    sourceType: "ai_coach",
    moduleContext: "AI Coach",
    scope: `${speaker}+${partner}`,
    speaker,
    partner,
    rawInput: [topic, goal].filter(Boolean).join("\n"),
    desiredOutcome: goal,
  }).catch(() => null);

  const messages: GroqMessage[] = [
    {
      role: "system",
      content:
        `You are RelateIQ's AI Coach. This interaction is for a ${relationshipType} relationship context. Treat the second participant according to that context, not as a default romantic partner unless the relationship type is romantic. Use only the questionnaire evidence and user input provided. Do not invent history, diagnoses, or traits. Return strict JSON with keys: response (string), suggestedOpeners (string[]), avoid (string[]), lens (object with speakerStyle and partnerStyle). Keep the tone warm, direct, and practical.`,
    },
    {
      role: "user",
      content: [
        `Relationship type: ${relationshipType}`,
        `Speaker: ${speaker}`,
        `Other person: ${partner}`,
        `Topic: ${topic || "Not provided"}`,
        `Goal: ${goal || "Not provided"}`,
        sharedInterpretation
          ? `Shared interpretation: ${sharedInterpretation.finalInterpretation.whatThisLikelyMeans}\nWhy: ${sharedInterpretation.finalInterpretation.whyAiThinksThat}\nMisread risk: ${sharedInterpretation.finalInterpretation.whatThePartnerMayBeMisreading}\nNext: ${sharedInterpretation.finalInterpretation.whatToDoNext}`
          : "",
        speakerQuestionnaire,
        partnerQuestionnaire,
      ].join("\n\n"),
    },
  ];

  try {
    const groq = await callGroq(env, messages, topic.length + goal.length + speaker.length, {
      jsonMode: true,
    });
    const parsed = parseJsonObject(groq.text);
    if (!parsed) return null;
    return {
      response: normalizeText(parsed.response) || fallback.response,
      suggestedOpeners: toStringArray(parsed.suggestedOpeners, fallback.suggestedOpeners),
      avoid: toStringArray(parsed.avoid, fallback.avoid),
      lens: isObject(parsed.lens) ? parsed.lens : fallback.lens,
      interpretation: sharedInterpretation?.finalInterpretation || null,
      interpretationLogId: sharedInterpretation?.interpretationLog?.id || null,
      provider: "groq",
      model: groq.model,
      keyIndex: groq.keyIndex,
      fallback: false,
    };
  } catch {
    return null;
  }
}

async function buildAiCheckInResponse(
  env: Env,
  relationshipId: string,
  relationshipType: RelationshipType,
  speaker: PersonId,
  partner: PersonId,
  mood: string,
  notes: string,
): Promise<Record<string, unknown> | null> {
  const fallback = buildCheckInResponse({ relationshipId, speaker, mood, notes });
  const [speakerQuestionnaire, partnerQuestionnaire] = await Promise.all([
    getQuestionnaireContextForRelationshipParticipant(env, relationshipId, speaker),
    getQuestionnaireContextForRelationshipParticipant(env, relationshipId, partner),
  ]);
  const sharedInterpretation = await runSharedInterpretation(env, {
    sourceType: "check_in",
    moduleContext: "Check-In",
    scope: `${speaker}+${partner}`,
    speaker,
    partner,
    rawInput: [mood, notes].filter(Boolean).join("\n"),
  }).catch(() => null);

  const messages: GroqMessage[] = [
    {
      role: "system",
      content:
        `You are RelateIQ's Check-In assistant. This interaction is for a ${relationshipType} relationship context. Treat the second participant according to that context, not as a default romantic partner unless the relationship type is romantic. Use only the questionnaire evidence and user input provided. Return strict JSON with keys: summary (string), nextStep (string), notesEcho (string). No diagnosis, no generic filler, no invented memories.`,
    },
    {
      role: "user",
      content: [
        `Relationship type: ${relationshipType}`,
        `Speaker: ${speaker}`,
        `Other person: ${partner}`,
        `Mood / energy: ${mood || "Not provided"}`,
        `Current notes: ${notes || "Not provided"}`,
        sharedInterpretation
          ? `Shared interpretation: ${sharedInterpretation.finalInterpretation.whatThisLikelyMeans}\nNext: ${sharedInterpretation.finalInterpretation.whatToDoNext}`
          : "",
        speakerQuestionnaire,
        partnerQuestionnaire,
      ].join("\n\n"),
    },
  ];

  try {
    const groq = await callGroq(env, messages, mood.length + notes.length + speaker.length, {
      jsonMode: true,
    });
    const parsed = parseJsonObject(groq.text);
    if (!parsed) return null;
    return {
      summary: normalizeText(parsed.summary) || fallback.summary,
      nextStep: normalizeText(parsed.nextStep) || fallback.nextStep,
      notesEcho: normalizeText(parsed.notesEcho) || fallback.notesEcho,
      interpretation: sharedInterpretation?.finalInterpretation || null,
      interpretationLogId: sharedInterpretation?.interpretationLog?.id || null,
      provider: "groq",
      model: groq.model,
      keyIndex: groq.keyIndex,
      fallback: false,
    };
  } catch {
    return null;
  }
}

async function buildAiRepairResponse(
  env: Env,
  relationshipId: string,
  relationshipType: RelationshipType,
  speaker: PersonId,
  partner: PersonId,
  issue: string,
  desiredOutcome: string,
): Promise<Record<string, unknown> | null> {
  const fallback = buildRepairResponse({ relationshipId, speaker, issue, desiredOutcome });
  const [speakerQuestionnaire, partnerQuestionnaire] = await Promise.all([
    getQuestionnaireContextForRelationshipParticipant(env, relationshipId, speaker),
    getQuestionnaireContextForRelationshipParticipant(env, relationshipId, partner),
  ]);
  const sharedInterpretation = await runSharedInterpretation(env, {
    sourceType: "repair",
    moduleContext: "Repair",
    scope: `${speaker}+${partner}`,
    speaker,
    partner,
    rawInput: issue,
    desiredOutcome,
  }).catch(() => null);

  const messages: GroqMessage[] = [
    {
      role: "system",
      content:
        `You are RelateIQ's Repair Planner. This interaction is for a ${relationshipType} relationship context. Treat the second participant according to that context, not as a default romantic partner unless the relationship type is romantic. Use only the questionnaire evidence and user input provided. Return strict JSON with keys: summary (string), scripts (string[]), avoid (string[]), desiredOutcome (string). No invented facts. Make it specific to the two people described.`,
    },
    {
      role: "user",
      content: [
        `Relationship type: ${relationshipType}`,
        `Speaker: ${speaker}`,
        `Other person: ${partner}`,
        `Issue: ${issue || "Not provided"}`,
        `Desired outcome: ${desiredOutcome || "Not provided"}`,
        sharedInterpretation
          ? `Shared interpretation: ${sharedInterpretation.finalInterpretation.whatThisLikelyMeans}\nMisread risk: ${sharedInterpretation.finalInterpretation.whatThePartnerMayBeMisreading}\nNext: ${sharedInterpretation.finalInterpretation.whatToDoNext}`
          : "",
        speakerQuestionnaire,
        partnerQuestionnaire,
      ].join("\n\n"),
    },
  ];

  try {
    const groq = await callGroq(env, messages, issue.length + desiredOutcome.length + speaker.length, {
      jsonMode: true,
    });
    const parsed = parseJsonObject(groq.text);
    if (!parsed) return null;
    return {
      summary: normalizeText(parsed.summary) || fallback.summary,
      scripts: toStringArray(parsed.scripts, fallback.scripts),
      avoid: toStringArray(parsed.avoid, fallback.avoid),
      desiredOutcome: normalizeText(parsed.desiredOutcome) || fallback.desiredOutcome,
      interpretation: sharedInterpretation?.finalInterpretation || null,
      interpretationLogId: sharedInterpretation?.interpretationLog?.id || null,
      provider: "groq",
      model: groq.model,
      keyIndex: groq.keyIndex,
      fallback: false,
    };
  } catch {
    return null;
  }
}

function toPersonId(value: unknown, fallback: PersonId = "Tony"): PersonId {
  const normalized = normalizeText(value);
  return normalized || fallback;
}

function resolvePlayLabPartner(person: PersonId, participants: [string, string] = ["Tony", "Drew"]): PersonId {
  return getScopedPartner(person, participants);
}

function humanizeValue(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim();
}

function createEmptyDimensionMap(): DimensionMap {
  return PROFILE_DIMENSION_KEYS.reduce((accumulator, key) => {
    accumulator[key] = 0.32;
    return accumulator;
  }, {} as DimensionMap);
}

function clampDimensionValue(value: number) {
  return Math.max(0.05, Math.min(0.98, Math.round(value * 100) / 100));
}

function clampMetricValue(value: number) {
  return Math.max(0, Math.min(1, Math.round(value * 1000) / 1000));
}

function normalizeCoupleId(scope?: string | null) {
  const normalized = normalizeText(scope || "Tony+Drew");
  if (!normalized) return "tony_drew";
  return normalized.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function applyDimensionSignal(target: DimensionMap, key: ProfileDimensionKey, delta: number) {
  target[key] = clampDimensionValue((target[key] || 0.32) + delta);
}

function mergeDimensionSignals(target: DimensionMap, source: Partial<DimensionMap>, weight = 1) {
  PROFILE_DIMENSION_KEYS.forEach((key) => {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      const baseline = target[key] || 0.32;
      target[key] = clampDimensionValue(baseline + (value - 0.32) * weight);
    }
  });
}

function buildDimensionProfileSummary(dimensions: DimensionMap) {
  return PROFILE_DIMENSION_KEYS.map((key) => ({ key, value: dimensions[key] || 0 }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 6)
    .map(({ key, value }) => `${humanizeValue(key)} (${Math.round(value * 100)}%)`)
    .join(", ");
}

function deriveQuestionnaireDimensionSignals(questionnaire: UploadedQuestionnaire | null): {
  dimensions: DimensionMap;
  inferredTags: string[];
} {
  const dimensions = createEmptyDimensionMap();
  const inferredTags = new Set<string>();
  const responses = questionnaire?.responses || [];

  responses.forEach((response) => {
    const answerText = [
      normalizeText(response.answer),
      Array.isArray(response.selected_options)
        ? response.selected_options.map((item) => normalizeText(item)).join(" ")
        : "",
      Array.isArray(response.tags) ? response.tags.map((item) => normalizeText(item)).join(" ") : "",
    ]
      .join(" ")
      .toLowerCase();

    const tags = Array.isArray(response.tags)
      ? response.tags.map((item) => normalizeText(item).toLowerCase()).filter(Boolean)
      : [];
    tags.forEach((tag) => inferredTags.add(tag));

    if (answerText.includes("space") || answerText.includes("pause") || answerText.includes("quiet")) {
      applyDimensionSignal(dimensions, "seeks_space", 0.05);
      applyDimensionSignal(dimensions, "internal_processor", 0.04);
    }
    if (answerText.includes("listen") || answerText.includes("heard") || answerText.includes("understood")) {
      applyDimensionSignal(dimensions, "seeks_understanding", 0.05);
      applyDimensionSignal(dimensions, "needs_emotional_reflection", 0.04);
    }
    if (answerText.includes("reassur")) {
      applyDimensionSignal(dimensions, "seeks_reassurance", 0.05);
    }
    if (answerText.includes("affection") || answerText.includes("hug") || answerText.includes("touch")) {
      applyDimensionSignal(dimensions, "seeks_affection", 0.05);
    }
    if (answerText.includes("tone") || answerText.includes("harsh")) {
      applyDimensionSignal(dimensions, "sensitive_to_tone", 0.06);
    }
    if (answerText.includes("follow through") || answerText.includes("follow-through") || answerText.includes("behavior change")) {
      applyDimensionSignal(dimensions, "sensitive_to_follow_through", 0.05);
      applyDimensionSignal(dimensions, "apology_needs_behavior_change", 0.05);
    }
    if (answerText.includes("direct")) {
      applyDimensionSignal(dimensions, "prefers_directness", 0.04);
    }
    if (answerText.includes("soft") || answerText.includes("gentle")) {
      applyDimensionSignal(dimensions, "prefers_soft_start", 0.04);
    }
    if (answerText.includes("question")) {
      applyDimensionSignal(dimensions, "asks_questions_to_connect", 0.04);
    }
    if (answerText.includes("pressure") || answerText.includes("cornered")) {
      applyDimensionSignal(dimensions, "defensiveness_when_cornered", 0.05);
      applyDimensionSignal(dimensions, "asks_questions_perceived_as_pressure", 0.04);
    }
    if (answerText.includes("shut down") || answerText.includes("withdraw")) {
      applyDimensionSignal(dimensions, "shutdown_when_overwhelmed", 0.05);
    }
    if (answerText.includes("problem") || answerText.includes("solution")) {
      applyDimensionSignal(dimensions, "seeks_problem_solving", 0.04);
    }
    if (answerText.includes("alone") || answerText.includes("misunderstood")) {
      applyDimensionSignal(dimensions, "loneliness_when_misunderstood", 0.05);
    }
  });

  return {
    dimensions,
    inferredTags: [...inferredTags],
  };
}

function deriveMemoryDimensionSignals(memory: Awaited<ReturnType<typeof buildPlayLabMemory>>, person: PersonId) {
  const dimensions = createEmptyDimensionMap();
  const personLabel = person.toLowerCase();
  const relevantTriggers = (memory.triggers || []).filter(
    (item) => normalizeText(item.owner || item.person || item.person_name).toLowerCase() === personLabel,
  );
  const relevantOutcomes = (memory.outcomes || []).filter((item) => normalizeText(item.scope).includes(person));
  const relevantPlayLab = (memory.playLabResults || []).filter((item) => normalizeText(item.scope).includes(person));

  if (relevantTriggers.some((item) => normalizeText(item.title || item.trigger || item.label).toLowerCase().includes("tone"))) {
    applyDimensionSignal(dimensions, "sensitive_to_tone", 0.05);
  }
  if (relevantTriggers.some((item) => normalizeText(item.title || item.trigger || item.label).toLowerCase().includes("question"))) {
    applyDimensionSignal(dimensions, "asks_questions_perceived_as_pressure", 0.05);
  }
  if (relevantOutcomes.some((item) => Number(item.connection_change || 0) > 0)) {
    applyDimensionSignal(dimensions, "conflict_repair_speed", 0.03);
  }
  if (relevantOutcomes.some((item) => Number(item.tension_change || 0) < 0)) {
    applyDimensionSignal(dimensions, "shutdown_when_overwhelmed", 0.03);
  }
  if (relevantPlayLab.some((item) => normalizeText(item.mismatch_type) === "blind_spot")) {
    applyDimensionSignal(dimensions, "needs_emotional_reflection", 0.03);
    applyDimensionSignal(dimensions, "seeks_understanding", 0.03);
  }

  return dimensions;
}

async function getOrCreateProfileDimensionState(
  env: Env,
  person: PersonId,
  memory?: Awaited<ReturnType<typeof buildPlayLabMemory>>,
) {
  const existing = sortRecords(
    (await listEntityRecords(env, "ProfileDimensionState")).filter(
      (record) => normalizeText(record.person_id) === person,
    ),
    "-updated_date",
  )[0];

  if (existing && isObject(existing.dimensions)) {
    const normalized = createEmptyDimensionMap();
    PROFILE_DIMENSION_KEYS.forEach((key) => {
      normalized[key] = clampDimensionValue(Number(existing.dimensions?.[key] || normalized[key]));
    });
    return { record: existing, dimensions: normalized };
  }

  const questionnaire = await loadUploadedQuestionnaire(env, person);
  const derived = deriveQuestionnaireDimensionSignals(questionnaire);
  const seeded = SEEDED_PROFILE_DIMENSIONS[person] || {};
  const dimensions = createEmptyDimensionMap();
  mergeDimensionSignals(dimensions, seeded, 1);
  mergeDimensionSignals(dimensions, derived.dimensions, 0.75);
  if (memory) {
    mergeDimensionSignals(dimensions, deriveMemoryDimensionSignals(memory, person), 0.65);
  }

  const created = await createEntityRecord(env, "ProfileDimensionState", {
    id: `profile_dimensions_${person.toLowerCase()}`,
    person_id: person,
    dimensions,
    inferred_tags: derived.inferredTags,
    source: "seeded+questionnaire",
  });

  return { record: created, dimensions };
}

function parseInterpretationInput(rawInput: string, desiredOutcome?: string) {
  const text = normalizeText(rawInput);
  const lower = text.toLowerCase();
  const desired = normalizeText(desiredOutcome);

  const emotion =
    (["hurt", "angry", "frustrated", "overwhelmed", "anxious", "lonely", "dismissed", "disconnected"].find((item) =>
      lower.includes(item),
    ) || "mixed") as string;

  const need =
    (lower.includes("space") && "space") ||
    (lower.includes("listen") && "listening") ||
    (lower.includes("reassur") && "reassurance") ||
    (lower.includes("hug") && "affection") ||
    (lower.includes("understood") && "understanding") ||
    (lower.includes("solve") && "problem solving") ||
    "clarity";

  const complaint =
    (lower.includes("didn't") || lower.includes("did not") || lower.includes("not")) && text
      ? text
      : `The speaker is naming strain around ${need}.`;

  const trigger =
    (lower.includes("tone") && "tone") ||
    (lower.includes("question") && "questions") ||
    (lower.includes("silent") && "silence") ||
    (lower.includes("space") && "distance") ||
    (lower.includes("apolog") && "repair") ||
    "relationship stress";

  const relationshipMeaning =
    need === "understanding"
      ? "The speaker is likely searching for emotional understanding before resolution."
      : need === "space"
      ? "The speaker is likely trying to regulate without disconnecting."
      : need === "reassurance"
      ? "The speaker is likely trying to confirm safety and care."
      : `The speaker is trying to reduce friction around ${need}.`;

  const behavior =
    (lower.includes("question") && "questioning") ||
    (lower.includes("shut down") && "shutdown") ||
    (lower.includes("withdraw") && "withdrawal") ||
    (lower.includes("apolog") && "repair attempt") ||
    "emotionally loaded communication";

  return {
    emotion,
    need,
    complaint,
    trigger,
    relationshipMeaning,
    behavior,
    desiredOutcome: desired || "better understanding and lower friction",
  };
}

function buildDeterministicInterpretation(
  input: InterpretationInput,
  speakerDimensions: DimensionMap,
  partnerDimensions: DimensionMap,
  coupleDynamic: StoredRecord | null,
) {
  const parsed = parseInterpretationInput(input.rawInput, input.desiredOutcome);
  const candidates = [
    {
      label: "support_need",
      score:
        parsed.need === "understanding"
          ? speakerDimensions.seeks_understanding + speakerDimensions.needs_emotional_reflection
          : speakerDimensions.seeks_space + speakerDimensions.shutdown_when_overwhelmed,
      meaning:
        parsed.need === "space"
          ? `${input.speaker} is likely trying to regulate first, not detach.`
          : `${input.speaker} is likely asking to be understood before anything gets fixed.`,
    },
    {
      label: "misread_risk",
      score:
        partnerDimensions.sensitive_to_tone +
        partnerDimensions.asks_questions_perceived_as_pressure +
        speakerDimensions.loneliness_when_misunderstood,
      meaning: `${input.partner} may misread the moment as pressure, rejection, or criticism unless the need is made explicit.`,
    },
    {
      label: "repair_signal",
      score:
        speakerDimensions.apology_needs_behavior_change +
        partnerDimensions.prefers_soft_start +
        partnerDimensions.seeks_acknowledgment,
      meaning: `What helps most next is a low-pressure repair move with acknowledgment before explanation.`,
    },
  ].sort((left, right) => right.score - left.score);

  const primary = candidates[0];
  const confidenceValue =
    (speakerDimensions.seeks_understanding +
      speakerDimensions.needs_emotional_reflection +
      partnerDimensions.sensitive_to_tone +
      (coupleDynamic ? 0.15 : 0)) /
    4;

  const confidenceLevel =
    confidenceValue >= 0.72 ? "High confidence" : confidenceValue >= 0.5 ? "Moderate confidence" : "Early signal";

  const dimensionsAffected = [
    parsed.need === "space" ? "seeks_space" : "seeks_understanding",
    parsed.trigger === "tone" ? "sensitive_to_tone" : "needs_emotional_reflection",
    primary.label === "repair_signal" ? "apology_needs_behavior_change" : "asks_questions_perceived_as_pressure",
  ].filter(Boolean);

  const inferredTags = [
    parsed.emotion,
    parsed.need.replace(/\s+/g, "_"),
    parsed.trigger.replace(/\s+/g, "_"),
    primary.label,
    normalizeText(input.sourceType),
  ].filter(Boolean);

  return {
    parsedInput: parsed,
    interpretationCandidates: candidates,
    finalInterpretation: {
      whatThisLikelyMeans: primary.meaning,
      whyAiThinksThat: `${input.speaker}'s profile emphasizes ${buildDimensionProfileSummary(speakerDimensions)}, while ${input.partner}'s profile emphasizes ${buildDimensionProfileSummary(partnerDimensions)}.`,
      whatThePartnerMayBeMisreading: candidates.find((item) => item.label === "misread_risk")?.meaning || "",
      whatToDoNext:
        parsed.need === "space"
          ? `Have ${input.speaker} name a return time so space does not read as disconnection.`
          : `Have ${input.partner} reflect the emotion first, then ask one grounded follow-up question.`,
      confidenceLevel,
      dimensionsAffected,
      inferredTags,
    },
  };
}

function normalizeInterpretationPayload(payload: Record<string, unknown>, fallback: ReturnType<typeof buildDeterministicInterpretation>) {
  const candidates =
    Array.isArray(payload.interpretationCandidates) && payload.interpretationCandidates.length > 0
      ? payload.interpretationCandidates
          .filter((item) => isObject(item))
          .map((item) => ({
            label: normalizeText(item.label) || "candidate",
            score: Number(item.score || 0),
            meaning: normalizeText(item.meaning),
          }))
      : fallback.interpretationCandidates;

  return {
    parsedInput: isObject(payload.parsedInput)
      ? {
          ...fallback.parsedInput,
          emotion: normalizeText(payload.parsedInput.emotion) || fallback.parsedInput.emotion,
          need: normalizeText(payload.parsedInput.need) || fallback.parsedInput.need,
          complaint: normalizeText(payload.parsedInput.complaint) || fallback.parsedInput.complaint,
          trigger: normalizeText(payload.parsedInput.trigger) || fallback.parsedInput.trigger,
          relationshipMeaning:
            normalizeText(payload.parsedInput.relationshipMeaning) || fallback.parsedInput.relationshipMeaning,
          behavior: normalizeText(payload.parsedInput.behavior) || fallback.parsedInput.behavior,
          desiredOutcome: normalizeText(payload.parsedInput.desiredOutcome) || fallback.parsedInput.desiredOutcome,
        }
      : fallback.parsedInput,
    interpretationCandidates: candidates,
    finalInterpretation: isObject(payload.finalInterpretation)
      ? {
          whatThisLikelyMeans:
            normalizeText(payload.finalInterpretation.whatThisLikelyMeans) ||
            fallback.finalInterpretation.whatThisLikelyMeans,
          whyAiThinksThat:
            normalizeText(payload.finalInterpretation.whyAiThinksThat) ||
            fallback.finalInterpretation.whyAiThinksThat,
          whatThePartnerMayBeMisreading:
            normalizeText(payload.finalInterpretation.whatThePartnerMayBeMisreading) ||
            fallback.finalInterpretation.whatThePartnerMayBeMisreading,
          whatToDoNext:
            normalizeText(payload.finalInterpretation.whatToDoNext) ||
            fallback.finalInterpretation.whatToDoNext,
          confidenceLevel:
            normalizeText(payload.finalInterpretation.confidenceLevel) ||
            fallback.finalInterpretation.confidenceLevel,
          dimensionsAffected: toStringArray(
            payload.finalInterpretation.dimensionsAffected,
            fallback.finalInterpretation.dimensionsAffected,
          ),
          inferredTags: toStringArray(
            payload.finalInterpretation.inferredTags,
            fallback.finalInterpretation.inferredTags,
          ),
        }
      : fallback.finalInterpretation,
  };
}

async function runSharedInterpretation(
  env: Env,
  input: InterpretationInput,
  memory?: Awaited<ReturnType<typeof buildPlayLabMemory>>,
) {
  const interpretationMemory = memory || (await buildPlayLabMemory(env, input.scope || `${input.speaker}+${input.partner}`));
  const speakerState = await getOrCreateProfileDimensionState(env, input.speaker, interpretationMemory);
  const partnerState = await getOrCreateProfileDimensionState(env, input.partner, interpretationMemory);
  const coupleDynamic = interpretationMemory.relationshipDynamic;
  const fallback = buildDeterministicInterpretation(input, speakerState.dimensions, partnerState.dimensions, coupleDynamic);

  let normalized = fallback;
  let provider = "deterministic";
  let model: string | null = null;
  let keyIndex: number | null = null;

  try {
    const groq = await callGroq(
      env,
      [
        {
          role: "system",
          content:
            "You are RelateIQ's centralized interpretation layer. Interpret the input through speaker identity, partner identity, profile dimensions, couple dynamic, module context, recent memory, and prior outcomes. Return strict JSON with keys parsedInput, interpretationCandidates, finalInterpretation. finalInterpretation must include whatThisLikelyMeans, whyAiThinksThat, whatThePartnerMayBeMisreading, whatToDoNext, confidenceLevel, dimensionsAffected, inferredTags.",
        },
        {
          role: "user",
          content: [
            `Source type: ${input.sourceType}`,
            `Module context: ${input.moduleContext}`,
            `Scope: ${input.scope}`,
            `Speaker: ${input.speaker}`,
            `Partner: ${input.partner}`,
            `Raw input: ${input.rawInput}`,
            input.desiredOutcome ? `Desired outcome: ${input.desiredOutcome}` : "",
            `Speaker dimensions: ${JSON.stringify(speakerState.dimensions)}`,
            `Partner dimensions: ${JSON.stringify(partnerState.dimensions)}`,
            `Recent memory counts: ${JSON.stringify(interpretationMemory.questionnaireCounts)}`,
            `Recent sessions: ${(interpretationMemory.sessions || []).length}`,
            `Recent triggers: ${(interpretationMemory.triggers || []).length}`,
            `Recent repairs: ${(interpretationMemory.repairs || []).length}`,
            `Recent outcomes: ${(interpretationMemory.outcomes || []).length}`,
            coupleDynamic ? `Couple dynamic: ${JSON.stringify(coupleDynamic)}` : "",
          ]
            .filter(Boolean)
            .join("\n\n"),
        },
      ],
      JSON.stringify(input).length + JSON.stringify(speakerState.dimensions).length + JSON.stringify(partnerState.dimensions).length,
      { jsonMode: true },
    );
    const parsed = parseJsonObject(groq.text);
    if (parsed) {
      normalized = normalizeInterpretationPayload(parsed, fallback);
      provider = "groq";
      model = groq.model;
      keyIndex = groq.keyIndex;
    }
  } catch {
    normalized = fallback;
  }

  const dimensionsAffected = toStringArray(normalized.finalInterpretation.dimensionsAffected);
  const inferredTags = toStringArray(normalized.finalInterpretation.inferredTags);
  const now = nowIso();

  const interpretationLog = await createEntityRecord(env, "InterpretationLog", {
    source_type: input.sourceType,
    module_context: input.moduleContext,
    scope: input.scope,
    speaker: input.speaker,
    partner: input.partner,
    raw_input: input.rawInput,
    desired_outcome: input.desiredOutcome || "",
    parsed_input: normalized.parsedInput,
    interpretation_candidates: normalized.interpretationCandidates,
    final_interpretation: normalized.finalInterpretation,
    confidence_level: normalized.finalInterpretation.confidenceLevel,
    dimensions_affected: dimensionsAffected,
    inferred_tags: inferredTags,
    related_id: input.relatedId || null,
    related_session_id: input.relatedSessionId || null,
    context_object: {
      ...(input.contextObject || {}),
      sourceType: input.sourceType,
      moduleContext: input.moduleContext,
      timestamp: now,
    },
    provider,
    model,
    key_index: keyIndex,
  });

  const speakerDelta = createEmptyDimensionMap();
  dimensionsAffected.forEach((key) => {
    if ((PROFILE_DIMENSION_KEYS as string[]).includes(key)) {
      applyDimensionSignal(speakerDelta, key as ProfileDimensionKey, 0.02);
    }
  });

  const updatedSpeakerDimensions = { ...speakerState.dimensions };
  PROFILE_DIMENSION_KEYS.forEach((key) => {
    const delta = speakerDelta[key] - 0.32;
    if (Math.abs(delta) > 0.001) {
      applyDimensionSignal(updatedSpeakerDimensions, key, delta);
    }
  });

  await updateEntityRecord(env, "ProfileDimensionState", normalizeText(speakerState.record.id), {
    dimensions: updatedSpeakerDimensions,
    inferred_tags: Array.from(new Set([...(toStringArray(speakerState.record.inferred_tags, [])), ...inferredTags])),
    last_interpreted_at: now,
    last_interpretation_log_id: interpretationLog.id,
  });

  return {
    ...normalized,
    provider,
    model,
    keyIndex,
    interpretationLog,
    speakerDimensions: updatedSpeakerDimensions,
    partnerDimensions: partnerState.dimensions,
  };
}

async function maybeInterpretEntityWrite(env: Env, entity: string, record: StoredRecord) {
  const normalizedEntity = normalizeText(entity);
  if (!["CoachSession", "CheckIn", "TriggerEntry", "OutcomeLog", "RelationshipDynamic", "InsightEntry"].includes(normalizedEntity)) {
    return null;
  }

  const speaker = toPersonId(record.speaker || record.owner || record.person || record.saved_by_user || (normalizeText(record.scope).includes("Drew") ? "Drew" : "Tony"));
  const partner = resolvePlayLabPartner(speaker);
  const rawInput = [
    normalizeText(record.title),
    normalizeText(record.topic),
    normalizeText(record.situation),
    normalizeText(record.issue),
    normalizeText(record.note),
    normalizeText(record.notes),
    normalizeText(record.core_insight),
    normalizeText(record.trigger),
  ]
    .filter(Boolean)
    .join("\n");

  if (!rawInput) return null;

  return runSharedInterpretation(env, {
    sourceType: normalizedEntity,
    moduleContext: humanizeValue(normalizedEntity),
    scope: normalizeText(record.scope) || `${speaker}+${partner}`,
    speaker,
    partner,
    rawInput,
    desiredOutcome: normalizeText(record.desired_outcome || record.desiredOutcome || record.next_step),
    relatedId: normalizeText(record.id),
    contextObject: isObject(record.context_object) ? (record.context_object as Record<string, unknown>) : null,
  });
}

async function getMetricStateRecord(
  env: Env,
  entity: "UserMetricState" | "CoupleMetricState",
  lookupKey: string,
  metricName: MetricName,
) {
  const stableId =
    entity === "UserMetricState"
      ? `usermetricstate_${lookupKey.toLowerCase()}_${metricName}`
      : `couplemetricstate_${lookupKey.toLowerCase()}_${metricName}`;

  const direct = await getEntityRecord(env, entity, stableId);
  if (direct) return direct;

  const records = sortRecords(await listEntityRecords(env, entity), "-updated_date");
  const legacy =
    records.find(
      (record) =>
        normalizeText(entity === "UserMetricState" ? record.user_id : record.couple_id) === lookupKey &&
        normalizeText(record.metric_name) === metricName,
    ) || null;

  if (!legacy) return null;

  return createEntityRecord(env, entity, {
    ...legacy,
    id: stableId,
    user_id: entity === "UserMetricState" ? lookupKey : undefined,
    couple_id: entity === "CoupleMetricState" ? lookupKey : undefined,
    metric_name: metricName,
  });
}

async function applyMetricSignal(env: Env, signal: MetricSignal) {
  const weightedDelta = signal.delta * signal.weight;
  if (!Number.isFinite(weightedDelta) || weightedDelta === 0) return;

  const userRecord =
    (await getMetricStateRecord(env, "UserMetricState", signal.userId, signal.metricName)) ||
    (await createEntityRecord(env, "UserMetricState", {
      id: `usermetricstate_${signal.userId.toLowerCase()}_${signal.metricName}`,
      user_id: signal.userId,
      metric_name: signal.metricName,
      value: 0.5,
      confidence: 0.25,
      last_updated: nowIso(),
      history: [],
    }));

  const coupleRecord =
    (await getMetricStateRecord(env, "CoupleMetricState", signal.coupleId, signal.metricName)) ||
    (await createEntityRecord(env, "CoupleMetricState", {
      id: `couplemetricstate_${signal.coupleId.toLowerCase()}_${signal.metricName}`,
      couple_id: signal.coupleId,
      metric_name: signal.metricName,
      value: 0.5,
      confidence: 0.25,
      last_updated: nowIso(),
    }));

  const userValue = clampMetricValue(Number(userRecord.value || 0.5) * 0.94 + clampMetricValue(Number(userRecord.value || 0.5) + weightedDelta) * 0.06);
  const coupleValue = clampMetricValue(Number(coupleRecord.value || 0.5) * 0.95 + clampMetricValue(Number(coupleRecord.value || 0.5) + weightedDelta * 0.7) * 0.05);
  const nextConfidence = clampMetricValue((Number(userRecord.confidence || 0.25) * 0.92) + Math.min(0.18, Math.abs(weightedDelta)) * 0.08 + 0.01);

  const history = Array.isArray(userRecord.history) ? userRecord.history : [];
  const nextHistory = [
    ...history.slice(-19),
    {
      timestamp: nowIso(),
      delta: weightedDelta,
      reason: signal.reason,
      source_module: signal.sourceModule,
    },
  ];

  const event = await createEntityRecord(env, "MetricEventLog", {
    user_id: signal.userId,
    couple_id: signal.coupleId,
    source_module: signal.sourceModule,
    metric_name: signal.metricName,
    delta: signal.delta,
    weight: signal.weight,
    reason: signal.reason,
    context_object_id: normalizeText(signal.contextObjectId),
    related_id: normalizeText(signal.relatedId),
    related_session_id: normalizeText(signal.relatedSessionId),
    timestamp: nowIso(),
  });

  await updateEntityRecord(env, "UserMetricState", normalizeText(userRecord.id), {
    value: userValue,
    confidence: nextConfidence,
    last_updated: nowIso(),
    history: nextHistory,
  });

  await updateEntityRecord(env, "CoupleMetricState", normalizeText(coupleRecord.id), {
    value: coupleValue,
    confidence: clampMetricValue((Number(coupleRecord.confidence || 0.25) * 0.94) + Math.min(0.16, Math.abs(weightedDelta)) * 0.06 + 0.01),
    last_updated: nowIso(),
  });

  return event;
}

function buildPlayLabMetricSignals(resultRecord: StoredRecord): MetricSignal[] {
  const scope = normalizeText(resultRecord.scope) || "Tony+Drew";
  const coupleId = normalizeCoupleId(scope);
  const sessionScopeIncludesTony = scope.includes("Tony");
  const sessionScopeIncludesDrew = scope.includes("Drew");
  const seededUsers: PersonId[] = [
    sessionScopeIncludesTony ? "Tony" : null,
    sessionScopeIncludesDrew ? "Drew" : null,
  ].filter(Boolean) as PersonId[];
  const inferredUsers = seededUsers.length > 0 ? seededUsers : ["Tony", "Drew"];

  const matchScore = clampMetricValue((Number(resultRecord.match_score || 50) || 50) / 100);
  const mismatchType = normalizeText(resultRecord.mismatch_type);
  const signals: MetricSignal[] = [];

  inferredUsers.forEach((userId) => {
    signals.push({
      userId,
      coupleId,
      metricName: "support_accuracy",
      delta: (matchScore - 0.5) * 0.18,
      weight: 0.7,
      reason: mismatchType || "play_lab_match_score",
      sourceModule: normalizeText(resultRecord.module_type) || "play_lab",
      contextObjectId: normalizeText((resultRecord.context_object as Record<string, unknown> | undefined)?.relatedGameRunId),
      relatedId: normalizeText(resultRecord.id),
      relatedSessionId: normalizeText(resultRecord.session_id),
    });
    signals.push({
      userId,
      coupleId,
      metricName: "emotional_attunement",
      delta: (matchScore - 0.5) * 0.15,
      weight: 0.65,
      reason: mismatchType || "play_lab_attunement",
      sourceModule: normalizeText(resultRecord.module_type) || "play_lab",
      contextObjectId: normalizeText((resultRecord.context_object as Record<string, unknown> | undefined)?.relatedGameRunId),
      relatedId: normalizeText(resultRecord.id),
      relatedSessionId: normalizeText(resultRecord.session_id),
    });
  });

  if (mismatchType === "blind_spot") {
    inferredUsers.forEach((userId) => {
      signals.push({
        userId,
        coupleId,
        metricName: "communication_alignment",
        delta: -0.08,
        weight: 0.65,
        reason: "blind_spot_detected",
        sourceModule: normalizeText(resultRecord.module_type) || "play_lab",
        contextObjectId: normalizeText((resultRecord.context_object as Record<string, unknown> | undefined)?.relatedGameRunId),
        relatedId: normalizeText(resultRecord.id),
        relatedSessionId: normalizeText(resultRecord.session_id),
      });
    });
  }

  return signals;
}

function buildOutcomeMetricSignals(outcome: StoredRecord): MetricSignal[] {
  const scope = normalizeText(outcome.scope) || "Tony+Drew";
  const coupleId = normalizeCoupleId(scope);
  const users: PersonId[] = scope.includes("Tony") && scope.includes("Drew")
    ? ["Tony", "Drew"]
    : [scope.includes("Drew") ? "Drew" : "Tony"];
  const attempted = Boolean(outcome.attempted || outcome.action_attempted);
  const helped = Boolean(outcome.helped);
  const tensionChangeRaw = Number(outcome.tension_change || 0);
  const connectionChangeRaw = Number(outcome.connection_change || 0);
  const sourceModule = normalizeText(outcome.source_type) || "outcome";
  const signals: MetricSignal[] = [];

  users.forEach((userId) => {
    if (attempted) {
      signals.push({
        userId,
        coupleId,
        metricName: "response_flexibility",
        delta: helped ? 0.06 : 0.02,
        weight: 0.6,
        reason: helped ? "attempted_and_helped" : "attempted",
        sourceModule,
        relatedId: normalizeText(outcome.id),
        relatedSessionId: normalizeText(outcome.related_session_id),
      });
    }
    signals.push({
      userId,
      coupleId,
      metricName: "repair_effectiveness",
      delta: helped ? 0.09 : -0.04,
      weight: 0.75,
      reason: helped ? "positive_outcome" : "negative_outcome",
      sourceModule,
      relatedId: normalizeText(outcome.id),
      relatedSessionId: normalizeText(outcome.related_session_id),
    });
    signals.push({
      userId,
      coupleId,
      metricName: "emotional_safety_index",
      delta: clampMetricValue(connectionChangeRaw * 0.08 - tensionChangeRaw * 0.04) - 0.5,
      weight: 0.45,
      reason: "outcome_shift",
      sourceModule,
      relatedId: normalizeText(outcome.id),
      relatedSessionId: normalizeText(outcome.related_session_id),
    });
  });

  return signals;
}

function buildEntityMetricSignals(entity: string, record: StoredRecord): MetricSignal[] {
  const normalizedEntity = normalizeText(entity);
  const speaker = toPersonId(record.speaker || record.owner || record.person_name || record.person || (normalizeText(record.scope).includes("Drew") && !normalizeText(record.scope).includes("Tony") ? "Drew" : "Tony"));
  const scope = normalizeText(record.scope) || `${speaker}+${resolvePlayLabPartner(speaker)}`;
  const coupleId = normalizeCoupleId(scope);
  const relatedId = normalizeText(record.id);
  const relatedSessionId = normalizeText(record.related_session_id || record.session_id);

  if (normalizedEntity === "TriggerEntry") {
    return [{
      userId: speaker,
      coupleId,
      metricName: "trigger_sensitivity",
      delta: 0.04,
      weight: 0.55,
      reason: "trigger_logged",
      sourceModule: "TriggerEntry",
      relatedId,
      relatedSessionId,
    }];
  }

  if (normalizedEntity === "CoachSession") {
    return [{
      userId: speaker,
      coupleId,
      metricName: "communication_alignment",
      delta: 0.02,
      weight: 0.35,
      reason: "coach_reflection_logged",
      sourceModule: normalizeText(record.tool_type) || "CoachSession",
      relatedId,
      relatedSessionId,
    }];
  }

  if (normalizedEntity === "CheckIn") {
    return [{
      userId: speaker,
      coupleId,
      metricName: "emotional_attunement",
      delta: 0.02,
      weight: 0.3,
      reason: "check_in_logged",
      sourceModule: "CheckIn",
      relatedId,
      relatedSessionId,
    }];
  }

  if (normalizedEntity === "RepairEntry") {
    return [{
      userId: speaker,
      coupleId,
      metricName: "repair_effectiveness",
      delta: 0.03,
      weight: 0.4,
      reason: "repair_attempt_logged",
      sourceModule: "RepairEntry",
      relatedId,
      relatedSessionId,
    }];
  }

  if (normalizedEntity === "OutcomeLog") {
    return buildOutcomeMetricSignals(record);
  }

  return [];
}

async function captureMetricSignals(env: Env, signals: MetricSignal[]) {
  for (const signal of signals) {
    try {
      await applyMetricSignal(env, signal);
    } catch {
      // Passive layer must never affect live behavior.
    }
  }
}

async function safelyCaptureMetricSignals(env: Env, signals: MetricSignal[]) {
  try {
    await captureMetricSignals(env, signals);
  } catch {
    // Passive layer must never affect live behavior.
  }
}

function pickPrompt(moduleType: PlayLabModuleType, seedSource: string): string {
  const prompts = PLAY_LAB_PROMPTS[moduleType] || PLAY_LAB_PROMPTS.guess_my_inner_world;
  const seed = Array.from(seedSource).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return prompts[Math.abs(seed) % prompts.length];
}

function extractKeywordsFromText(...values: Array<string | undefined>): string[] {
  const stopWords = new Set([
    "the", "and", "for", "with", "that", "this", "from", "they", "them", "your", "have", "feel", "most", "what",
    "when", "will", "been", "about", "into", "after", "before", "just", "need", "want", "like",
  ]);

  const counts = new Map<string, number>();
  values
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3 && !stopWords.has(word))
    .forEach((word) => {
      counts.set(word, (counts.get(word) || 0) + 1);
    });

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([word]) => word);
}

function computeMatchScore(answer: string, guess: string) {
  const answerTokens = new Set(extractKeywordsFromText(answer));
  const guessTokens = new Set(extractKeywordsFromText(guess));
  if (answerTokens.size === 0 && guessTokens.size === 0) return 50;

  let overlap = 0;
  answerTokens.forEach((token) => {
    if (guessTokens.has(token)) overlap += 1;
  });

  const denominator = Math.max(answerTokens.size, guessTokens.size, 1);
  return Math.max(18, Math.min(96, Math.round((overlap / denominator) * 100)));
}

function getPlayLabPromptLine(moduleType: PlayLabModuleType, promptText: string) {
  return promptText || PLAY_LAB_MODULE_LABELS[moduleType];
}

async function getLatestRelationshipDynamic(env: Env, relationshipId = DEFAULT_RELATIONSHIP_ID) {
  const records = (await listEntityRecords(env, "RelationshipDynamic")).filter(
    (record) => normalizeText(record.relationship_id) === relationshipId,
  );
  return sortRecords(records, "-updated_date")[0] || null;
}

async function buildPlayLabMemory(env: Env, scope: string, relationshipId = DEFAULT_RELATIONSHIP_ID) {
  const [profiles, sessions, checkIns, triggers, repairs, outcomes, insightEntries, relationshipDynamic, playLabSessions, playLabResults] =
    await Promise.all([
      listEntityRecords(env, "UserProfile"),
      listEntityRecords(env, "CoachSession"),
      listEntityRecords(env, "CheckIn"),
      listEntityRecords(env, "TriggerEntry"),
      listEntityRecords(env, "RepairEntry"),
      listEntityRecords(env, "OutcomeLog"),
      listEntityRecords(env, "InsightEntry"),
      getLatestRelationshipDynamic(env, relationshipId),
      listEntityRecords(env, "PlayLabSession"),
      listEntityRecords(env, "PlayLabResult"),
    ]);

  const relationship = await getRelationshipPersistent(env, relationshipId);
  const participants = getScopedParticipants(relationship);
  const [primaryQuestionnaireRecords, secondaryQuestionnaireRecords] = await Promise.all([
    getRelationshipQuestionnaireRecords(env, relationshipId, participants[0]),
    getRelationshipQuestionnaireRecords(env, relationshipId, participants[1]),
  ]);

  return {
    relationship_id: relationshipId,
    participants,
    scope,
    profiles: profiles.filter((record) => normalizeText(record.relationship_id) === relationshipId),
    sessions: sortRecords(sessions.filter((record) => normalizeText(record.relationship_id) === relationshipId), "-updated_date").slice(0, 12),
    checkIns: sortRecords(checkIns.filter((record) => normalizeText(record.relationship_id) === relationshipId), "-updated_date").slice(0, 12),
    triggers: sortRecords(triggers.filter((record) => normalizeText(record.relationship_id) === relationshipId), "-updated_date").slice(0, 12),
    repairs: sortRecords(repairs.filter((record) => normalizeText(record.relationship_id) === relationshipId), "-updated_date").slice(0, 12),
    outcomes: sortRecords(outcomes.filter((record) => normalizeText(record.relationship_id) === relationshipId), "-updated_date").slice(0, 12),
    insights: sortRecords(insightEntries.filter((record) => normalizeText(record.relationship_id) === relationshipId), "-updated_date").slice(0, 12),
    playLabSessions: sortRecords(playLabSessions.filter((record) => normalizeText(record.relationship_id) === relationshipId), "-updated_date").slice(0, 20),
    playLabResults: sortRecords(playLabResults.filter((record) => normalizeText(record.relationship_id) === relationshipId), "-updated_date").slice(0, 20),
    relationshipDynamic,
    questionnaireCounts: {
      [participants[0]]: primaryQuestionnaireRecords.length || 0,
      [participants[1]]: secondaryQuestionnaireRecords.length || 0,
    },
    questionnaireContext: [
      buildQuestionnaireContextFromRecords(primaryQuestionnaireRecords, participants[0]),
      buildQuestionnaireContextFromRecords(secondaryQuestionnaireRecords, participants[1]),
    ].join("\n\n"),
  };
}

function normalizePromptTokens(value: string) {
  return extractKeywordsFromText(value).slice(0, 10);
}

function computePromptSimilarity(left: string, right: string) {
  const leftTokens = new Set(normalizePromptTokens(left));
  const rightTokens = new Set(normalizePromptTokens(right));
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
  let overlap = 0;
  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) overlap += 1;
  });
  const union = new Set([...leftTokens, ...rightTokens]).size || 1;
  return overlap / union;
}

function inferPlayLabThemesFromMemory(memory: Awaited<ReturnType<typeof buildPlayLabMemory>>) {
  const lowConfidenceTags = (memory.playLabResults || [])
    .filter((item) => ["emerging", "low"].includes(normalizeText(item.confidence_level)))
    .flatMap((item) => toStringArray(item.inferred_tags, []));
  const mismatchTags = (memory.playLabResults || [])
    .filter((item) => ["blind_spot", "partial_alignment"].includes(normalizeText(item.mismatch_type)))
    .flatMap((item) => toStringArray(item.inferred_tags, []));
  const outcomeTags = (memory.outcomes || [])
    .filter((item) => Number(item.connection_change || 0) > 0 || Number(item.tension_change || 0) > 0)
    .flatMap((item) => extractKeywordsFromText(normalizeText(item.notes), normalizeText(item.source_type)));

  return {
    lowConfidenceTags,
    mismatchTags,
    outcomeTags,
  };
}

function scorePromptCandidate(
  prompt: string,
  recentPrompts: string[],
  themeSignals: ReturnType<typeof inferPlayLabThemesFromMemory>,
) {
  const promptTokens = normalizePromptTokens(prompt);
  let score = 10;

  const recentExact = recentPrompts.some((recent) => normalizeText(recent) === normalizeText(prompt));
  if (recentExact) return -1000;

  const similarRecent = recentPrompts.some((recent) => computePromptSimilarity(recent, prompt) > 0.55);
  if (similarRecent) score -= 8;

  const lowConfidenceHit = promptTokens.filter((token) => themeSignals.lowConfidenceTags.includes(token)).length;
  const mismatchHit = promptTokens.filter((token) => themeSignals.mismatchTags.includes(token)).length;
  const outcomeHit = promptTokens.filter((token) => themeSignals.outcomeTags.includes(token)).length;

  score += lowConfidenceHit * 5;
  score += mismatchHit * 4;
  score += outcomeHit * 2;

  return score;
}

function pickAdaptivePlayLabPrompt(
  moduleType: PlayLabModuleType,
  memory: Awaited<ReturnType<typeof buildPlayLabMemory>>,
  scope: string,
) {
  const promptBank = PLAY_LAB_PROMPTS[moduleType] || PLAY_LAB_PROMPTS.guess_my_inner_world;
  const recentPrompts = (memory.playLabSessions || [])
    .filter((session) => normalizeText(session.scope).includes(scope) || normalizeText(session.initiated_by) === scope)
    .filter((session) => normalizeText(session.module_type) === moduleType)
    .slice(0, 8)
    .map((session) => normalizeText(session.prompt_text))
    .filter(Boolean);

  const themeSignals = inferPlayLabThemesFromMemory(memory);

  const scored = promptBank
    .map((prompt) => ({ prompt, score: scorePromptCandidate(prompt, recentPrompts, themeSignals) }))
    .sort((left, right) => right.score - left.score);

  return scored[0]?.prompt || promptBank[0] || PLAY_LAB_MODULE_LABELS[moduleType];
}

function buildPlayLabContextObject({
  moduleType,
  scope,
  sourceInputs,
  memory,
  sessionId,
  originalOutput,
}: {
  moduleType: PlayLabModuleType;
  scope: string;
  sourceInputs: Record<string, unknown>;
  memory: Record<string, unknown>;
  sessionId: string;
  originalOutput: Record<string, unknown>;
}) {
  return {
    page: "Play Lab",
    moduleType,
    scope,
    sourceInputs,
    relevantMemoryRetrieved: {
      profileCount: Array.isArray(memory.profiles) ? memory.profiles.length : 0,
      sessionCount: Array.isArray(memory.sessions) ? memory.sessions.length : 0,
      checkInCount: Array.isArray(memory.checkIns) ? memory.checkIns.length : 0,
      triggerCount: Array.isArray(memory.triggers) ? memory.triggers.length : 0,
      repairCount: Array.isArray(memory.repairs) ? memory.repairs.length : 0,
      outcomeCount: Array.isArray(memory.outcomes) ? memory.outcomes.length : 0,
      questionnaireCounts: memory.questionnaireCounts,
    },
    originalOutput,
    timestamp: nowIso(),
    relatedSessionId: sessionId,
    relatedGameRunId: createId("playlabrun"),
  };
}

function buildPlayLabDeterministicResult(input: {
  moduleType: PlayLabModuleType;
  promptText: string;
  actualAnswer?: string;
  guessedAnswer?: string;
  selectedMisread?: string;
  situation?: string;
  unresolved?: string;
  stressSource?: string;
  currentNeed?: string;
  predictedNeed?: string;
  initiatedBy: PersonId;
  scope: string;
  participants?: [string, string];
}) {
  const moduleLabel = PLAY_LAB_MODULE_LABELS[input.moduleType];
  const actualAnswer = normalizeText(input.actualAnswer);
  const guessedAnswer = normalizeText(input.guessedAnswer);
  const currentNeed = normalizeText(input.currentNeed);
  const predictedNeed = normalizeText(input.predictedNeed);
  const situation = normalizeText(input.situation);
  const unresolved = normalizeText(input.unresolved);
  const selectedMisread = normalizeText(input.selectedMisread);
  const stressSource = normalizeText(input.stressSource);
  const partner = resolvePlayLabPartner(input.initiatedBy, input.participants || ["Tony", "Drew"]);

  const matchScore = computeMatchScore(actualAnswer || currentNeed || situation, guessedAnswer || predictedNeed || selectedMisread);
  const mismatchType =
    matchScore >= 75
      ? "high_alignment"
      : matchScore >= 45
      ? "partial_alignment"
      : "blind_spot";

  const headline =
    input.moduleType === "repair_quest"
      ? `Repair is more likely to land when ${input.initiatedBy} feels the impact is acknowledged before the explanation.`
      : input.moduleType === "stress_decoder"
      ? `${partner}'s prediction captured part of the need, but the support move still needs sharpening.`
      : input.moduleType === "two_truths_and_a_misread"
      ? `The biggest risk here is misreading overwhelm as indifference.`
      : input.moduleType === "side_quest"
      ? `A one-degree shift will work best if it is small enough to try under real life pressure.`
      : input.moduleType === "aha_cards"
      ? `A repeatable pattern is starting to become visible, and that gives the couple something specific to work with.`
      : `This round highlights how accurately ${partner} is reading ${input.initiatedBy}'s inner world right now.`;

  const reveal =
    input.moduleType === "repair_quest"
      ? `What still feels unresolved is "${unresolved || "the emotional impact"}". Repair will land better if the first move lowers defensiveness instead of clarifying intent.`
      : input.moduleType === "stress_decoder"
      ? `${input.initiatedBy} is carrying stress from "${stressSource || "multiple demands"}" and most needs ${currentNeed || "listening without pressure"} first.`
      : input.moduleType === "two_truths_and_a_misread"
      ? `The misread is likely happening around "${selectedMisread || "what the silence means"}", not around whether either person cares.`
      : input.moduleType === "side_quest"
      ? `The next useful change is not a personality overhaul; it is one visible behavior that reduces confusion in the moments that matter.`
      : input.moduleType === "aha_cards"
      ? `The strongest pattern right now is that clarity, low pressure, and emotional reflection tend to help more than speed or problem-solving.`
      : `The real answer "${actualAnswer || currentNeed || getPlayLabPromptLine(input.moduleType, input.promptText)}" and the guess "${guessedAnswer || predictedNeed || "no guess recorded"}" show how the couple is doing with emotional accuracy.`;

  const suggestedActionTitle =
    input.moduleType === "repair_quest"
      ? "Best Repair Move Right Now"
      : input.moduleType === "side_quest"
      ? "This Week’s Tiny Shift"
      : "Most Useful Next Step";

  const suggestedActionDescription =
    input.moduleType === "repair_quest"
      ? `Lead with a brief acknowledgment of impact, then offer one concrete do-over instead of a long explanation.`
      : input.moduleType === "stress_decoder"
      ? `Before helping, ask whether ${input.initiatedBy} wants listening, reassurance, or one concrete action.`
      : input.moduleType === "two_truths_and_a_misread"
      ? `Name one alternative explanation out loud before reacting to the original interpretation.`
      : input.moduleType === "side_quest"
      ? `${input.initiatedBy}: before the next hard moment, say one sentence that reduces ambiguity for ${partner}.`
      : `Reflect back the need in one sentence and let that land before moving into solutions.`;

  const backupOptions = [
    "Use one gentle check-in question instead of a rapid series of questions.",
    "Offer a clear return time if space is needed so silence does not feel like rejection.",
    "Pair any apology or reassurance with one visible follow-through action.",
  ];

  const sections = [
    { title: "What This Reveals", body: headline },
    { title: "Why It Matters", body: reveal },
    { title: suggestedActionTitle, body: suggestedActionDescription },
  ];

  const ahaTitle =
    input.moduleType === "repair_quest"
      ? "Repair works better when impact is acknowledged first"
      : input.moduleType === "stress_decoder"
      ? "Support accuracy improves when the need is named directly"
      : input.moduleType === "two_truths_and_a_misread"
      ? "Overwhelm is being read as disconnection"
      : input.moduleType === "side_quest"
      ? "Small behavioral signals can change the whole tone"
      : input.moduleType === "aha_cards"
      ? "A stable support pattern is emerging"
      : "Emotional accuracy is getting more specific";

  const ahaBody = `${headline} ${suggestedActionDescription}`;
  const tags = extractKeywordsFromText(headline, reveal, actualAnswer, guessedAnswer, currentNeed, predictedNeed);

  return {
    moduleLabel,
    matchScore,
    mismatchType,
    confidenceLevel: matchScore >= 75 ? "high" : matchScore >= 45 ? "medium" : "emerging",
    summary: headline,
    interpretation: reveal,
    sections,
    suggestedAction: {
      title: suggestedActionTitle,
      description: suggestedActionDescription,
      backups: backupOptions,
    },
    ahaCard: {
      title: ahaTitle,
      body: ahaBody,
    },
    inferredTags: tags,
    statements:
      input.moduleType === "two_truths_and_a_misread"
        ? [
            { label: "Likely True", body: `${input.initiatedBy} was trying to protect bandwidth, not shut the relationship out.` },
            { label: "Likely True", body: `${partner} reacted strongly because the moment landed as emotional distance.` },
            { label: "Likely Misread", body: `${input.initiatedBy}'s quieter response meant they cared less about the relationship.` },
          ]
        : [],
  };
}

async function buildPlayLabAiResult(
  env: Env,
  input: {
    moduleType: PlayLabModuleType;
    promptText: string;
    actualAnswer?: string;
    guessedAnswer?: string;
    selectedMisread?: string;
    situation?: string;
    unresolved?: string;
    stressSource?: string;
    currentNeed?: string;
    currentNeedType?: string;
    predictedNeed?: string;
    predictedNeedType?: string;
    initiatedBy: PersonId;
    scope: string;
    answerConfidence?: number;
    guessConfidence?: number;
    emotionalState?: string;
    unresolvedTag?: string;
    selectedMisreadWhy?: string;
  },
  memory: Awaited<ReturnType<typeof buildPlayLabMemory>>,
) {
  const partner = resolvePlayLabPartner(input.initiatedBy, memory.participants || ["Tony", "Drew"]);
  const sharedInterpretation = await runSharedInterpretation(
    env,
    {
      sourceType: "play_lab",
      moduleContext: PLAY_LAB_MODULE_LABELS[input.moduleType],
      scope: input.scope,
      speaker: input.initiatedBy,
      partner,
      rawInput: [
        input.promptText,
        input.actualAnswer,
        input.guessedAnswer,
        input.currentNeed,
        input.predictedNeed,
        input.situation,
        input.unresolved,
        input.selectedMisread,
        input.stressSource,
      ]
        .filter(Boolean)
        .join("\n"),
      desiredOutcome:
        input.moduleType === "repair_quest"
          ? "repair the tension and reduce defensiveness"
          : "improve mutual understanding",
    },
    memory,
  ).catch(() => null);

  const fallback = buildPlayLabDeterministicResult({
    ...input,
    participants: memory.participants,
  });
  const messages: GroqMessage[] = [
    {
      role: "system",
      content:
        "You are RelateIQ's Play Lab interpreter. Use only the provided relationship memory and current module inputs. Return strict JSON with keys: summary (string), interpretation (string), confidenceLevel (string), mismatchType (string), matchScore (number), inferredTags (string[]), sections (array of objects with title and body), suggestedAction (object with title, description, backups), ahaCard (object with title and body), statements (array of objects with label and body). Keep it adult, emotionally safe, concise, and specific.",
    },
    {
      role: "user",
      content: [
        `Module: ${PLAY_LAB_MODULE_LABELS[input.moduleType]}`,
        `Scope: ${input.scope}`,
        `Prompt: ${getPlayLabPromptLine(input.moduleType, input.promptText)}`,
        `Initiated by: ${input.initiatedBy}`,
        input.actualAnswer ? `Actual answer: ${input.actualAnswer}` : "",
        input.guessedAnswer ? `Guessed answer: ${input.guessedAnswer}` : "",
        input.currentNeed ? `Actual need: ${input.currentNeed}` : "",
        input.currentNeedType ? `Actual need type: ${input.currentNeedType}` : "",
        input.predictedNeed ? `Predicted need: ${input.predictedNeed}` : "",
        input.predictedNeedType ? `Predicted need type: ${input.predictedNeedType}` : "",
        input.situation ? `Situation: ${input.situation}` : "",
        input.unresolved ? `Still unresolved: ${input.unresolved}` : "",
        input.unresolvedTag ? `Unresolved tag: ${input.unresolvedTag}` : "",
        input.emotionalState ? `Current emotional state: ${input.emotionalState}` : "",
        input.selectedMisread ? `Selected likely misread: ${input.selectedMisread}` : "",
        input.selectedMisreadWhy ? `Why selected: ${input.selectedMisreadWhy}` : "",
        input.stressSource ? `Stress source: ${input.stressSource}` : "",
        typeof input.answerConfidence === "number" ? `Answer confidence: ${input.answerConfidence}/5` : "",
        typeof input.guessConfidence === "number" ? `Guess confidence: ${input.guessConfidence}/5` : "",
        sharedInterpretation
          ? `Central interpretation: ${sharedInterpretation.finalInterpretation.whatThisLikelyMeans}\nMisread risk: ${sharedInterpretation.finalInterpretation.whatThePartnerMayBeMisreading}\nNext step: ${sharedInterpretation.finalInterpretation.whatToDoNext}`
          : "",
        `Recent memory counts: ${JSON.stringify(memory.questionnaireCounts)}`,
        `Recent sessions: ${(memory.sessions || []).length}`,
        `Recent check-ins: ${(memory.checkIns || []).length}`,
        `Recent triggers: ${(memory.triggers || []).length}`,
        `Recent repairs: ${(memory.repairs || []).length}`,
        memory.questionnaireContext,
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
  ];

  try {
    const groq = await callGroq(env, messages, JSON.stringify(input).length + JSON.stringify(memory.questionnaireCounts).length, {
      jsonMode: true,
    });
    const parsed = parseJsonObject(groq.text);
    if (!parsed) return { ...fallback, provider: "deterministic", fallback: true };
    return {
      summary: normalizeText(parsed.summary) || fallback.summary,
      interpretation: normalizeText(parsed.interpretation) || fallback.interpretation,
      confidenceLevel: normalizeText(parsed.confidenceLevel) || fallback.confidenceLevel,
      mismatchType: normalizeText(parsed.mismatchType) || fallback.mismatchType,
      matchScore: Number(parsed.matchScore || fallback.matchScore) || fallback.matchScore,
      inferredTags: toStringArray(parsed.inferredTags, fallback.inferredTags),
      sections:
        Array.isArray(parsed.sections) && parsed.sections.length > 0
          ? parsed.sections
              .filter((section) => isObject(section))
              .map((section) => ({
                title: normalizeText(section.title) || "Insight",
                body: normalizeText(section.body) || fallback.interpretation,
              }))
          : fallback.sections,
      suggestedAction: isObject(parsed.suggestedAction)
        ? {
            title: normalizeText(parsed.suggestedAction.title) || fallback.suggestedAction.title,
            description:
              normalizeText(parsed.suggestedAction.description) || fallback.suggestedAction.description,
            backups: toStringArray(parsed.suggestedAction.backups, fallback.suggestedAction.backups),
          }
        : fallback.suggestedAction,
      ahaCard: isObject(parsed.ahaCard)
        ? {
            title: normalizeText(parsed.ahaCard.title) || fallback.ahaCard.title,
            body: normalizeText(parsed.ahaCard.body) || fallback.ahaCard.body,
          }
        : fallback.ahaCard,
      statements:
        Array.isArray(parsed.statements) && parsed.statements.length > 0
          ? parsed.statements
              .filter((statement) => isObject(statement))
              .map((statement) => ({
                label: normalizeText(statement.label) || "Insight",
                body: normalizeText(statement.body) || "",
              }))
          : fallback.statements,
      provider: "groq",
      model: groq.model,
      keyIndex: groq.keyIndex,
      interpretationLogId: sharedInterpretation?.interpretationLog?.id || null,
      fallback: false,
    };
  } catch {
    return {
      ...fallback,
      interpretationLogId: sharedInterpretation?.interpretationLog?.id || null,
      provider: "deterministic",
      fallback: true,
    };
  }
}

function buildPlayLabExportText(result: Record<string, unknown>) {
  const sections = Array.isArray(result.sections) ? result.sections : [];
  const action = isObject(result.suggestedAction) ? result.suggestedAction : null;
  const lines = [
    `${normalizeText(result.moduleLabel) || "Play Lab Result"}`,
    `Generated: ${new Date().toLocaleString()}`,
    `Scope: ${normalizeText(result.scope) || "Tony+Drew"}`,
    "",
    normalizeText(result.summary),
    "",
    ...sections.flatMap((section) =>
      isObject(section)
        ? [`${normalizeText(section.title).toUpperCase()}`, normalizeText(section.body), ""]
        : [],
    ),
  ];

  if (action) {
    lines.push("SUGGESTED NEXT STEP", normalizeText(action.title), normalizeText(action.description), "");
    if (Array.isArray(action.backups) && action.backups.length > 0) {
      lines.push("BACKUP OPTIONS");
      action.backups.forEach((item) => lines.push(`- ${normalizeText(item)}`));
      lines.push("");
    }
  }

  return lines.join("\n");
}

async function handleLlmRequest(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  const prompt = normalizeText(body?.prompt);
  const responseSchema = body?.response_json_schema;
  const messages = Array.isArray(body?.messages)
    ? body.messages
        .filter((message: unknown) => isObject(message))
        .map((message) => ({
          role:
            message.role === "assistant" || message.role === "system" || message.role === "user"
              ? message.role
              : "user",
          content: normalizeText(message.content),
        }))
        .filter((message) => message.content)
    : [];

  if (!prompt && messages.length === 0) {
    return json({ error: "prompt_required" }, request, env, 400);
  }

  const promptMessages: GroqMessage[] =
    messages.length > 0
      ? messages
      : [
          {
            role: "user",
            content: prompt,
          },
        ];

  if (responseSchema) {
    promptMessages.unshift({
      role: "system",
      content: `Return only a valid JSON object that matches this schema as closely as possible:\n${JSON.stringify(
        responseSchema,
        null,
        2,
      )}`,
    });
  }

  try {
    const groq = await callGroq(
      env,
      promptMessages,
      JSON.stringify(body || {}).length || Date.now(),
      {
        jsonMode: Boolean(responseSchema),
        requestedModel: normalizeText(body?.model),
      },
    );
    if (!responseSchema) {
      return json(groq.text, request, env);
    }

    const parsed = parseJsonObject(groq.text);
    if (!parsed) {
      return json({ error: "invalid_json_response", raw: groq.text }, request, env, 502);
    }
    return json(parsed, request, env);
  } catch (error) {
    const fallback = buildLlmFallback(body, error);
    if (body?.response_json_schema && isObject(fallback)) {
      return json(
        {
          ...fallback,
          fallback: true,
          error: "llm_failed",
          detail: error instanceof Error ? error.message : String(error),
        },
        request,
        env,
        200,
      );
    }

    return json(
      {
        response: fallback,
        fallback: true,
        error: "llm_failed",
        detail: error instanceof Error ? error.message : String(error),
      },
      request,
      env,
      200,
    );
  }
}

async function sendEmailThroughResend(env: Env, payload: Record<string, unknown>) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    return {
      sent: false,
      queued: true,
      provider: "queue_only",
      reason: "email_provider_not_configured",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: payload.to,
      subject: payload.subject,
      text: payload.body,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`resend_${response.status}: ${errorText}`);
  }

  return {
    sent: true,
    queued: false,
    provider: "resend",
    result: await response.json(),
  };
}

async function sendEmailThroughCloudflare(env: Env, payload: Record<string, unknown>) {
  if (!env.EMAIL || !env.EMAIL_FROM) {
    return {
      sent: false,
      queued: true,
      provider: "queue_only",
      reason: "cloudflare_email_not_configured",
    };
  }

  const result = await env.EMAIL.send({
    to: normalizeText(payload.to),
    from: env.EMAIL_FROM,
    subject: normalizeText(payload.subject),
    text: normalizeText(payload.body),
    html: normalizeText(payload.html) || undefined,
  });

  return {
    sent: true,
    queued: false,
    provider: "cloudflare_email",
    result,
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);

      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: getCorsHeaders(request, env) });
      }

      if (url.pathname === "/health" && request.method === "GET") {
        const state = await buildState(env, DEFAULT_RELATIONSHIP_ID);
        return json(
          {
            ok: true,
            service: "relateiq-cloudflare-api",
            default_relationship_id: DEFAULT_RELATIONSHIP_ID,
            questionnaireImported: state.questionnaireImported,
            groqConfigured: getGroqApiKeys(env).length > 0,
            groqKeysAvailable: getGroqApiKeys(env).length,
            groqModel: getGroqModel(env),
          },
          request,
          env,
        );
      }

    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      const body = await readJson(request);
      const email = String(body?.email || "").trim().toLowerCase();
      const password = String(body?.password || "");
      const user = await getUserByEmailPersistent(env, email);
      if (!user) {
        return json({ error: "invalid_credentials" }, request, env, 401);
      }

      const candidateHash = await sha256Hex(password);
      if (candidateHash !== user.password_hash) {
        return json({ error: "invalid_credentials" }, request, env, 401);
      }

      const relationships = await getRelationshipsForUserPersistent(env, user.id);
      const token = await createSessionToken(
        {
          user_id: user.id,
          email: user.email,
          name: user.name,
          issued_at: new Date().toISOString(),
        },
        env,
      );

      return json(
        {
          ok: true,
          token,
          user: sanitizeUser(user),
          relationships,
          default_relationship_id: relationships[0]?.id || DEFAULT_RELATIONSHIP_ID,
        },
        request,
        env,
      );
    }

    if (url.pathname === "/api/auth/register" && request.method === "POST") {
      const body = await readJson(request);
      const created = await createUserAccountPersistent(env, {
        email: String(body?.email || ""),
        password: String(body?.password || ""),
        name: String(body?.name || ""),
      });

      if (!created.ok) {
        return json({ error: created.error }, request, env, 400);
      }

      const user = created.user;
      const relationships = await getRelationshipsForUserPersistent(env, user.id);
      const token = await createSessionToken(
        {
          user_id: user.id,
          email: user.email,
          name: user.name,
          issued_at: new Date().toISOString(),
        },
        env,
      );

      return json(
        {
          ok: true,
          token,
          user: sanitizeUser(user),
          relationships,
          default_relationship_id: relationships[0]?.id || "",
        },
        request,
        env,
      );
    }

    if (url.pathname === "/api/auth/me" && request.method === "GET") {
      const user = await readSessionUser(request, env, false);
      if (!user) return json({ error: "unauthorized" }, request, env, 401);
      const relationships = await getRelationshipsForUserPersistent(env, user.id);
      return json(
        {
          ok: true,
          user,
          relationships,
          default_relationship_id: relationships[0]?.id || DEFAULT_RELATIONSHIP_ID,
        },
        request,
        env,
      );
    }

    if (url.pathname === "/api/relationships" && request.method === "GET") {
      const user = await readSessionUser(request, env, false);
      if (!user) return json({ error: "unauthorized" }, request, env, 401);
      return json({ relationships: await getRelationshipsForUserPersistent(env, user.id) }, request, env);
    }

    if (url.pathname === "/api/relationships/manage" && request.method === "GET") {
      const user = await readSessionUser(request, env, false);
      if (!user) return json({ error: "unauthorized" }, request, env, 401);
      return json({ rows: await listRelationshipAdminRowsPersistent(env, user.id) }, request, env);
    }

    if (url.pathname === "/api/relationships/create" && request.method === "POST") {
      const user = await readSessionUser(request, env, false);
      if (!user) return json({ error: "unauthorized" }, request, env, 401);
      const body = await readJson(request);
      const created = await createRelationshipForUserPersistent(env, {
        creatorUserId: user.id,
        name: String(body?.name || ""),
        type: (body?.type || "romantic") as RelationshipType,
      });
      if (!created.ok) {
        return json({ error: created.error }, request, env, 400);
      }
      const relationshipList = await getRelationshipsForUserPersistent(env, user.id);
      const mergedRelationships = relationshipList.some((entry) => entry.id === created.summary.id)
        ? relationshipList
        : [created.summary, ...relationshipList];
      return json(
        {
          ok: true,
          relationship: created.summary,
          relationships: mergedRelationships,
        },
        request,
        env,
      );
    }

    if (url.pathname === "/api/relationships/invite" && request.method === "POST") {
      const body = await readJson(request);
      const scoped = await requireRelationshipOwner(request, env, url, body);
      if ("error" in scoped) {
        return json({ error: scoped.error }, request, env, scoped.status);
      }

      const created = await createRelationshipInvitePersistent(env, {
        relationshipId: scoped.relationshipId,
        invitedEmail: String(body?.email || ""),
        invitedName: String(body?.name || ""),
        provisionalPassword: String(body?.password || ""),
      });
      if (!created.ok) {
        return json({ error: created.error }, request, env, 400);
      }

      return json(
        {
          ok: true,
          invite: created.invite,
          reused: created.reused,
          provisional_user: created.provisionalUser || null,
          invite_link: `/invite/${created.invite.invite_token}`,
          absolute_invite_link: `${getFrontendOrigin(request)}/invite/${created.invite.invite_token}`,
        },
        request,
        env,
      );
    }

    if (url.pathname.startsWith("/api/relationships/manage/") && request.method === "PATCH") {
      const user = await readSessionUser(request, env, false);
      if (!user) return json({ error: "unauthorized" }, request, env, 401);
      const relationshipId = normalizeText(url.pathname.split("/").pop() || "");
      const body = await readJson(request);
      const updated = await updateRelationshipAdminEntryPersistent(env, user.id, relationshipId, {
        relationshipName: String(body?.relationship_name || ""),
        relationshipType: (body?.relationship_type || "") as RelationshipType,
        inviteName: String(body?.user_name || ""),
        inviteEmail: String(body?.email || ""),
        temporaryPassword: String(body?.temporary_password || ""),
      });
      if (!updated.ok) {
        return json({ error: updated.error }, request, env, updated.error === "forbidden" ? 403 : 400);
      }
      return json(updated, request, env);
    }

    if (url.pathname.startsWith("/api/relationships/manage/") && request.method === "DELETE") {
      const user = await readSessionUser(request, env, false);
      if (!user) return json({ error: "unauthorized" }, request, env, 401);
      const relationshipId = normalizeText(url.pathname.split("/").pop() || "");
      const deleted = await deleteRelationshipAdminEntryPersistent(env, user.id, relationshipId);
      if (!deleted.ok) {
        return json({ error: deleted.error }, request, env, deleted.error === "forbidden" ? 403 : 400);
      }
      return json(deleted, request, env);
    }

    if (url.pathname.startsWith("/api/invite/") && request.method === "GET") {
      const token = url.pathname.split("/").pop() || "";
      const currentUser = await readSessionUser(request, env, true);
      const result = await getInviteLookupPersistent(env, token, currentUser?.id);
      if (!result) return json({ error: "invite_not_found" }, request, env, 404);
      if ((await findInviteByTokenPersistent(env, token))?.status === "expired") {
        return json({ error: "invite_expired" }, request, env, 410);
      }
      return json(
        {
          ok: true,
          invite: result.invite,
          relationship: result.relationship,
          inviter: result.inviter,
          already_member: result.already_member,
        },
        request,
        env,
      );
    }

    if (url.pathname.startsWith("/api/invite/") && request.method === "POST") {
      const token = url.pathname.split("/").pop() || "";
      const user = await readSessionUser(request, env, false);
      if (!user) return json({ error: "unauthorized" }, request, env, 401);

      const accepted = await acceptRelationshipInvitePersistent(env, { token, userId: user.id });
      if (!accepted.ok) {
        const status = accepted.error === "invite_expired" ? 410 : 400;
        return json({ error: accepted.error }, request, env, status);
      }

      return json(
        {
          ok: true,
          relationship: accepted.summary,
          relationships: await getRelationshipsForUserPersistent(env, user.id),
          already_member: accepted.alreadyMember,
          default_relationship_id: accepted.relationship.id,
        },
        request,
        env,
      );
    }

    if (url.pathname === "/api/relationships/onboarding" && request.method === "POST") {
      const body = await readJson(request);
      const scoped = await requireScopedRelationship(request, env, url, body);
      if ("error" in scoped) {
        return json({ error: scoped.error }, request, env, scoped.status);
      }

      const saved = await submitRelationshipOnboardingPersistent(env, {
        relationshipId: scoped.relationshipId,
        userId: scoped.user.id,
        selfDescription: String(body?.self_description || ""),
        supportStyle: String(body?.support_style || ""),
        supportNotes: String(body?.support_notes || ""),
        communicationNote: String(body?.communication_note || ""),
        skipped: Boolean(body?.skipped),
      });

      if (!saved.ok) {
        return json({ error: saved.error }, request, env, 400);
      }

      return json(
        {
          ok: true,
          onboarding: saved.onboarding,
          relationships: await getRelationshipsForUserPersistent(env, scoped.user.id),
        },
        request,
        env,
      );
    }

    if (url.pathname === "/api/state" && request.method === "GET") {
      const scoped = await requireScopedRelationship(request, env, url);
      if ("error" in scoped) {
        return json({ error: scoped.error }, request, env, scoped.status);
      }
      return json(await buildState(env, scoped.relationshipId), request, env);
    }

    if (
      (url.pathname.startsWith("/api/questionnaire/") || url.pathname.startsWith("/questionnaire/")) &&
      request.method === "GET"
    ) {
      const person = url.pathname.split("/").pop() === "Drew" ? "Drew" : "Tony";
      const uploaded = await loadUploadedQuestionnaire(env, person);
      return json(
        {
          person,
          fileName: uploaded?.fileName,
          uploadedAt: uploaded?.uploadedAt,
          responses: uploaded?.responses || [],
        },
        request,
        env,
      );
    }

    if ((url.pathname === "/api/questionnaire" || url.pathname === "/questionnaire") && request.method === "POST") {
      const body = await readJson(request);
      const person: PersonId = body?.person === "Drew" ? "Drew" : "Tony";

      if (!env.QUESTIONNAIRES) {
        return json({ error: "questionnaire_storage_unavailable" }, request, env, 500);
      }

      if (!body || typeof body !== "object" || !body.raw) {
        return json({ error: "invalid_payload" }, request, env, 400);
      }

      const raw = body.raw as Record<string, unknown> | Array<Record<string, unknown>>;
      const responses = getResponseArray(raw);
      const payload: UploadedQuestionnaire = {
        person,
        fileName: String(body.fileName || `${person.toLowerCase()}.questionnaire.json`),
        uploadedAt: nowIso(),
        responses,
        raw,
      };

      await kvPutJson(env, `questionnaire:${person}`, payload);

      return json(
        {
          ok: true,
          person,
          importedQuestions: responses.length,
          ready: responses.length === 94,
          fileName: payload.fileName,
        },
        request,
        env,
      );
    }

    if (url.pathname === "/api/questionnaire/preview" && request.method === "POST") {
      const body = await readJson(request);
      const responses =
        body && typeof body === "object" && body.raw
          ? getResponseArray(body.raw as Record<string, unknown> | Array<Record<string, unknown>>)
          : [];

      return json(
        {
          ok: true,
          person: body?.person || "Unknown",
          responseCount: responses.length,
          expectedQuestions: 94,
          ready: responses.length === 94,
        },
        request,
        env,
      );
    }

    if (url.pathname === "/api/questionnaire/prefill" && request.method === "POST") {
      const user = await readSessionUser(request, env, false);
      if (!user) return json({ error: "unauthorized" }, request, env, 401);

      const body = await readJson(request);
      const results = await prefillQuestionnairesFromBaselinePersistent(env, user, {
        relationshipId: normalizeText(body?.relationship_id),
        personName: normalizeText(body?.person_name),
        overwrite: Boolean(body?.overwrite),
        allEligible: Boolean(body?.all_eligible),
      });

      return json(
        {
          ok: true,
          results,
          relationships: await getRelationshipsForUserPersistent(env, user.id),
        },
        request,
        env,
      );
    }

    if (url.pathname === "/api/questionnaire/upload" && request.method === "POST") {
      return this.fetch(
        new Request(new URL("/api/questionnaire", url).toString(), {
          method: "POST",
          headers: request.headers,
          body: request.body,
        }),
        env,
      );
    }

    if (url.pathname === "/api/llm" && request.method === "POST") {
      return handleLlmRequest(request, env);
    }

    if (url.pathname === "/api/files/upload" && request.method === "POST") {
      const body = await readJson(request);
      if (!isObject(body) || !normalizeText(body.data)) {
        return json({ error: "invalid_upload_payload" }, request, env, 400);
      }

      if (!env.QUESTIONNAIRES) {
        return json({ error: "storage_unavailable" }, request, env, 500);
      }

      const fileId = createId("file");
      const fileName = normalizeText(body.fileName) || "upload.bin";
      const mimeType = normalizeText(body.mimeType) || "application/octet-stream";
      const size = Number(body.size || 0) || 0;
      const record = {
        id: fileId,
        fileName,
        mimeType,
        size,
        data: normalizeText(body.data),
        metadata: isObject(body.metadata) ? body.metadata : {},
        created_date: nowIso(),
      };
      await kvPutJson(env, `file:${fileId}`, record);

      return json(
        {
          ok: true,
          id: fileId,
          file_name: fileName,
          mime_type: mimeType,
          size,
          file_url: `${url.origin}/api/files/${fileId}`,
        },
        request,
        env,
        201,
      );
    }

    if (url.pathname.startsWith("/api/files/") && request.method === "GET") {
      const fileId = url.pathname.split("/").pop();
      if (!fileId) return json({ error: "file_id_required" }, request, env, 400);
      const record = await kvGetJson<Record<string, unknown>>(env, `file:${fileId}`);
      if (!record || !normalizeText(record.data)) {
        return json({ error: "not_found" }, request, env, 404);
      }

      const bytes = decodeBase64ToBytes(normalizeText(record.data));
      const corsHeaders = getCorsHeaders(request, env);
      delete corsHeaders["content-type"];
      return new Response(bytes, {
        status: 200,
        headers: {
          ...corsHeaders,
          "content-type": normalizeText(record.mimeType) || "application/octet-stream",
          "content-disposition": `inline; filename="${normalizeText(record.fileName) || "file"}"`,
          "cache-control": "private, max-age=3600",
        },
      });
    }

    if (url.pathname === "/api/email/send" && request.method === "POST") {
      const body = await readJson(request);
      if (!isObject(body) || !normalizeText(body.to) || !normalizeText(body.subject)) {
        return json({ error: "invalid_email_payload" }, request, env, 400);
      }

      const jobId = createId("email");
      const queuedAt = nowIso();
      const jobRecord = {
        id: jobId,
        to: normalizeText(body.to),
        subject: normalizeText(body.subject),
        body: normalizeText(body.body),
        created_date: queuedAt,
        status: "queued",
      };

      await kvPutJson(env, `email:${jobId}`, jobRecord);

      try {
        const delivery = env.EMAIL
          ? await sendEmailThroughCloudflare(env, body)
          : await sendEmailThroughResend(env, body);
        const finalRecord = {
          ...jobRecord,
          status: delivery.sent ? "sent" : "queued",
          provider: delivery.provider,
          provider_result: delivery,
          updated_date: nowIso(),
        };
        await kvPutJson(env, `email:${jobId}`, finalRecord);
        return json(
          {
            ok: true,
            id: jobId,
            ...delivery,
          },
          request,
          env,
        );
      } catch (error) {
        const failedRecord = {
          ...jobRecord,
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
          updated_date: nowIso(),
        };
        await kvPutJson(env, `email:${jobId}`, failedRecord);
        return json(
          {
            ok: false,
            id: jobId,
            error: failedRecord.error,
          },
          request,
          env,
          502,
        );
      }
    }

    if (url.pathname === "/api/interpret" && request.method === "POST") {
      const body = await readJson(request);
      if (!isObject(body) || !normalizeText(body.rawInput)) {
        return json({ error: "invalid_payload" }, request, env, 400);
      }
      const relationshipId = relationshipIdFrom(request, url, body) || DEFAULT_RELATIONSHIP_ID;
      const relationship = await getRelationshipPersistent(env, relationshipId);
      const participants = getScopedParticipants(relationship);
      const speaker = normalizeScopedPerson(body.speaker, participants, 0);
      const partner = normalizeScopedPerson(body.partner, participants, speaker === participants[0] ? 1 : 0);
      const result = await runSharedInterpretation(env, {
        sourceType: normalizeText(body.sourceType) || "manual",
        moduleContext: normalizeText(body.moduleContext) || "Shared Interpretation",
        scope: normalizeScopedScope(body.scope, participants) || `${speaker}+${partner}`,
        speaker,
        partner,
        rawInput: normalizeText(body.rawInput),
        desiredOutcome: normalizeText(body.desiredOutcome),
        relatedId: normalizeText(body.relatedId) || null,
        relatedSessionId: normalizeText(body.relatedSessionId) || null,
        contextObject: isObject(body.contextObject) ? body.contextObject : null,
      });

      return json(
        {
          ok: true,
          interpretation: result.finalInterpretation,
          parsedInput: result.parsedInput,
          interpretationCandidates: result.interpretationCandidates,
          interpretationLogId: result.interpretationLog.id,
          speakerDimensions: result.speakerDimensions,
          partnerDimensions: result.partnerDimensions,
          provider: result.provider,
          model: result.model,
        },
        request,
        env,
      );
    }

    if ((url.pathname === "/api/coach" || url.pathname === "/coach") && request.method === "POST") {
      const body = await readJson(request);
      const scoped = await requireScopedRelationship(request, env, url, body);
      if ("error" in scoped) {
        return json({ error: scoped.error }, request, env, scoped.status);
      }
      const participants = getScopedParticipants(scoped.relationship);
      const speaker = normalizeScopedPerson(body?.speaker, participants, 0);
      const partner = getScopedPartner(speaker, participants);
      const topic = String(body?.topic || "");
      const goal = String(body?.goal || "");
      const aiResponse = await buildAiCoachResponse(env, scoped.relationshipId, scoped.relationship.type, speaker, partner, topic, goal);
      return json(
        aiResponse || {
          ...buildCoachResponse({ relationshipId: scoped.relationshipId, speaker, topic, goal }),
          relationship_id: scoped.relationshipId,
          provider: "deterministic",
          fallback: true,
        },
        request,
        env,
      );
    }

    if ((url.pathname === "/api/check-in" || url.pathname === "/check-in") && request.method === "POST") {
      const body = await readJson(request);
      const scoped = await requireScopedRelationship(request, env, url, body);
      if ("error" in scoped) {
        return json({ error: scoped.error }, request, env, scoped.status);
      }
      const participants = getScopedParticipants(scoped.relationship);
      const speaker = normalizeScopedPerson(body?.speaker, participants, 0);
      const partner = getScopedPartner(speaker, participants);
      const mood = String(body?.mood || "");
      const notes = String(body?.notes || "");
      const aiResponse = await buildAiCheckInResponse(env, scoped.relationshipId, scoped.relationship.type, speaker, partner, mood, notes);
      return json(
        aiResponse || {
          ...buildCheckInResponse({ relationshipId: scoped.relationshipId, speaker, mood, notes }),
          relationship_id: scoped.relationshipId,
          provider: "deterministic",
          fallback: true,
        },
        request,
        env,
      );
    }

    if ((url.pathname === "/api/repair" || url.pathname === "/repair") && request.method === "POST") {
      const body = await readJson(request);
      const scoped = await requireScopedRelationship(request, env, url, body);
      if ("error" in scoped) {
        return json({ error: scoped.error }, request, env, scoped.status);
      }
      const participants = getScopedParticipants(scoped.relationship);
      const speaker = normalizeScopedPerson(body?.speaker, participants, 0);
      const partner = getScopedPartner(speaker, participants);
      const issue = String(body?.issue || "");
      const desiredOutcome = String(body?.desiredOutcome || "");
      const aiResponse = await buildAiRepairResponse(env, scoped.relationshipId, scoped.relationship.type, speaker, partner, issue, desiredOutcome);
      return json(
        aiResponse || {
          ...buildRepairResponse({ relationshipId: scoped.relationshipId, speaker, issue, desiredOutcome }),
          relationship_id: scoped.relationshipId,
          provider: "deterministic",
          fallback: true,
        },
        request,
        env,
      );
    }

    if ((url.pathname === "/api/insights" || url.pathname === "/insights") && request.method === "GET") {
      const scoped = await requireScopedRelationship(request, env, url);
      if ("error" in scoped) {
        return json({ error: scoped.error }, request, env, scoped.status);
      }
      const state = await buildState(env, scoped.relationshipId);
      const insightEntries = (await listEntityRecords(env, "InsightEntry")).filter(
        (entry) => normalizeText(entry.relationship_id) === scoped.relationshipId,
      );
      return json(
        {
          profiles: state.profiles,
          builtInInsights: state.insights,
          storedInsights: sortRecords(insightEntries, "-updated_date"),
        },
        request,
        env,
      );
    }

    if ((url.pathname === "/api/analysis" || url.pathname === "/analysis") && request.method === "POST") {
      const body = await readJson(request);
      return json(
        {
          ok: true,
          mode: body?.mode || "deep",
          perspective: body?.perspective || "Tony→Drew",
          trace: "analysis endpoint wired to the worker; frontend deterministic engines remain the primary analysis layer.",
        },
        request,
        env,
      );
    }

    if (url.pathname === "/api/play-lab/session" && request.method === "POST") {
      const body = await readJson(request);
      if (!isObject(body)) {
        return json({ error: "invalid_payload" }, request, env, 400);
      }
      const scoped = await requireScopedRelationship(request, env, url, body);
      if ("error" in scoped) {
        return json({ error: scoped.error }, request, env, scoped.status);
      }

      const moduleType = normalizeText(body.moduleType) as PlayLabModuleType;
      if (!PLAY_LAB_MODULE_LABELS[moduleType]) {
        return json({ error: "invalid_module_type" }, request, env, 400);
      }

      const participants = getScopedParticipants(scoped.relationship);
      const initiatedBy = normalizeScopedPerson(body.initiatedBy, participants, 0);
      const answeringPerson = normalizeScopedPerson(
        body.answeringPerson,
        participants,
        initiatedBy === participants[0] ? 0 : 1,
      );
      const scope = normalizeScopedScope(body.scope, participants) || `${participants[0]}+${participants[1]}`;
      const promptText = pickPrompt(moduleType, `${moduleType}:${scope}:${initiatedBy}`);

      const record = await createEntityRecord(env, "PlayLabSession", {
        module_type: moduleType,
        module_label: PLAY_LAB_MODULE_LABELS[moduleType],
        scope,
        initiated_by: initiatedBy,
        answering_person: answeringPerson,
        status: "awaiting_input",
        prompt_text: promptText,
        source_context: {
          page: "Play Lab",
          createdFrom: normalizeText(body.createdFrom) || "play_lab",
        },
        related_session_id: normalizeText(body.relatedSessionId) || null,
      }, scoped.relationshipId);

      return json(
        {
          ok: true,
          session: record,
          promptText,
        },
        request,
        env,
        201,
      );
    }

    if (url.pathname === "/api/play-lab/refresh" && request.method === "POST") {
      const body = await readJson(request);
      if (!isObject(body)) {
        return json({ error: "invalid_payload" }, request, env, 400);
      }
      const scoped = await requireScopedRelationship(request, env, url, body);
      if ("error" in scoped) {
        return json({ error: scoped.error }, request, env, scoped.status);
      }

      const moduleType = normalizeText(body.moduleType) as PlayLabModuleType;
      if (!PLAY_LAB_MODULE_LABELS[moduleType]) {
        return json({ error: "invalid_module_type" }, request, env, 400);
      }

      const participants = getScopedParticipants(scoped.relationship);
      const scope = normalizeScopedScope(body.scope, participants) || `${participants[0]}+${participants[1]}`;
      const initiatedBy = normalizeScopedPerson(body.initiatedBy, participants, 0);
      const answeringPerson = normalizeScopedPerson(
        body.answeringPerson,
        participants,
        initiatedBy === participants[0] ? 0 : 1,
      );
      const currentContextObject = isObject(body.currentContextObject) ? body.currentContextObject : null;
      const memory = await buildPlayLabMemory(env, scope, scoped.relationshipId);
      const promptText = pickAdaptivePlayLabPrompt(moduleType, memory, scope);

      const record = await createEntityRecord(env, "PlayLabSession", {
        module_type: moduleType,
        module_label: PLAY_LAB_MODULE_LABELS[moduleType],
        scope,
        initiated_by: initiatedBy,
        answering_person: answeringPerson,
        status: "awaiting_input",
        prompt_text: promptText,
        source_context: {
          page: "Play Lab",
          createdFrom: "play_lab_refresh",
          previousContext: currentContextObject,
        },
        related_session_id: normalizeText(body.relatedSessionId) || null,
      }, scoped.relationshipId);

      return json(
        {
          ok: true,
          session: record,
          promptText,
          adaptiveSignals: inferPlayLabThemesFromMemory(memory),
        },
        request,
        env,
        201,
      );
    }

    if (url.pathname === "/api/play-lab/submit" && request.method === "POST") {
      const body = await readJson(request);
      if (!isObject(body) || !normalizeText(body.sessionId) || !normalizeText(body.responseValue)) {
        return json({ error: "invalid_payload" }, request, env, 400);
      }
      const scoped = await requireScopedRelationship(request, env, url, body);
      if ("error" in scoped) {
        return json({ error: scoped.error }, request, env, scoped.status);
      }
      const participants = getScopedParticipants(scoped.relationship);

      const responseRecord = await createEntityRecord(env, "PlayLabResponse", {
        session_id: normalizeText(body.sessionId),
        user_id:
          normalizeText(body.userId) ||
          normalizeScopedPerson(body.userId || body.person || body.roleInSession, participants, 0),
        role_in_session: normalizeText(body.roleInSession) || "participant",
        response_type: normalizeText(body.responseType) || "text",
        response_value: normalizeText(body.responseValue),
        response_label: normalizeText(body.responseLabel),
        confidence: typeof body.confidence === "number" ? body.confidence : null,
        tags: Array.isArray(body.tags) ? body.tags.filter(Boolean).map((tag) => normalizeText(tag)) : [],
        metadata: isObject(body.metadata) ? body.metadata : null,
      }, scoped.relationshipId);

      await updateEntityRecord(env, "PlayLabSession", normalizeText(body.sessionId), {
        status: "in_progress",
        last_input_at: nowIso(),
      }, scoped.relationshipId);

      return json({ ok: true, response: responseRecord }, request, env, 201);
    }

    if (
      (url.pathname === "/api/play-lab/evaluate" || url.pathname === "/api/play-lab/repair-plan") &&
      request.method === "POST"
    ) {
      const body = await readJson(request);
      if (!isObject(body) || !normalizeText(body.sessionId)) {
        return json({ error: "invalid_payload" }, request, env, 400);
      }
      const scoped = await requireScopedRelationship(request, env, url, body);
      if ("error" in scoped) {
        return json({ error: scoped.error }, request, env, scoped.status);
      }

      const sessionId = normalizeText(body.sessionId);
      const participants = getScopedParticipants(scoped.relationship);
      const session = await getEntityRecord(env, "PlayLabSession", sessionId, scoped.relationshipId);
      if (!session) {
        return json({ error: "session_not_found" }, request, env, 404);
      }

      const moduleType = (normalizeText(body.moduleType) || normalizeText(session.module_type)) as PlayLabModuleType;
      if (!PLAY_LAB_MODULE_LABELS[moduleType]) {
        return json({ error: "invalid_module_type" }, request, env, 400);
      }

      const initiatedBy = normalizeScopedPerson(body.initiatedBy || session.initiated_by, participants, 0);
      const scope = normalizeScopedScope(body.scope || session.scope, participants) || `${participants[0]}+${participants[1]}`;
      const memory = await buildPlayLabMemory(env, scope, scoped.relationshipId);
      const sourceInputs = {
        promptText: normalizeText(body.promptText || session.prompt_text),
        actualAnswer: normalizeText(body.actualAnswer),
        guessedAnswer: normalizeText(body.guessedAnswer),
        currentNeed: normalizeText(body.currentNeed),
        currentNeedType: normalizeText(body.currentNeedType),
        predictedNeed: normalizeText(body.predictedNeed),
        predictedNeedType: normalizeText(body.predictedNeedType),
        stressSource: normalizeText(body.stressSource),
        situation: normalizeText(body.situation),
        unresolved: normalizeText(body.unresolved),
        unresolvedTag: normalizeText(body.unresolvedTag),
        emotionalState: normalizeText(body.emotionalState),
        selectedMisread: normalizeText(body.selectedMisread),
        selectedMisreadWhy: normalizeText(body.selectedMisreadWhy),
        answerConfidence: typeof body.answerConfidence === "number" ? body.answerConfidence : undefined,
        guessConfidence: typeof body.guessConfidence === "number" ? body.guessConfidence : undefined,
      };

      const resultCore = await buildPlayLabAiResult(
        env,
        {
          moduleType,
          promptText: sourceInputs.promptText,
          actualAnswer: sourceInputs.actualAnswer,
          guessedAnswer: sourceInputs.guessedAnswer,
          currentNeed: sourceInputs.currentNeed,
          currentNeedType: sourceInputs.currentNeedType,
          predictedNeed: sourceInputs.predictedNeed,
          predictedNeedType: sourceInputs.predictedNeedType,
          stressSource: sourceInputs.stressSource,
          situation: sourceInputs.situation,
          unresolved: sourceInputs.unresolved,
          unresolvedTag: sourceInputs.unresolvedTag,
          emotionalState: sourceInputs.emotionalState,
          selectedMisread: sourceInputs.selectedMisread,
          selectedMisreadWhy: sourceInputs.selectedMisreadWhy,
          answerConfidence: sourceInputs.answerConfidence,
          guessConfidence: sourceInputs.guessConfidence,
          initiatedBy,
          scope,
        },
        memory,
      );

      const contextObject = buildPlayLabContextObject({
        moduleType,
        scope,
        sourceInputs,
        memory,
        sessionId,
        originalOutput: resultCore,
      });

      const resultRecord = await createEntityRecord(env, "PlayLabResult", {
        session_id: sessionId,
        module_type: moduleType,
        scope,
        match_score: resultCore.matchScore,
        mismatch_type: resultCore.mismatchType,
        ai_summary: resultCore.summary,
        suggested_action: resultCore.suggestedAction,
        inferred_tags: resultCore.inferredTags,
        confidence_level: resultCore.confidenceLevel,
        context_object: contextObject,
        sections: resultCore.sections,
        statements: resultCore.statements,
        interpretation: resultCore.interpretation,
        interpretation_log_id: resultCore.interpretationLogId || null,
        provider: resultCore.provider,
        model: resultCore.model || null,
        key_index: resultCore.keyIndex ?? null,
      }, scoped.relationshipId);

      await safelyCaptureMetricSignals(env, buildPlayLabMetricSignals(resultRecord));

      const ahaRecord = await createEntityRecord(env, "AhaCard", {
        title: resultCore.ahaCard.title,
        body: resultCore.ahaCard.body,
        scope,
        source_type: moduleType,
        related_session_id: sessionId,
        inferred_tags: resultCore.inferredTags,
        saved_by_user: initiatedBy,
      }, scoped.relationshipId);

      await createEntityRecord(env, "InsightEntry", {
        perspective:
          scope === `${participants[0]}+${participants[1]}`
            ? `${initiatedBy}→${resolvePlayLabPartner(initiatedBy, participants)}`
            : scope,
        mode: "play-lab",
        core_insight: resultCore.summary,
        behavioral_patterns: (resultCore.sections || []).slice(0, 2).map((section) => normalizeText(section.body)),
        risk_flags: [normalizeText(resultCore.interpretation)].filter(Boolean),
        strengths: [normalizeText(resultCore.suggestedAction?.description)].filter(Boolean),
        scenario: normalizeText(sourceInputs.promptText || sourceInputs.situation),
        confidence_score: Math.max(0.2, Math.min(0.95, (Number(resultCore.matchScore) || 50) / 100)),
        frameworks_used:
          moduleType === "repair_quest"
            ? ["Gottman Method", "Emotionally Focused Therapy"]
            : moduleType === "stress_decoder"
            ? ["Support Matching", "Attachment Lens"]
            : ["Perspective Taking"],
        note: "",
        source_type: "play_lab",
        related_session_id: sessionId,
      }, scoped.relationshipId);

      await updateEntityRecord(env, "PlayLabSession", sessionId, {
        status: "completed",
        result_id: resultRecord.id,
        aha_card_id: ahaRecord.id,
        context_object: contextObject,
      }, scoped.relationshipId);

      return json(
        {
          ok: true,
          session,
          result: {
            ...resultRecord,
            moduleLabel: PLAY_LAB_MODULE_LABELS[moduleType],
            suggestedAction: resultCore.suggestedAction,
            sections: resultCore.sections,
            statements: resultCore.statements,
            summary: resultCore.summary,
            interpretation: resultCore.interpretation,
          },
          ahaCard: ahaRecord,
        },
        request,
        env,
      );
    }

    if (url.pathname === "/api/play-lab/aha" && request.method === "POST") {
      const body = await readJson(request);
      if (!isObject(body)) {
        return json({ error: "invalid_payload" }, request, env, 400);
      }
      const scoped = await requireScopedRelationship(request, env, url, body);
      if ("error" in scoped) {
        return json({ error: scoped.error }, request, env, scoped.status);
      }
      const participants = getScopedParticipants(scoped.relationship);
      const scope = normalizeScopedScope(body.scope, participants) || `${participants[0]}+${participants[1]}`;
      const relatedSessionId = normalizeText(body.relatedSessionId);
      const result =
        relatedSessionId
          ? (await queryEntityCollection(env, "PlayLabResult", new URL(`${url.origin}/?q=${encodeURIComponent(JSON.stringify({ session_id: relatedSessionId }))}`), scoped.relationshipId))[0]
          : sortRecords((await listEntityRecords(env, "PlayLabResult")).filter((record) => normalizeText(record.relationship_id) === scoped.relationshipId), "-updated_date")[0];

      const resultSummary = isObject(result) ? normalizeText(result.ai_summary) : "A new pattern is becoming clearer.";
      const ahaRecord = await createEntityRecord(env, "AhaCard", {
        title: normalizeText(body.title) || "Aha unlocked",
        body: normalizeText(body.body) || resultSummary,
        scope,
        source_type: normalizeText(body.sourceType) || "play_lab",
        related_session_id: relatedSessionId || normalizeText(result?.session_id),
        inferred_tags: Array.isArray(body.inferredTags) ? body.inferredTags : result?.inferred_tags || [],
        saved_by_user: normalizeScopedPerson(body.savedByUser, participants, 0),
      }, scoped.relationshipId);

      return json({ ok: true, ahaCard: ahaRecord }, request, env, 201);
    }

    if (url.pathname === "/api/play-lab/side-quest" && request.method === "POST") {
      const body = await readJson(request);
      if (!isObject(body)) {
        return json({ error: "invalid_payload" }, request, env, 400);
      }
      const scoped = await requireScopedRelationship(request, env, url, body);
      if ("error" in scoped) {
        return json({ error: scoped.error }, request, env, scoped.status);
      }
      const participants = getScopedParticipants(scoped.relationship);
      const scope = normalizeScopedScope(body.scope, participants) || participants[0];
      const userId = normalizeScopedPerson(body.userId || scope, participants, 0);
      const memory = await buildPlayLabMemory(env, scope, scoped.relationshipId);
      const topTag =
        Array.isArray(body.focusTags) && body.focusTags.length > 0
          ? normalizeText(body.focusTags[0])
          : extractKeywordsFromText(
              ...sortRecords((await listEntityRecords(env, "PlayLabResult")).filter((record) => normalizeText(record.relationship_id) === relationshipId), "-updated_date")
                .slice(0, 5)
                .map((item) => normalizeText(item.ai_summary)),
            )[0] || "clarity";

      const quest = await createEntityRecord(env, "SideQuest", {
        user_id: userId,
        scope,
        title: normalizeText(body.title) || `One Degree of Change: ${humanizeValue(topTag)}`,
        description:
          normalizeText(body.description) ||
          `Try one small behavior that makes ${getScopedPartner(userId, participants)} feel more understood when pressure is high.`,
        why_chosen:
          normalizeText(body.whyChosen) ||
          `Chosen because recent Play Lab results suggest ${humanizeValue(topTag)} is a high-leverage area right now.`,
        success_definition:
          normalizeText(body.successDefinition) ||
          "You tried it once in a real moment and it slightly improved clarity, safety, or connection.",
        status: "assigned",
        context_object: {
          page: "Play Lab",
          moduleType: "side_quest",
          scope,
          relevantMemoryRetrieved: {
            resultCount: (await listEntityRecords(env, "PlayLabResult")).length,
            questionnaireCounts: memory.questionnaireCounts,
          },
        },
      }, scoped.relationshipId);

      return json({ ok: true, sideQuest: quest }, request, env, 201);
    }

    if (url.pathname === "/api/play-lab/outcome" && request.method === "POST") {
      const body = await readJson(request);
      if (!isObject(body)) {
        return json({ error: "invalid_payload" }, request, env, 400);
      }
      const scoped = await requireScopedRelationship(request, env, url, body);
      if ("error" in scoped) {
        return json({ error: scoped.error }, request, env, scoped.status);
      }
      const participants = getScopedParticipants(scoped.relationship);
      const outcome = await createEntityRecord(env, "OutcomeLog", {
        source_type: normalizeText(body.sourceType) || "play_lab",
        related_id: normalizeText(body.relatedId),
        scope: normalizeScopedScope(body.scope, participants) || `${participants[0]}+${participants[1]}`,
        attempted: Boolean(body.attempted),
        helped: Boolean(body.helped),
        tension_change: Number(body.tensionChange || 0),
        connection_change: Number(body.connectionChange || 0),
        felt_natural: Boolean(body.feltNatural),
        notes: normalizeText(body.notes),
      }, scoped.relationshipId);

      await safelyCaptureMetricSignals(env, buildOutcomeMetricSignals(outcome));

      const scope = normalizeScopedScope(body.scope, participants) || `${participants[0]}+${participants[1]}`;
      const speaker = scope.includes("+") ? participants[0] : normalizeScopedPerson(scope, participants, 0);
      await runSharedInterpretation(env, {
        sourceType: "outcome_tracking",
        moduleContext: "Outcome Tracking",
        scope,
        speaker,
        partner: resolvePlayLabPartner(speaker, participants),
        rawInput: [
          `Attempted: ${Boolean(body.attempted)}`,
          `Helped: ${Boolean(body.helped)}`,
          `Tension change: ${Number(body.tensionChange || 0)}`,
          `Connection change: ${Number(body.connectionChange || 0)}`,
          `Felt natural: ${Boolean(body.feltNatural)}`,
          normalizeText(body.notes),
        ]
          .filter(Boolean)
          .join("\n"),
        desiredOutcome: "learn what helps and what to try again",
        relatedId: outcome.id,
      }).catch(() => null);

      return json({ ok: true, outcome }, request, env, 201);
    }

    if (url.pathname === "/api/play-lab/history" && request.method === "GET") {
      const scoped = await requireScopedRelationship(request, env, url);
      if ("error" in scoped) {
        return json({ error: scoped.error }, request, env, scoped.status);
      }
      const scope = normalizeText(url.searchParams.get("scope")) || "";
      const limit = Number(url.searchParams.get("limit") || 24) || 24;
      const sessions = sortRecords((await listEntityRecords(env, "PlayLabSession")).filter((record) => normalizeText(record.relationship_id) === scoped.relationshipId), "-updated_date")
        .filter((record) => !scope || normalizeText(record.scope).includes(scope) || normalizeText(record.initiated_by) === scope)
        .slice(0, limit);
      const results = sortRecords((await listEntityRecords(env, "PlayLabResult")).filter((record) => normalizeText(record.relationship_id) === scoped.relationshipId), "-updated_date").slice(0, limit);
      return json({ sessions, results }, request, env);
    }

    if (url.pathname === "/api/play-lab/aha-cards" && request.method === "GET") {
      const scoped = await requireScopedRelationship(request, env, url);
      if ("error" in scoped) {
        return json({ error: scoped.error }, request, env, scoped.status);
      }
      const scope = normalizeText(url.searchParams.get("scope")) || "";
      const cards = sortRecords((await listEntityRecords(env, "AhaCard")).filter((record) => normalizeText(record.relationship_id) === scoped.relationshipId), "-updated_date").filter(
        (record) => !scope || normalizeText(record.scope).includes(scope) || normalizeText(record.saved_by_user) === scope,
      );
      return json({ cards }, request, env);
    }

    if (url.pathname === "/api/play-lab/side-quests" && request.method === "GET") {
      const scoped = await requireScopedRelationship(request, env, url);
      if ("error" in scoped) {
        return json({ error: scoped.error }, request, env, scoped.status);
      }
      const scope = normalizeText(url.searchParams.get("scope")) || "";
      const quests = sortRecords((await listEntityRecords(env, "SideQuest")).filter((record) => normalizeText(record.relationship_id) === scoped.relationshipId), "-updated_date").filter(
        (record) => !scope || normalizeText(record.scope).includes(scope) || normalizeText(record.user_id) === scope,
      );
      return json({ quests }, request, env);
    }

    if (
      (url.pathname === "/api/play-lab/explain" || url.pathname === "/api/play-lab/elaborate" || url.pathname === "/api/play-lab/export") &&
      request.method === "POST"
    ) {
      const body = await readJson(request);
      if (!isObject(body)) {
        return json({ error: "invalid_payload" }, request, env, 400);
      }

      const resultRecord = normalizeText(body.resultId)
        ? await getEntityRecord(env, "PlayLabResult", normalizeText(body.resultId))
        : null;
      const contextObject = isObject(body.contextObject)
        ? body.contextObject
        : isObject(resultRecord?.context_object)
        ? resultRecord.context_object
        : null;

      if (!contextObject || !isObject(contextObject)) {
        return json({ error: "context_required" }, request, env, 400);
      }

      const originalOutput = isObject(contextObject.originalOutput)
        ? contextObject.originalOutput
        : resultRecord || {};
      const resultPayload = {
        moduleLabel: PLAY_LAB_MODULE_LABELS[(normalizeText(originalOutput.module_type || contextObject.moduleType) as PlayLabModuleType) || "guess_my_inner_world"] || "Play Lab",
        scope: normalizeText(originalOutput.scope || contextObject.scope) || "Tony+Drew",
        summary: normalizeText(originalOutput.summary || originalOutput.ai_summary),
        sections: Array.isArray(originalOutput.sections) ? originalOutput.sections : [],
        suggestedAction: isObject(originalOutput.suggestedAction || originalOutput.suggested_action)
          ? (originalOutput.suggestedAction || originalOutput.suggested_action)
          : null,
      };

      if (url.pathname === "/api/play-lab/export") {
        return json(
          {
            ok: true,
            title: `${resultPayload.moduleLabel} — ${resultPayload.scope}`,
            text: buildPlayLabExportText(resultPayload),
          },
          request,
          env,
        );
      }

      const mode = url.pathname.endsWith("/elaborate") ? "elaborate" : "explain";
      const fallbackText =
        mode === "elaborate"
          ? `Expanded interpretation: ${resultPayload.summary}\n\n${buildPlayLabExportText(resultPayload)}`
          : `What this means: ${resultPayload.summary}\n\nNext step: ${normalizeText(resultPayload.suggestedAction?.description) || "Reflect the need before moving into solutions."}`;

      try {
        const groq = await callGroq(
          env,
          [
            {
              role: "system",
              content: `You are RelateIQ's Play Lab ${mode} helper. Use only the provided context and return a clear readable response.`,
            },
            {
              role: "user",
              content: [
                `Mode: ${mode}`,
                `Context: ${JSON.stringify(contextObject, null, 2)}`,
                `Result: ${JSON.stringify(resultPayload, null, 2)}`,
              ].join("\n\n"),
            },
          ],
          JSON.stringify(contextObject).length,
        );

        return json({ ok: true, text: groq.text, provider: "groq", model: groq.model }, request, env);
      } catch {
        return json({ ok: true, text: fallbackText, provider: "deterministic", fallback: true }, request, env);
      }
    }

    if (url.pathname.startsWith("/api/data/")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const entity = parts[2];
      const id = parts[3];
      if (!entity) return json({ error: "entity_required" }, request, env, 400);
      const body = request.method === "POST" || request.method === "PUT" ? await readJson(request) : undefined;
      const scoped = await requireScopedRelationship(request, env, url, body);
      if ("error" in scoped) {
        return json({ error: scoped.error }, request, env, scoped.status);
      }

      if (request.method === "GET" && !id) {
        return json(await queryEntityCollection(env, entity, url, scoped.relationshipId), request, env);
      }

      if (request.method === "GET" && id) {
        const record = await getEntityRecord(env, entity, id, scoped.relationshipId);
        return record
          ? json(record, request, env)
          : json({ error: "not_found" }, request, env, 404);
      }

      if (request.method === "POST" && !id) {
        if (!isObject(body)) return json({ error: "invalid_payload" }, request, env, 400);
        const created = await createEntityRecord(env, entity, body, scoped.relationshipId);
        await maybeInterpretEntityWrite(env, entity, created).catch(() => null);
        await safelyCaptureMetricSignals(env, buildEntityMetricSignals(entity, created));
        return json(created, request, env, 201);
      }

      if (request.method === "PUT" && id) {
        if (!isObject(body)) return json({ error: "invalid_payload" }, request, env, 400);
        const updated = await updateEntityRecord(env, entity, id, body, scoped.relationshipId);
        if (updated) {
          await maybeInterpretEntityWrite(env, entity, updated).catch(() => null);
          await safelyCaptureMetricSignals(env, buildEntityMetricSignals(entity, updated));
        }
        return updated
          ? json(updated, request, env)
          : json({ error: "not_found" }, request, env, 404);
      }

      if (request.method === "DELETE" && id) {
        const deleted = await deleteEntityRecord(env, entity, id, scoped.relationshipId);
        return deleted
          ? json({ ok: true, id }, request, env)
          : json({ error: "not_found" }, request, env, 404);
      }
    }

      return json({ error: "not_found" }, request, env, 404);
    } catch (error) {
      return json(
        {
          error: "internal_error",
          message: error instanceof Error ? error.message : String(error),
        },
        request,
        env,
        500,
      );
    }
  },
};
