import type { LogEntry } from "../config/logs";

const AUTH_API_BASE_URL = (import.meta.env.VITE_AUTH_BASE_URL ?? "").replace(/\/+$/, "");
const ADMIN_LOGS_PATH = "/admin/logs";
const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

const ensureBaseUrl = (): string => {
  if (!AUTH_API_BASE_URL) {
    throw new Error("Auth API base URL is missing (VITE_AUTH_BASE_URL).");
  }
  return AUTH_API_BASE_URL;
};

const normalizeLimit = (value?: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(MAX_LIMIT, Math.max(1, Math.round(value)));
  }
  return DEFAULT_LIMIT;
};

export interface FetchAdminLogsParams {
  limit?: number;
  cursor?: string | null;
}

export interface FetchAdminLogsResult {
  items: LogEntry[];
  nextCursor: string | null;
}

type AdminLogsResponse = {
  ok?: boolean;
  items?: LogEntry[];
  nextCursor?: string | null;
  error?: string;
  message?: string;
};

export async function fetchAdminLogs(
  params?: FetchAdminLogsParams,
): Promise<FetchAdminLogsResult> {
  const baseUrl = ensureBaseUrl();
  const limit = normalizeLimit(params?.limit);
  const url = new URL(`${baseUrl}${ADMIN_LOGS_PATH}`);
  url.searchParams.set("limit", String(limit));
  if (typeof params?.cursor === "string" && params.cursor.length) {
    url.searchParams.set("cursor", params.cursor);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  let payload: AdminLogsResponse = {};
  try {
    payload = (await response.json()) as AdminLogsResponse;
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const detail = payload.error ?? payload.message ?? response.statusText;
    throw new Error(detail || `Request failed (${response.status}).`);
  }

  if (payload.ok !== true || !Array.isArray(payload.items)) {
    const detail = payload.error ?? "Failed to load logs.";
    throw new Error(detail);
  }

  const nextCursor =
    typeof payload.nextCursor === "string" ? payload.nextCursor : null;

  return {
    items: payload.items,
    nextCursor,
  };
}
