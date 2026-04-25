#!/usr/bin/env node

const API_BASE = process.env.API_BASE || "https://relate-iq-growth-api.tonyabdelmalak.workers.dev";
const LOGIN_EMAIL = process.env.LOGIN_EMAIL || "tony@relateiq.local";
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD || "tony123!";
const TARGET_RELATIONSHIP_ID = process.env.TARGET_RELATIONSHIP_ID;
const PERSON_NAME = process.env.PERSON_NAME || "Tony";
const SOURCE_RELATIONSHIP_ID = process.env.SOURCE_RELATIONSHIP_ID || "relationship_tony_drew_romantic";
const GROQ_API_KEY =
  process.env.GROQ_API_KEY_STANDALONE ||
  process.env.GROQ_API_KEY_STANDALONE_1 ||
  process.env.GROQ_API_KEY_STANDALONE_2 ||
  process.env.GROQ_API_KEY_STANDALONE_3;
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

if (!TARGET_RELATIONSHIP_ID) {
  console.error("Missing TARGET_RELATIONSHIP_ID");
  process.exit(1);
}

if (!GROQ_API_KEY) {
  console.error("Missing GROQ API key in environment.");
  process.exit(1);
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`${path} failed: ${response.status} ${JSON.stringify(data)}`);
  }
  return data;
}

async function login() {
  return request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: LOGIN_EMAIL, password: LOGIN_PASSWORD }),
  });
}

async function listQuestionnaireResponses(token, relationshipId, personName) {
  const q = encodeURIComponent(JSON.stringify({ person_name: personName }));
  return request(`/api/data/QuestionnaireResponse?q=${q}&limit=200`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Relationship-Id": relationshipId,
    },
  });
}

async function upsertQuestionnaireResponse(token, relationshipId, payload) {
  return request("/api/data/QuestionnaireResponse", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Relationship-Id": relationshipId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

function chunk(items, size) {
  const next = [];
  for (let index = 0; index < items.length; index += size) {
    next.push(items.slice(index, index + size));
  }
  return next;
}

async function rewriteBatch(relationship, targetCounterpartName, batch) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You rewrite questionnaire answers for RelateIQ. Rewrite each answer so it fits a close best-friend context instead of a romantic partner context. Preserve Tony's personality, needs, habits, boundaries, stress patterns, support preferences, and communication style. Remove romantic framing, sexual framing, couple framing, and relationship language. Reframe the answers so they sound like Tony describing a meaningful best-friend bond with the named person. Keep them natural, concise, first-person, and specific. Do not mention that you are rewriting anything. Return strict JSON with one key: rewrites, an array of objects with question_id and answer.",
        },
        {
          role: "user",
          content: JSON.stringify({
            relationship_id: relationship.id,
            relationship_name: relationship.name,
            relationship_type: relationship.type,
            speaker: PERSON_NAME,
            best_friend_name: targetCounterpartName,
            rewrites: batch.map((record) => ({
              question_id: record.question_id,
              question_text: record.question_text,
              original_answer: record.answer,
            })),
          }),
        },
      ],
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Groq rewrite failed: ${response.status} ${JSON.stringify(payload)}`);
  }

  const text = payload?.choices?.[0]?.message?.content?.trim() || "";
  const parsed = JSON.parse(text);
  return Array.isArray(parsed?.rewrites) ? parsed.rewrites : [];
}

async function main() {
  const auth = await login();
  const token = auth.token;
  const relationship = auth.relationships.find((entry) => entry.id === TARGET_RELATIONSHIP_ID);
  if (!relationship) {
    throw new Error(`Relationship ${TARGET_RELATIONSHIP_ID} not found for this user.`);
  }

  const targetCounterpartName =
    relationship.participant_names.find((name) => String(name).toLowerCase() !== PERSON_NAME.toLowerCase()) ||
    relationship.participant_names[1] ||
    "Best Friend";

  const sourceRecords = await listQuestionnaireResponses(token, SOURCE_RELATIONSHIP_ID, PERSON_NAME);
  const targetRecords = await listQuestionnaireResponses(token, TARGET_RELATIONSHIP_ID, PERSON_NAME);
  const targetByQuestionId = new Map(targetRecords.map((record) => [record.question_id, record]));

  const textRecords = sourceRecords.filter((record) => typeof record.answer === "string" && String(record.answer).trim());
  const rewrites = new Map();

  for (const batch of chunk(textRecords, 15)) {
    const batchRewrites = await rewriteBatch(relationship, targetCounterpartName, batch);
    for (const item of batchRewrites) {
      if (item?.question_id && item?.answer) {
        rewrites.set(item.question_id, item.answer);
      }
    }
  }

  let updated = 0;
  for (const sourceRecord of sourceRecords) {
    const payload = {
      ...sourceRecord,
      person_name: PERSON_NAME,
      question_id: sourceRecord.question_id,
      answer: rewrites.get(sourceRecord.question_id) || sourceRecord.answer,
    };
    await upsertQuestionnaireResponse(token, TARGET_RELATIONSHIP_ID, payload);
    updated += 1;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        relationship_id: TARGET_RELATIONSHIP_ID,
        person_name: PERSON_NAME,
        updated,
        target_counterpart: targetCounterpartName,
        target_existing_records: targetRecords.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
