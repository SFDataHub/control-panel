export type CliCommandCategory =
  | "deploy"
  | "seed"
  | "git"
  | "auth"
  | "firestore"
  | "setup"
  | "misc";

export type CliCommandRepo = "main" | "control-panel" | "auth-api" | "backend" | "global";

export type CliCommandEnvironment = "local" | "test" | "beta" | "prod" | "cloud-shell";

export type CliCommandShell = "powershell" | "bash";

export type CliCommandDangerLevel = "safe" | "warning" | "dangerous";

export interface CliCommandPlaceholder {
  name: string;
  description: string;
}

export interface CliCommand {
  id: string;
  title: string;
  description: string;
  command: string;
  shell: CliCommandShell;
  category: CliCommandCategory;
  repo: CliCommandRepo;
  environment: CliCommandEnvironment;
  dangerLevel: CliCommandDangerLevel;
  placeholders: CliCommandPlaceholder[];
  notes?: string;
  updatedAt?: string;
}

export const cliCommands: CliCommand[] = [
  {
    id: "auth-api-seed-access-control-powershell",
    title: "Seed Access-Control (auth-api, PowerShell)",
    description:
      "Runs the internal /internal/seed/access-control endpoint on auth.sfdatahub.com using a one-time ACCESS_SEED_TOKEN. Use from PowerShell on your local machine.",
    command: `$ACCESS_SEED_TOKEN = "<ACCESS_SEED_TOKEN>"

Invoke-WebRequest -Uri "https://auth.sfdatahub.com/internal/seed/access-control" -Method POST -Headers @{ "ACCESS_SEED_TOKEN" = $ACCESS_SEED_TOKEN }`,
    shell: "powershell",
    category: "seed",
    repo: "auth-api",
    environment: "prod",
    dangerLevel: "warning",
    placeholders: [
      {
        name: "<ACCESS_SEED_TOKEN>",
        description:
          "One-time secret from Google Cloud Secret Manager (ACCESS_SEED_TOKEN) for seeding access-control in the auth-api.",
      },
    ],
    notes:
      "Only use with the correct ACCESS_SEED_TOKEN from GCP. Safe to re-run if needed; the seed endpoint should be idempotent but still writes config data.",
  },
  {
    id: "auth-api-seed-access-control-bash",
    title: "Seed Access-Control (auth-api, Bash)",
    description:
      "Same as the PowerShell seed command, but for Bash shells (Git Bash, WSL, or Cloud Shell). Uses curl with ACCESS_SEED_TOKEN header.",
    command: `ACCESS_SEED_TOKEN="<ACCESS_SEED_TOKEN>"

curl -X POST \\
  -H "ACCESS_SEED_TOKEN: $ACCESS_SEED_TOKEN" \\
  https://auth.sfdatahub.com/internal/seed/access-control`,
    shell: "bash",
    category: "seed",
    repo: "auth-api",
    environment: "prod",
    dangerLevel: "warning",
    placeholders: [
      {
        name: "<ACCESS_SEED_TOKEN>",
        description:
          "One-time secret from Google Cloud Secret Manager (ACCESS_SEED_TOKEN) for seeding access-control in the auth-api.",
      },
    ],
    notes:
      "Run from a Bash-compatible shell (Cloud Shell, WSL, Git Bash). Make sure the ACCESS_SEED_TOKEN is copied correctly from Secret Manager before execution.",
  },
];
