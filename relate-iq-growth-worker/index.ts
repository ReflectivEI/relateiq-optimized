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
};

function getCorsHeaders(request: Request, env: Env) {
  const origin = request.headers.get("origin") || "*";
  const configured = (env.CORS_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowOrigin =
    configured.length === 0 || configured.includes(origin) ? origin : configured[0] || "*";

  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "GET,POST,OPTIONS",
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

async function loadUploadedQuestionnaire(
  env: Env,
  person: PersonId,
): Promise<UploadedQuestionnaire | null> {
  if (!env.QUESTIONNAIRES) return null;
  const value = await env.QUESTIONNAIRES.get(`questionnaire:${person}`, "json");
  return (value as UploadedQuestionnaire | null) || null;
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
        },
        request,
        env,
      );
    }

    if (url.pathname === "/api/state" && request.method === "GET") {
      return json(await buildState(env), request, env);
    }

    if (url.pathname.startsWith("/api/questionnaire/") && request.method === "GET") {
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

    if (url.pathname === "/api/coach" && request.method === "POST") {
      const body = await readJson(request);
      return json(
        buildCoachResponse({
          speaker: body?.speaker === "Drew" ? "Drew" : "Tony",
          topic: String(body?.topic || ""),
          goal: String(body?.goal || ""),
        }),
        request,
        env,
      );
    }

    if (url.pathname === "/api/check-in" && request.method === "POST") {
      const body = await readJson(request);
      return json(
        buildCheckInResponse({
          speaker: body?.speaker === "Drew" ? "Drew" : "Tony",
          mood: String(body?.mood || ""),
          notes: String(body?.notes || ""),
        }),
        request,
        env,
      );
    }

    if (url.pathname === "/api/repair" && request.method === "POST") {
      const body = await readJson(request);
      return json(
        buildRepairResponse({
          speaker: body?.speaker === "Drew" ? "Drew" : "Tony",
          issue: String(body?.issue || ""),
          desiredOutcome: String(body?.desiredOutcome || ""),
        }),
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
        uploadedAt: new Date().toISOString(),
        responses,
        raw,
      };

      await env.QUESTIONNAIRES.put(`questionnaire:${person}`, JSON.stringify(payload));

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

    return json({ error: "not_found" }, request, env, 404);
  },
};
