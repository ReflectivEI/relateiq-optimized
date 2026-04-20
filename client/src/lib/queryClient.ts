import { QueryClient, QueryFunction } from "@tanstack/react-query";

const RUNTIME_BASE =
  typeof window !== "undefined" && (window as { WORKER_URL?: string }).WORKER_URL
    ? (window as { WORKER_URL?: string }).WORKER_URL
    : undefined;

const API_BASE_URL = RUNTIME_BASE || import.meta.env.VITE_WORKER_URL || import.meta.env.VITE_API_BASE_URL || undefined;

function buildUrl(path: string): string {
  if (!API_BASE_URL) return path;
  const base = API_BASE_URL.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

async function throwIfResNotOk(response: Response) {
  if (response.ok) return;
  const text = (await response.text()) || response.statusText;
  throw new Error(`${response.status}: ${text}`);
}

export async function apiRequest(method: string, path: string, data?: unknown) {
  const response = await fetch(buildUrl(path), {
    method,
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(response);
  return response;
}

export const getQueryFn: <T>(options: { on401: "returnNull" | "throw" }) => QueryFunction<T> =
  ({ on401 }) =>
    async ({ queryKey }) => {
      const path = queryKey.join("/") as string;
      const response = await fetch(buildUrl(path));

      if (on401 === "returnNull" && response.status === 401) {
        return null;
      }

      await throwIfResNotOk(response);
      return response.json();
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60,
    },
    mutations: {
      retry: false,
    },
  },
});
