const STORAGE_KEY = "reflectivai:ei-metrics:enabled";
export const EI_METRICS_SETTINGS_EVENT = "reflectivai:ei-metrics:changed";

export function readEnabledEIMetricIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((x) => String(x)).filter(Boolean);
  } catch {
    return [];
  }
}

export function writeEnabledEIMetricIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  const normalized = Array.from(new Set(ids.map((x) => String(x)).filter(Boolean)));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event(EI_METRICS_SETTINGS_EVENT));
}
