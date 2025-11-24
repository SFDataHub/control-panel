export type ServiceKind = "api" | "db" | "analytics" | "worker" | "other";
export type ServiceStatus = "ok" | "degraded" | "down" | "unknown";
export type ServiceId = "auth-api" | "scan-import-api" | "firestore" | "goatcounter" | "other";

export type ServiceHealthCheck =
  | {
      type: "http";
      url: string;
      timeoutMs?: number;
    }
  | {
      type: "firestore";
      firestoreCollection: string;
      firestoreDocument?: string;
      timeoutMs?: number;
    };

export type Service = {
  id: ServiceId;
  name: string;
  kind: ServiceKind;
  description: string;
  status?: ServiceStatus;
  url?: string;
  docsUrl?: string;
  owner?: string;
  healthCheck?: ServiceHealthCheck;
};

export const coreServices: Service[] = [
  {
    id: "auth-api",
    name: "Auth API",
    kind: "api",
    description:
      "Handles login via Discord/Google and issues JWTs so SFDataHub can gate session information.",
    url: "https://auth.sfdatahub.com",
    status: "ok",
    docsUrl: "",
    owner: "Backend",
    healthCheck: {
      type: "http",
      url: "https://auth.sfdatahub.com/health",
      timeoutMs: 5000,
    },
  },
  {
    id: "scan-import-api",
    name: "Scan Import API",
    kind: "api",
    description: "Accepts HAR/CSV uploads from the UI and writes parsed scan data into Firestore.",
    status: "unknown",
    docsUrl: "",
    owner: "Backend",
  },
  {
    id: "firestore",
    name: "Firestore Database",
    kind: "db",
    description: "Primary database for player, guild and scan data (project `sfdatahub-staging`).",
    url: "https://console.firebase.google.com/project/sfdatahub-staging/firestore/data",
    status: "ok",
    docsUrl: "",
    owner: "Infra",
    healthCheck: {
      type: "firestore",
      firestoreCollection: "stats_public",
      firestoreDocument: "toplists_bundle_v1",
      timeoutMs: 5000,
    },
  },
  {
    id: "goatcounter",
    name: "GoatCounter Analytics",
    kind: "analytics",
    description: "Privacy-friendly traffic stats for SFDataHub (page views, referrers, etc.).",
    url: "https://example.goatcounter.com/sfdatahub",
    status: "ok",
    docsUrl: "",
    owner: "Analytics",
  },
];
