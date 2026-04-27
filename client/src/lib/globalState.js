/**
 * globalState.js — Centralized Data Store
 * Single source of truth for all user data, patterns, and session state.
 * Prevents duplicate data sources and ensures consistency.
 */

class GlobalStateStore {
  constructor() {
    this.state = {
      // User profiles
      tony: null,
      drew: null,

      // Questionnaire responses
      tonyResponses: [],
      drewResponses: [],

      // Pattern analysis
      tonyPatterns: null,
      drewPatterns: null,
      relationshipDynamics: null,

      // Predictive outputs
      riskSummary: null,
      predictions: {},

      // AI Coach sessions
      coachSessions: [],
      currentCoachSession: null,

      // Insights history
      insights: [],
      selectedInsight: null,

      // Triggers
      triggers: [],

      // Check-ins
      checkIns: [],

      // Session metadata
      lastUpdated: null,
      isLoading: false,
      error: null,

      // Generic per-relationship continuous memory
      relationshipMemory: {},
    };

    this.listeners = [];
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Notify all listeners of state change
   */
  notify() {
    this.listeners.forEach((cb) => cb(this.state));
  }

  /**
   * Update state with validity check
   */
  setState(updates) {
    if (typeof updates !== "object") {
      throw new Error("setState expects object");
    }
    this.state = { ...this.state, ...updates };
    this.state.lastUpdated = new Date().toISOString();
    this.notify();
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Update profile data
   */
  setProfile(person, profileData) {
    if (person === "Tony") this.state.tony = profileData;
    else if (person === "Drew") this.state.drew = profileData;
    this.notify();
  }

  /**
   * Update questionnaire responses
   */
  setResponses(person, responses) {
    if (person === "Tony") this.state.tonyResponses = responses;
    else if (person === "Drew") this.state.drewResponses = responses;
    this.notify();
  }

  /**
   * Update pattern analysis
   */
  setPatterns(person, patterns) {
    if (person === "Tony") this.state.tonyPatterns = patterns;
    else if (person === "Drew") this.state.drewPatterns = patterns;
    this.notify();
  }

  /**
   * Update risk summary
   */
  setRiskSummary(summary) {
    this.state.riskSummary = summary;
    this.notify();
  }

  /**
   * Update coach session
   */
  addCoachSession(session) {
    this.state.coachSessions = [session, ...this.state.coachSessions].slice(0, 50);
    this.state.currentCoachSession = session;
    this.notify();
  }

  /**
   * Add insight to history
   */
  addInsight(insight) {
    this.state.insights = [insight, ...this.state.insights].slice(0, 200);
    this.notify();
  }

  /**
   * Update all trigger data
   */
  setTriggers(triggers) {
    this.state.triggers = triggers;
    this.notify();
  }

  /**
   * Set loading state
   */
  setLoading(loading) {
    this.state.isLoading = loading;
    this.notify();
  }

  /**
   * Set error state
   */
  setError(error) {
    this.state.error = error;
    this.notify();
  }

  /**
   * Merge generic continuous memory for any relationship pairing.
   */
  mergeRelationshipMemory(relationshipId, updates) {
    if (!relationshipId) return;
    const current = this.state.relationshipMemory[relationshipId] || {
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
    this.state.relationshipMemory = {
      ...this.state.relationshipMemory,
      [relationshipId]: {
        ...current,
        ...updates,
        lastUpdated: new Date().toISOString(),
      },
    };
    this.notify();
  }

  /**
   * Clear error
   */
  clearError() {
    this.state.error = null;
    this.notify();
  }

  /**
   * Reset entire state
   */
  reset() {
    this.state = {
      tony: null,
      drew: null,
      tonyResponses: [],
      drewResponses: [],
      tonyPatterns: null,
      drewPatterns: null,
      relationshipDynamics: null,
      riskSummary: null,
      predictions: {},
      coachSessions: [],
      currentCoachSession: null,
      insights: [],
      selectedInsight: null,
      triggers: [],
      checkIns: [],
      lastUpdated: null,
      isLoading: false,
      error: null,
      relationshipMemory: {},
    };
    this.notify();
  }
}

// Singleton instance
export const globalState = new GlobalStateStore();

export default globalState;