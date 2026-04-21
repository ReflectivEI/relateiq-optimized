import { api } from "@/api/client";

class APIService {
  constructor() {
    this.cache = new Map();
  }

  async getProfile(personName) {
    const cacheKey = `profile_${personName}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      const profiles = await api.entities.UserProfile.filter({ person_name: personName });
      const profile = profiles[0] || null;
      this.cache.set(cacheKey, profile);
      return profile;
    } catch (error) {
      console.error("[APIService] getProfile error:", error);
      return null;
    }
  }

  async getAllProfiles() {
    const cacheKey = "profiles_all";
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      const profiles = await api.entities.UserProfile.list("-updated_date", 200);
      this.cache.set(cacheKey, profiles);
      return profiles;
    } catch (error) {
      console.error("[APIService] getAllProfiles error:", error);
      return [];
    }
  }

  async getResponses(personName) {
    const cacheKey = `responses_${personName}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      const responses = await api.entities.QuestionnaireResponse.filter({ person_name: personName });
      this.cache.set(cacheKey, responses);
      return responses;
    } catch (error) {
      console.error("[APIService] getResponses error:", error);
      return [];
    }
  }

  async getCoachSessions(limit = 20) {
    const cacheKey = `coach_sessions_${limit}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      const sessions = await api.entities.CoachSession.list("-created_date", limit);
      this.cache.set(cacheKey, sessions);
      return sessions;
    } catch (error) {
      console.error("[APIService] getCoachSessions error:", error);
      return [];
    }
  }

  async saveCoachSession(sessionData) {
    try {
      const session = await api.entities.CoachSession.create(sessionData);
      this.invalidateCache("coach_sessions_20");
      return session;
    } catch (error) {
      console.error("[APIService] saveCoachSession error:", error);
      return null;
    }
  }

  async getTriggers(personName = null) {
    const cacheKey = personName ? `triggers_${personName}` : "triggers_all";
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      const triggers = personName
        ? await api.entities.TriggerEntry.filter({ owner: personName })
        : await api.entities.TriggerEntry.list("-updated_date", 500);
      this.cache.set(cacheKey, triggers);
      return triggers;
    } catch (error) {
      console.error("[APIService] getTriggers error:", error);
      return [];
    }
  }

  async getCheckIns(limit = 14) {
    const cacheKey = `checkins_${limit}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      const checkIns = await api.entities.CheckIn.list("-created_date", limit);
      this.cache.set(cacheKey, checkIns);
      return checkIns;
    } catch (error) {
      console.error("[APIService] getCheckIns error:", error);
      return [];
    }
  }

  async getInsights(limit = 200) {
    const cacheKey = `insights_${limit}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    try {
      const insights = await api.entities.InsightEntry.list("-created_date", limit);
      this.cache.set(cacheKey, insights);
      return insights;
    } catch (error) {
      console.error("[APIService] getInsights error:", error);
      return [];
    }
  }

  invokeLLM(params) {
    return api.integrations.Core.InvokeLLM(params);
  }

  invalidateCache(key) {
    this.cache.delete(key);
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheInfo() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const apiService = new APIService();
export default apiService;
