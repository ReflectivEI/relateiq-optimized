import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function serialize(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function useAutosave({
  value,
  saveValue,
  canSave = true,
  enabled = true,
  debounceMs = 1200,
  onSaved,
}) {
  const saveRef = useRef(saveValue);
  const lastSavedRef = useRef(serialize(value));
  const [status, setStatus] = useState("idle");
  const [lastError, setLastError] = useState(null);
  const serializedValue = useMemo(() => serialize(value), [value]);

  useEffect(() => {
    saveRef.current = saveValue;
  }, [saveValue]);

  const markClean = useCallback((nextSavedValue) => {
    lastSavedRef.current = serialize(nextSavedValue);
    setStatus("saved");
    setLastError(null);
  }, []);

  const saveNow = useCallback(async () => {
    if (!enabled || !canSave) return false;
    if (serializedValue === lastSavedRef.current) {
      setStatus("saved");
      return true;
    }

    setStatus("saving");
    setLastError(null);
    try {
      await saveRef.current(value);
      lastSavedRef.current = serializedValue;
      setStatus("saved");
      onSaved?.(value);
      return true;
    } catch (error) {
      setStatus("error");
      setLastError(error);
      return false;
    }
  }, [canSave, enabled, onSaved, serializedValue, value]);

  useEffect(() => {
    if (!enabled) return;
    if (serializedValue === lastSavedRef.current) {
      if (status === "idle") setStatus("saved");
      return;
    }

    setStatus("dirty");
    if (!canSave) return;

    const timeoutId = window.setTimeout(() => {
      void saveNow();
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [canSave, debounceMs, enabled, saveNow, serializedValue, status]);

  return {
    status,
    saveNow,
    markClean,
    lastError,
    isSaving: status === "saving",
    hasPendingChanges: serializedValue !== lastSavedRef.current,
  };
}

export default useAutosave;