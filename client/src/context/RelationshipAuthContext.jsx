import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/api/client";
import { queryClientInstance } from "@/lib/query-client";
import { getRelationshipLabel, getRelationshipParticipants } from "@/lib/relationshipParticipants";

const RelationshipAuthContext = createContext(null);
const HIDDEN_RELATIONSHIP_IDS = new Set(["relationship_tony_drew_friendship"]);

function sanitizeRelationships(list = []) {
  return list.filter((relationship) => !HIDDEN_RELATIONSHIP_IDS.has(relationship?.id));
}

export function RelationshipAuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [relationships, setRelationships] = useState([]);
  const [activeRelationshipId, setActiveRelationshipId] = useState(api.session.getStoredRelationshipId());
  const [error, setError] = useState("");

  const syncBootstrap = (payload) => {
    const nextRelationships = sanitizeRelationships(payload?.relationships || []);
    setUser(payload?.user || null);
    setRelationships(nextRelationships);
    const storedId = api.session.getStoredRelationshipId();
    const nextId =
      nextRelationships.some((relationship) => relationship.id === storedId)
        ? storedId
        : nextRelationships.find((relationship) => relationship.id === payload?.default_relationship_id)?.id ||
          nextRelationships[0]?.id ||
          "";
    api.session.setStoredRelationshipId(nextId);
    setActiveRelationshipId(nextId);
    setError("");
    queryClientInstance.clear();
  };

  const resetToSignedOut = () => {
    setUser(null);
    setRelationships([]);
    setActiveRelationshipId("");
    setLoading(false);
    setError("");
    api.session.clearStoredSession();
    queryClientInstance.clear();
  };

  const refresh = async () => {
    if (!api.session.getStoredAuthToken()) {
      resetToSignedOut();
      return null;
    }
    try {
      const payload = await api.auth.bootstrap();
      syncBootstrap(payload);
      return payload;
    } catch (err) {
      if (err?.status === 401) {
        resetToSignedOut();
        return null;
      }
      if (err instanceof Error && /failed to fetch/i.test(err.message)) {
        resetToSignedOut();
        return null;
      }
      throw err;
    }
  };

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      if (!api.session.getStoredAuthToken()) {
        if (!cancelled) {
          resetToSignedOut();
          setLoading(false);
        }
        return;
      }
      try {
        const payload = await api.auth.bootstrap();
        if (!cancelled) syncBootstrap(payload);
      } catch (err) {
        if (!cancelled && err?.status === 401) {
          resetToSignedOut();
        } else if (!cancelled && err instanceof Error && /failed to fetch/i.test(err.message)) {
          resetToSignedOut();
        } else if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load relationship context.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (input) => {
    setLoading(true);
    try {
      const payload = await api.auth.login(input);
      syncBootstrap(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (input) => {
    setLoading(true);
    try {
      const payload = await api.auth.register(input);
      syncBootstrap(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
    setRelationships([]);
    setActiveRelationshipId("");
    setError("");
    queryClientInstance.clear();
  };

  const selectRelationship = (relationshipId) => {
    api.session.setStoredRelationshipId(relationshipId);
    setActiveRelationshipId(relationshipId);
    queryClientInstance.clear();
  };

  const updateRelationships = (nextRelationships, defaultRelationshipId) => {
    const sanitizedRelationships = sanitizeRelationships(nextRelationships);
    setRelationships(sanitizedRelationships);
    const nextId =
      defaultRelationshipId && sanitizedRelationships.some((relationship) => relationship.id === defaultRelationshipId)
        ? defaultRelationshipId
        : sanitizedRelationships.some((relationship) => relationship.id === activeRelationshipId)
          ? activeRelationshipId
          : sanitizedRelationships[0]?.id || "";
    api.session.setStoredRelationshipId(nextId);
    setActiveRelationshipId(nextId);
    queryClientInstance.clear();
  };

  const value = useMemo(() => {
    const activeRelationship =
      relationships.find((relationship) => relationship.id === activeRelationshipId) || null;
    const participants = getRelationshipParticipants(activeRelationship, user?.name);
    const relationshipLabel = getRelationshipLabel(activeRelationship, participants);

    return {
      loading,
      user,
      relationships,
      activeRelationshipId,
      activeRelationship,
      participants,
      primaryPerson: participants[0],
      secondaryPerson: participants[1],
      relationshipLabel,
      error,
      login,
      register,
      logout,
      refresh,
      selectRelationship,
      updateRelationships,
    };
  }, [loading, user, relationships, activeRelationshipId, error]);

  return (
    <RelationshipAuthContext.Provider value={value}>
      {children}
    </RelationshipAuthContext.Provider>
  );
}

export function useRelationshipAuth() {
  const context = useContext(RelationshipAuthContext);
  if (!context) {
    throw new Error("useRelationshipAuth must be used within RelationshipAuthProvider");
  }
  return context;
}
