export type AuthProvider = "discord" | "google";
export type AdminRole = "admin" | "mod" | "creator" | "user";
export type AdminStatus = "active" | "suspended" | "banned";

export type ProviderDocEntry = {
  id: string;
  displayName?: string;
  avatarUrl?: string;
};

export type AdminProfile = {
  displayName?: string;
};

export interface AdminUser {
  id: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  primaryProvider: AuthProvider | null;
  providers?: Partial<Record<AuthProvider, ProviderDocEntry>>;
  profile?: AdminProfile;
  roles: AdminRole[];
  status: AdminStatus;
  createdAt: string | null;
  lastLoginAt: string | null;
  notes: string | null;
}

export type AdminUsersSummary = {
  admins: number;
  moderators: number;
  invited: number;
  suspended: number;
};

export const mockAdminUsers: AdminUser[] = [
  {
    id: "discord:1001",
    userId: "discord:1001",
    displayName: "SFDataHub Admin",
    avatarUrl: null,
    primaryProvider: "discord",
    providers: {
      discord: { id: "1001", displayName: "SFDataHub Admin" },
      google: { id: "1001-google", displayName: "SF Admin" },
    },
    roles: ["admin"],
    status: "active",
    createdAt: "2025-05-18T09:24:00.000Z",
    lastLoginAt: "2025-11-23T08:45:00.000Z",
    notes: null,
  },
  {
    id: "discord:2201",
    userId: "discord:2201",
    displayName: "Astra Vigil",
    avatarUrl: null,
    primaryProvider: "discord",
    providers: { discord: { id: "2201", displayName: "Astra Vigil" } },
    roles: ["mod"],
    status: "active",
    createdAt: "2025-06-02T12:03:00.000Z",
    lastLoginAt: "2025-11-22T18:30:00.000Z",
    notes: null,
  },
  {
    id: "google:3302",
    userId: "google:3302",
    displayName: "Lukas Stark",
    avatarUrl: null,
    primaryProvider: "google",
    providers: { google: { id: "3302", displayName: "Lukas Stark" } },
    roles: ["creator"],
    status: "active",
    createdAt: "2025-07-14T15:21:00.000Z",
    lastLoginAt: "2025-11-21T20:14:00.000Z",
    notes: null,
  },
  {
    id: "discord:4403",
    userId: "discord:4403",
    displayName: "Marin Sol",
    avatarUrl: null,
    primaryProvider: "discord",
    providers: { discord: { id: "4403", displayName: "Marin Sol" } },
    roles: ["user"],
    status: "suspended",
    createdAt: "2025-08-01T10:15:00.000Z",
    lastLoginAt: "2025-11-20T09:50:00.000Z",
    notes: "Suspended for review",
  },
  {
    id: "google:5504",
    userId: "google:5504",
    displayName: "Juno Kei",
    avatarUrl: null,
    primaryProvider: "google",
    providers: { google: { id: "5504", displayName: "Juno Kei" } },
    roles: ["mod"],
    status: "banned",
    createdAt: "2025-09-05T17:42:00.000Z",
    lastLoginAt: "2025-11-05T14:10:00.000Z",
    notes: "Banned after repeated violations",
  },
  {
    id: "discord:6605",
    userId: "discord:6605",
    displayName: "Rei Aster",
    avatarUrl: null,
    primaryProvider: "discord",
    providers: { discord: { id: "6605", displayName: "Rei Aster" } },
    roles: ["user"],
    status: "active",
    createdAt: "2025-11-15T11:00:00.000Z",
    lastLoginAt: null,
    notes: null,
  },
];

export function adminUsersSummary(users: AdminUser[]): AdminUsersSummary {
  return users.reduce(
    (acc, user) => {
      if (user.roles.includes("admin")) {
        acc.admins += 1;
      }
      if (user.roles.includes("mod")) {
        acc.moderators += 1;
      }
      if (user.status === "suspended" || user.status === "banned") {
        acc.suspended += 1;
      }
      return acc;
    },
    { admins: 0, moderators: 0, invited: 0, suspended: 0 },
  );
}
