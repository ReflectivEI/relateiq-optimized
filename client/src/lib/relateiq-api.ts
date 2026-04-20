import { apiRequest } from "@/lib/queryClient";
import type { AppState } from "@shared/relateiq";
import type { QuestionnaireResponse } from "@/lib/relateiq-analysis";

export async function fetchRelateIQState(): Promise<AppState> {
  const response = await apiRequest("GET", "/api/state");
  return response.json();
}

export async function postCoach(input: {
  speaker: "Tony" | "Drew";
  topic: string;
  goal: string;
}) {
  const response = await apiRequest("POST", "/api/coach", input);
  return response.json();
}

export async function postRepair(input: {
  speaker: "Tony" | "Drew";
  issue: string;
  desiredOutcome: string;
}) {
  const response = await apiRequest("POST", "/api/repair", input);
  return response.json();
}

export async function postCheckIn(input: {
  speaker: "Tony" | "Drew";
  mood: string;
  notes: string;
}) {
  const response = await apiRequest("POST", "/api/check-in", input);
  return response.json();
}

export async function uploadQuestionnaire(input: {
  person: "Tony" | "Drew";
  fileName: string;
  raw: Record<string, unknown> | Array<Record<string, unknown>>;
}) {
  const response = await apiRequest("POST", "/api/questionnaire/upload", input);
  return response.json();
}

export async function fetchQuestionnaire(person: "Tony" | "Drew"): Promise<{
  person: "Tony" | "Drew";
  fileName?: string;
  uploadedAt?: string;
  responses: QuestionnaireResponse[];
}> {
  const response = await apiRequest("GET", `/api/questionnaire/${person}`);
  return response.json();
}
