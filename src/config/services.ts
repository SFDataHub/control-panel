export type ServiceKind = "api" | "db" | "analytics";

export type Service = {
  id: string;
  name: string;
  kind: ServiceKind;
  description: string;
  url?: string;
  docsUrl?: string;
};

export const coreServices: Service[] = [
  {
    id: "auth-api",
    name: "Auth API",
    kind: "api",
    description:
      "Handles login via Discord/Google and issues JWTs so SFDataHub can gate session information.",
    url: "https://authapi-57ravjntpa-ew.a.run.app",
  },
  {
    id: "scan-import-api",
    name: "Scan Import API",
    kind: "api",
    description: "Accepts HAR/CSV uploads from the UI and writes parsed scan data into Firestore.",
  },
  {
    id: "firestore",
    name: "Firestore Database",
    kind: "db",
    description: "Primary database for player, guild and scan data (project `sfdatahub-staging`).",
    url: "https://console.firebase.google.com/project/sfdatahub-staging/firestore/data",
  },
  {
    id: "goatcounter",
    name: "GoatCounter Analytics",
    kind: "analytics",
    description: "Privacy-friendly traffic stats for SFDataHub (page views, referrers, etc.).",
    url: "https://example.goatcounter.com/sfdatahub",
  },
];
