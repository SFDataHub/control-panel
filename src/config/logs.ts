import type { Service } from "./services";

export type LogLevel = "error" | "warning" | "info";
export type LogServiceId = Service["id"] | "other";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  service: LogServiceId;
  message: string;
  details?: string;
  context?: Record<string, unknown>;
}

export const mockLogs: LogEntry[] = [
  {
    id: "log-001",
    timestamp: "2025-11-23T10:58:00.000Z",
    level: "error",
    service: "auth-api",
    message: "Failed to refresh JWT for user 'demo-admin'; stale refresh token detected.",
    details: "Refresh token invalidated by Auth API (tokenHash mismatch).",
    context: { userId: "demo-admin", retryCount: 3 },
  },
  {
    id: "log-002",
    timestamp: "2025-11-23T10:45:12.000Z",
    level: "warning",
    service: "scan-import-api",
    message: "CSV upload completed with partial successes (3 rows skipped).",
    details: "Row 14/23: missing 'class' field, defaulted to 'Unknown'.",
    context: { rows: 23, skipped: 3, durationMs: 1283 },
  },
  {
    id: "log-003",
    timestamp: "2025-11-23T08:10:45.000Z",
    level: "info",
    service: "firestore",
    message: "Realtime listener delivered 1,124 document updates over 15 minutes.",
  },
  {
    id: "log-004",
    timestamp: "2025-11-22T21:03:30.000Z",
    level: "warning",
    service: "firestore",
    message: "Firestore write retries observed for collection 'scans'.",
    details: "Exceeded 3 retries before succeeding; network latency spikes on europe-west3 region.",
  },
  {
    id: "log-005",
    timestamp: "2025-11-22T18:45:00.000Z",
    level: "info",
    service: "goatcounter",
    message: "GoatCounter reported 18 new referrers from reddit.com/r/SFDataHub.",
  },
  {
    id: "log-006",
    timestamp: "2025-11-22T17:12:09.000Z",
    level: "error",
    service: "scan-import-api",
    message: "Scan import timed out while waiting for external asset fetch.",
    details: "HTTP 504 from `player-assets.sfdatahub.com` after 31s.",
    context: { requestId: "s-import-8774", url: "https://player-assets.sfdatahub.com/har/..." },
  },
  {
    id: "log-007",
    timestamp: "2025-11-22T16:22:46.000Z",
    level: "info",
    service: "other",
    message: "Daily backup of Firestore (sfdatahub-staging) completed in 12m 8s.",
  },
];
