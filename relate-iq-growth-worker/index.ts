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
