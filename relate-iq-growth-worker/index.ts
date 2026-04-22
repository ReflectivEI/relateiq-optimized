import {
  RELATEIQ_STATE,
  type AppState,
  type PersonId,
  type QuestionnaireSummary,
  type UploadedQuestionnaire,
  buildCoachResponse,
  buildCheckInResponse,
  buildRepairResponse,
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
    "access-control-allow-headers": "Content-Type",
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

function toQuestionnaireRecord(person: PersonId, response: Record<string, unknown>, uploadedAt?: string): StoredRecord {
  const questionId = normalizeText(response.question_id) || createId("question");
  return {
    ...response,
    id: `${person}:${questionId}`,
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

  return questionnaires.flatMap((questionnaire) => {
    if (!questionnaire) return [];
    return questionnaire.responses.map((response) =>
      toQuestionnaireRecord(questionnaire.person, response, questionnaire.uploadedAt),
    );
  });
}

async function getQuestionnaireResponseRecord(env: Env, id: string): Promise<StoredRecord | null> {
  const records = await listQuestionnaireResponseRecords(env);
  return records.find((record) => record.id === id) || null;
}

async function upsertQuestionnaireResponse(
  env: Env,
  incoming: Record<string, unknown>,
  existingId?: string,
): Promise<StoredRecord> {
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

async function queryEntityCollection(
  env: Env,
  entity: string,
  requestUrl: URL,
): Promise<Array<Record<string, unknown>>> {
  const records =
    entity === "QuestionnaireResponse"
      ? await listQuestionnaireResponseRecords(env)
      : await listEntityRecords(env, entity);

  const queryValue = requestUrl.searchParams.get("q");
  let filtered = records;
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

  const sorted = sortRecords(filtered, requestUrl.searchParams.get("sort"));
  const sliced = sliceRecords(sorted, requestUrl.searchParams.get("skip"), requestUrl.searchParams.get("limit"));
  return selectFields(sliced, requestUrl.searchParams.get("fields"));
}

async function getEntityRecord(env: Env, entity: string, id: string): Promise<StoredRecord | null> {
  if (entity === "QuestionnaireResponse") {
    return getQuestionnaireResponseRecord(env, id);
  }
  return kvGetJson<StoredRecord>(env, `data:${slugifyEntity(entity)}:${id}`);
}

async function createEntityRecord(env: Env, entity: string, body: Record<string, unknown>): Promise<StoredRecord> {
  if (entity === "QuestionnaireResponse") {
    return upsertQuestionnaireResponse(env, body);
  }

  const timestamp = nowIso();
  const record: StoredRecord = {
    ...body,
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
): Promise<StoredRecord | null> {
  if (entity === "QuestionnaireResponse") {
    return upsertQuestionnaireResponse(env, body, id);
  }

  const current = await getEntityRecord(env, entity, id);
  if (!current) return null;
  const record: StoredRecord = {
    ...current,
    ...body,
    id,
    created_date: normalizeText(current.created_date) || nowIso(),
    updated_date: nowIso(),
  };
  await kvPutJson(env, `data:${slugifyEntity(entity)}:${id}`, record);
  return record;
}

async function deleteEntityRecord(env: Env, entity: string, id: string): Promise<boolean> {
  if (!env.QUESTIONNAIRES) return false;
  if (entity === "QuestionnaireResponse") {
    return deleteQuestionnaireResponse(env, id);
  }
  const key = `data:${slugifyEntity(entity)}:${id}`;
  const existing = await env.QUESTIONNAIRES.get(key);
  if (!existing) return false;
  await env.QUESTIONNAIRES.delete(key);
  return true;
}

async function buildState(env: Env): Promise<AppState> {
  const questionnaires = await Promise.all(
    RELATEIQ_STATE.questionnaires.map(async (summary) => {
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
    ...RELATEIQ_STATE,
    questionnaireImported: questionnaires.every((item) => item.importReady),
    questionnaires,
  };
}

async function buildAiCoachResponse(
  env: Env,
  speaker: PersonId,
  topic: string,
  goal: string,
): Promise<Record<string, unknown> | null> {
  const speakerQuestionnaire = await loadUploadedQuestionnaire(env, speaker);
  const partner = speaker === "Tony" ? "Drew" : "Tony";
  const partnerQuestionnaire = await loadUploadedQuestionnaire(env, partner);
  const fallback = buildCoachResponse({ speaker, topic, goal });

  const messages: GroqMessage[] = [
    {
      role: "system",
      content:
        "You are RelateIQ's AI Coach. Use only the questionnaire evidence and user input provided. Do not invent history, diagnoses, or traits. Return strict JSON with keys: response (string), suggestedOpeners (string[]), avoid (string[]), lens (object with speakerStyle and partnerStyle). Keep the tone warm, direct, and practical.",
    },
    {
      role: "user",
      content: [
        `Speaker: ${speaker}`,
        `Topic: ${topic || "Not provided"}`,
        `Goal: ${goal || "Not provided"}`,
        buildQuestionnaireContext(speakerQuestionnaire, speaker),
        buildQuestionnaireContext(partnerQuestionnaire, partner),
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
  speaker: PersonId,
  mood: string,
  notes: string,
): Promise<Record<string, unknown> | null> {
  const speakerQuestionnaire = await loadUploadedQuestionnaire(env, speaker);
  const partner = speaker === "Tony" ? "Drew" : "Tony";
  const partnerQuestionnaire = await loadUploadedQuestionnaire(env, partner);
  const fallback = buildCheckInResponse({ speaker, mood, notes });

  const messages: GroqMessage[] = [
    {
      role: "system",
      content:
        "You are RelateIQ's Check-In assistant. Use only the questionnaire evidence and user input provided. Return strict JSON with keys: summary (string), nextStep (string), notesEcho (string). No diagnosis, no generic filler, no invented memories.",
    },
    {
      role: "user",
      content: [
        `Speaker: ${speaker}`,
        `Mood / energy: ${mood || "Not provided"}`,
        `Current notes: ${notes || "Not provided"}`,
        buildQuestionnaireContext(speakerQuestionnaire, speaker),
        buildQuestionnaireContext(partnerQuestionnaire, partner),
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
  speaker: PersonId,
  issue: string,
  desiredOutcome: string,
): Promise<Record<string, unknown> | null> {
  const speakerQuestionnaire = await loadUploadedQuestionnaire(env, speaker);
  const partner = speaker === "Tony" ? "Drew" : "Tony";
  const partnerQuestionnaire = await loadUploadedQuestionnaire(env, partner);
  const fallback = buildRepairResponse({ speaker, issue, desiredOutcome });

  const messages: GroqMessage[] = [
    {
      role: "system",
      content:
        "You are RelateIQ's Repair Planner. Use only the questionnaire evidence and user input provided. Return strict JSON with keys: summary (string), scripts (string[]), avoid (string[]), desiredOutcome (string). No invented facts. Make it specific to the two people described.",
    },
    {
      role: "user",
      content: [
        `Speaker: ${speaker}`,
        `Issue: ${issue || "Not provided"}`,
        `Desired outcome: ${desiredOutcome || "Not provided"}`,
        buildQuestionnaireContext(speakerQuestionnaire, speaker),
        buildQuestionnaireContext(partnerQuestionnaire, partner),
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
  return value === "Drew" ? "Drew" : fallback;
}

function resolvePlayLabPartner(person: PersonId): PersonId {
  return person === "Tony" ? "Drew" : "Tony";
}

function humanizeValue(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .trim();
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

async function getLatestRelationshipDynamic(env: Env) {
  const records = await listEntityRecords(env, "RelationshipDynamic");
  return sortRecords(records, "-updated_date")[0] || null;
}

async function buildPlayLabMemory(env: Env, scope: string) {
  const [profiles, sessions, checkIns, triggers, repairs, outcomes, insightEntries, relationshipDynamic, playLabSessions, playLabResults] =
    await Promise.all([
      listEntityRecords(env, "UserProfile"),
      listEntityRecords(env, "CoachSession"),
      listEntityRecords(env, "CheckIn"),
      listEntityRecords(env, "TriggerEntry"),
      listEntityRecords(env, "RepairEntry"),
      listEntityRecords(env, "OutcomeLog"),
      listEntityRecords(env, "InsightEntry"),
      getLatestRelationshipDynamic(env),
      listEntityRecords(env, "PlayLabSession"),
      listEntityRecords(env, "PlayLabResult"),
    ]);

  const tonyQuestionnaire = await loadUploadedQuestionnaire(env, "Tony");
  const drewQuestionnaire = await loadUploadedQuestionnaire(env, "Drew");

  return {
    scope,
    profiles,
    sessions: sortRecords(sessions, "-updated_date").slice(0, 12),
    checkIns: sortRecords(checkIns, "-updated_date").slice(0, 12),
    triggers: sortRecords(triggers, "-updated_date").slice(0, 12),
    repairs: sortRecords(repairs, "-updated_date").slice(0, 12),
    outcomes: sortRecords(outcomes, "-updated_date").slice(0, 12),
    insights: sortRecords(insightEntries, "-updated_date").slice(0, 12),
    playLabSessions: sortRecords(playLabSessions, "-updated_date").slice(0, 20),
    playLabResults: sortRecords(playLabResults, "-updated_date").slice(0, 20),
    relationshipDynamic,
    questionnaireCounts: {
      Tony: tonyQuestionnaire?.responses.length || 0,
      Drew: drewQuestionnaire?.responses.length || 0,
    },
    questionnaireContext: [
      buildQuestionnaireContext(tonyQuestionnaire, "Tony"),
      buildQuestionnaireContext(drewQuestionnaire, "Drew"),
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
  const partner = resolvePlayLabPartner(input.initiatedBy);

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
  const fallback = buildPlayLabDeterministicResult(input);
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
      fallback: false,
    };
  } catch {
    return {
      ...fallback,
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
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: getCorsHeaders(request, env) });
    }

    if (url.pathname === "/health" && request.method === "GET") {
      const state = await buildState(env);
      return json(
        {
          ok: true,
          service: "relateiq-cloudflare-api",
          questionnaireImported: state.questionnaireImported,
          groqConfigured: getGroqApiKeys(env).length > 0,
          groqKeysAvailable: getGroqApiKeys(env).length,
          groqModel: getGroqModel(env),
        },
        request,
        env,
      );
    }

    if (url.pathname === "/api/state" && request.method === "GET") {
      return json(await buildState(env), request, env);
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

    if ((url.pathname === "/api/coach" || url.pathname === "/coach") && request.method === "POST") {
      const body = await readJson(request);
      const speaker = body?.speaker === "Drew" ? "Drew" : "Tony";
      const topic = String(body?.topic || "");
      const goal = String(body?.goal || "");
      const aiResponse = await buildAiCoachResponse(env, speaker, topic, goal);
      return json(
        aiResponse || {
          ...buildCoachResponse({ speaker, topic, goal }),
          provider: "deterministic",
          fallback: true,
        },
        request,
        env,
      );
    }

    if ((url.pathname === "/api/check-in" || url.pathname === "/check-in") && request.method === "POST") {
      const body = await readJson(request);
      const speaker = body?.speaker === "Drew" ? "Drew" : "Tony";
      const mood = String(body?.mood || "");
      const notes = String(body?.notes || "");
      const aiResponse = await buildAiCheckInResponse(env, speaker, mood, notes);
      return json(
        aiResponse || {
          ...buildCheckInResponse({ speaker, mood, notes }),
          provider: "deterministic",
          fallback: true,
        },
        request,
        env,
      );
    }

    if ((url.pathname === "/api/repair" || url.pathname === "/repair") && request.method === "POST") {
      const body = await readJson(request);
      const speaker = body?.speaker === "Drew" ? "Drew" : "Tony";
      const issue = String(body?.issue || "");
      const desiredOutcome = String(body?.desiredOutcome || "");
      const aiResponse = await buildAiRepairResponse(env, speaker, issue, desiredOutcome);
      return json(
        aiResponse || {
          ...buildRepairResponse({ speaker, issue, desiredOutcome }),
          provider: "deterministic",
          fallback: true,
        },
        request,
        env,
      );
    }

    if ((url.pathname === "/api/insights" || url.pathname === "/insights") && request.method === "GET") {
      const state = await buildState(env);
      const insightEntries = await listEntityRecords(env, "InsightEntry");
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

      const moduleType = normalizeText(body.moduleType) as PlayLabModuleType;
      if (!PLAY_LAB_MODULE_LABELS[moduleType]) {
        return json({ error: "invalid_module_type" }, request, env, 400);
      }

      const initiatedBy = toPersonId(body.initiatedBy);
      const answeringPerson = toPersonId(body.answeringPerson, initiatedBy);
      const scope = normalizeText(body.scope) || "Tony+Drew";
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
      });

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

      const moduleType = normalizeText(body.moduleType) as PlayLabModuleType;
      if (!PLAY_LAB_MODULE_LABELS[moduleType]) {
        return json({ error: "invalid_module_type" }, request, env, 400);
      }

      const scope = normalizeText(body.scope) || "Tony+Drew";
      const initiatedBy = toPersonId(body.initiatedBy);
      const answeringPerson = toPersonId(body.answeringPerson, initiatedBy);
      const currentContextObject = isObject(body.currentContextObject) ? body.currentContextObject : null;
      const memory = await buildPlayLabMemory(env, scope);
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
      });

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

      const responseRecord = await createEntityRecord(env, "PlayLabResponse", {
        session_id: normalizeText(body.sessionId),
        user_id: normalizeText(body.userId) || toPersonId(body.userId || body.person || body.roleInSession).toString(),
        role_in_session: normalizeText(body.roleInSession) || "participant",
        response_type: normalizeText(body.responseType) || "text",
        response_value: normalizeText(body.responseValue),
        response_label: normalizeText(body.responseLabel),
        confidence: typeof body.confidence === "number" ? body.confidence : null,
        tags: Array.isArray(body.tags) ? body.tags.filter(Boolean).map((tag) => normalizeText(tag)) : [],
        metadata: isObject(body.metadata) ? body.metadata : null,
      });

      await updateEntityRecord(env, "PlayLabSession", normalizeText(body.sessionId), {
        status: "in_progress",
        last_input_at: nowIso(),
      });

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

      const sessionId = normalizeText(body.sessionId);
      const session = await getEntityRecord(env, "PlayLabSession", sessionId);
      if (!session) {
        return json({ error: "session_not_found" }, request, env, 404);
      }

      const moduleType = (normalizeText(body.moduleType) || normalizeText(session.module_type)) as PlayLabModuleType;
      if (!PLAY_LAB_MODULE_LABELS[moduleType]) {
        return json({ error: "invalid_module_type" }, request, env, 400);
      }

      const initiatedBy = toPersonId(body.initiatedBy || session.initiated_by);
      const scope = normalizeText(body.scope || session.scope) || "Tony+Drew";
      const memory = await buildPlayLabMemory(env, scope);
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
        provider: resultCore.provider,
        model: resultCore.model || null,
        key_index: resultCore.keyIndex ?? null,
      });

      const ahaRecord = await createEntityRecord(env, "AhaCard", {
        title: resultCore.ahaCard.title,
        body: resultCore.ahaCard.body,
        scope,
        source_type: moduleType,
        related_session_id: sessionId,
        inferred_tags: resultCore.inferredTags,
        saved_by_user: initiatedBy,
      });

      await createEntityRecord(env, "InsightEntry", {
        perspective: scope === "Tony+Drew" ? `${initiatedBy}→${resolvePlayLabPartner(initiatedBy)}` : scope,
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
      });

      await updateEntityRecord(env, "PlayLabSession", sessionId, {
        status: "completed",
        result_id: resultRecord.id,
        aha_card_id: ahaRecord.id,
        context_object: contextObject,
      });

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

      const scope = normalizeText(body.scope) || "Tony+Drew";
      const relatedSessionId = normalizeText(body.relatedSessionId);
      const result =
        relatedSessionId
          ? (await queryEntityCollection(env, "PlayLabResult", new URL(`${url.origin}/?q=${encodeURIComponent(JSON.stringify({ session_id: relatedSessionId }))}`)))[0]
          : sortRecords(await listEntityRecords(env, "PlayLabResult"), "-updated_date")[0];

      const resultSummary = isObject(result) ? normalizeText(result.ai_summary) : "A new pattern is becoming clearer.";
      const ahaRecord = await createEntityRecord(env, "AhaCard", {
        title: normalizeText(body.title) || "Aha unlocked",
        body: normalizeText(body.body) || resultSummary,
        scope,
        source_type: normalizeText(body.sourceType) || "play_lab",
        related_session_id: relatedSessionId || normalizeText(result?.session_id),
        inferred_tags: Array.isArray(body.inferredTags) ? body.inferredTags : result?.inferred_tags || [],
        saved_by_user: normalizeText(body.savedByUser) || "Tony",
      });

      return json({ ok: true, ahaCard: ahaRecord }, request, env, 201);
    }

    if (url.pathname === "/api/play-lab/side-quest" && request.method === "POST") {
      const body = await readJson(request);
      if (!isObject(body)) {
        return json({ error: "invalid_payload" }, request, env, 400);
      }

      const scope = normalizeText(body.scope) || "Tony";
      const userId = normalizeText(body.userId) || (scope.includes("Drew") && !scope.includes("Tony") ? "Drew" : "Tony");
      const memory = await buildPlayLabMemory(env, scope);
      const topTag =
        Array.isArray(body.focusTags) && body.focusTags.length > 0
          ? normalizeText(body.focusTags[0])
          : extractKeywordsFromText(
              ...sortRecords(await listEntityRecords(env, "PlayLabResult"), "-updated_date")
                .slice(0, 5)
                .map((item) => normalizeText(item.ai_summary)),
            )[0] || "clarity";

      const quest = await createEntityRecord(env, "SideQuest", {
        user_id: userId,
        scope,
        title: normalizeText(body.title) || `One Degree of Change: ${humanizeValue(topTag)}`,
        description:
          normalizeText(body.description) ||
          `Try one small behavior that makes ${userId === "Tony" ? "Drew" : "Tony"} feel more understood when pressure is high.`,
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
      });

      return json({ ok: true, sideQuest: quest }, request, env, 201);
    }

    if (url.pathname === "/api/play-lab/outcome" && request.method === "POST") {
      const body = await readJson(request);
      if (!isObject(body)) {
        return json({ error: "invalid_payload" }, request, env, 400);
      }

      const outcome = await createEntityRecord(env, "OutcomeLog", {
        source_type: normalizeText(body.sourceType) || "play_lab",
        related_id: normalizeText(body.relatedId),
        scope: normalizeText(body.scope) || "Tony+Drew",
        attempted: Boolean(body.attempted),
        helped: Boolean(body.helped),
        tension_change: Number(body.tensionChange || 0),
        connection_change: Number(body.connectionChange || 0),
        felt_natural: Boolean(body.feltNatural),
        notes: normalizeText(body.notes),
      });

      return json({ ok: true, outcome }, request, env, 201);
    }

    if (url.pathname === "/api/play-lab/history" && request.method === "GET") {
      const scope = normalizeText(url.searchParams.get("scope")) || "";
      const limit = Number(url.searchParams.get("limit") || 24) || 24;
      const sessions = sortRecords(await listEntityRecords(env, "PlayLabSession"), "-updated_date")
        .filter((record) => !scope || normalizeText(record.scope).includes(scope) || normalizeText(record.initiated_by) === scope)
        .slice(0, limit);
      const results = sortRecords(await listEntityRecords(env, "PlayLabResult"), "-updated_date").slice(0, limit);
      return json({ sessions, results }, request, env);
    }

    if (url.pathname === "/api/play-lab/aha-cards" && request.method === "GET") {
      const scope = normalizeText(url.searchParams.get("scope")) || "";
      const cards = sortRecords(await listEntityRecords(env, "AhaCard"), "-updated_date").filter(
        (record) => !scope || normalizeText(record.scope).includes(scope) || normalizeText(record.saved_by_user) === scope,
      );
      return json({ cards }, request, env);
    }

    if (url.pathname === "/api/play-lab/side-quests" && request.method === "GET") {
      const scope = normalizeText(url.searchParams.get("scope")) || "";
      const quests = sortRecords(await listEntityRecords(env, "SideQuest"), "-updated_date").filter(
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

      if (request.method === "GET" && !id) {
        return json(await queryEntityCollection(env, entity, url), request, env);
      }

      if (request.method === "GET" && id) {
        const record = await getEntityRecord(env, entity, id);
        return record
          ? json(record, request, env)
          : json({ error: "not_found" }, request, env, 404);
      }

      if (request.method === "POST" && !id) {
        const body = await readJson(request);
        if (!isObject(body)) return json({ error: "invalid_payload" }, request, env, 400);
        return json(await createEntityRecord(env, entity, body), request, env, 201);
      }

      if (request.method === "PUT" && id) {
        const body = await readJson(request);
        if (!isObject(body)) return json({ error: "invalid_payload" }, request, env, 400);
        const updated = await updateEntityRecord(env, entity, id, body);
        return updated
          ? json(updated, request, env)
          : json({ error: "not_found" }, request, env, 404);
      }

      if (request.method === "DELETE" && id) {
        const deleted = await deleteEntityRecord(env, entity, id);
        return deleted
          ? json({ ok: true, id }, request, env)
          : json({ error: "not_found" }, request, env, 404);
      }
    }

    return json({ error: "not_found" }, request, env, 404);
  },
};
