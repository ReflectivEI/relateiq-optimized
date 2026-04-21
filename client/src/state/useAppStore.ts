import { useSyncExternalStore } from "react";

type PersonName = "Tony" | "Drew";

type AppStoreState = {
  profiles: Record<string, unknown>[];
  questionnaireData: Record<PersonName, Record<string, unknown>[]>;
  analysisOutputs: Record<string, unknown>;
  coachSessions: Record<string, unknown>[];
  insights: Record<string, unknown>[];
  relationshipIntelligence: Record<string, unknown> | null;
};

type Listener = () => void;

const listeners = new Set<Listener>();

let state: AppStoreState = {
  profiles: [],
  questionnaireData: {
    Tony: [],
    Drew: [],
  },
  analysisOutputs: {},
  coachSessions: [],
  insights: [],
  relationshipIntelligence: null,
};

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function updateState(partial: Partial<AppStoreState>) {
  state = {
    ...state,
    ...partial,
  };
  emit();
}

function setQuestionnaireData(person: PersonName, responses: Record<string, unknown>[]) {
  state = {
    ...state,
    questionnaireData: {
      ...state.questionnaireData,
      [person]: responses,
    },
  };
  emit();
}

export function useAppStore<T>(selector: (snapshot: AppStoreState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(getSnapshot()), () => selector(getSnapshot()));
}

export const appStore = {
  getState: getSnapshot,
  subscribe,
  setProfiles(profiles: Record<string, unknown>[]) {
    updateState({ profiles });
  },
  setQuestionnaireData,
  setAnalysisOutputs(analysisOutputs: Record<string, unknown>) {
    updateState({ analysisOutputs });
  },
  setCoachSessions(coachSessions: Record<string, unknown>[]) {
    updateState({ coachSessions });
  },
  setInsights(insights: Record<string, unknown>[]) {
    updateState({ insights });
  },
  setRelationshipIntelligence(relationshipIntelligence: Record<string, unknown> | null) {
    updateState({ relationshipIntelligence });
  },
  reset() {
    state = {
      profiles: [],
      questionnaireData: { Tony: [], Drew: [] },
      analysisOutputs: {},
      coachSessions: [],
      insights: [],
      relationshipIntelligence: null,
    };
    emit();
  },
};

export type { AppStoreState, PersonName };
