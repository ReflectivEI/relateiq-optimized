import { useCallback, useEffect, useMemo, useState } from "react";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function isMeaningful(value) {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") {
    return Object.values(value).some((entry) => isMeaningful(entry));
  }
  return value !== null && value !== undefined && value !== false;
}

function readStoredValue(draftKey, fallbackValue) {
  if (!draftKey || !canUseStorage()) return fallbackValue;
  try {
    const raw = window.localStorage.getItem(draftKey);
    if (!raw) return fallbackValue;
    return JSON.parse(raw);
  } catch {
    return fallbackValue;
  }
}

function writeStoredValue(draftKey, value) {
  if (!draftKey || !canUseStorage()) return;
  try {
    if (isMeaningful(value)) {
      window.localStorage.setItem(draftKey, JSON.stringify(value));
    } else {
      window.localStorage.removeItem(draftKey);
    }
  } catch {
    // Ignore storage failures so editing never breaks.
  }
}

export function useLocalDraft(draftKey, initialValue) {
  const [value, setValue] = useState(() => readStoredValue(draftKey, initialValue));

  useEffect(() => {
    setValue(readStoredValue(draftKey, initialValue));
  }, [draftKey]);

  useEffect(() => {
    writeStoredValue(draftKey, value);
  }, [draftKey, value]);

  const resetFromSource = useCallback(
    (nextValue) => {
      setValue(nextValue);
      if (draftKey && canUseStorage()) {
        window.localStorage.removeItem(draftKey);
      }
    },
    [draftKey],
  );

  const clearDraft = useCallback(() => {
    if (draftKey && canUseStorage()) {
      window.localStorage.removeItem(draftKey);
    }
  }, [draftKey]);

  const hasDraft = useMemo(() => isMeaningful(value), [value]);

  return {
    value,
    setValue,
    resetFromSource,
    clearDraft,
    hasDraft,
  };
}

export default useLocalDraft;