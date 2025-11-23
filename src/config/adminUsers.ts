export type AuthProvider = "discord" | "google" | "github" | "other";
export type AdminRole = "owner" | "admin" | "moderator" | "viewer";
export type AdminStatus = "active" | "suspended" | "invited";

export interface AdminUser {
  id: string;
  displayName: string;
  providers: AuthProvider[];
  roles: AdminRole[];
  status: AdminStatus;
  createdAt: string;
  lastLoginAt?: string;
}

export type AdminUsersSummary = {
  admins: number;
  moderators: number;
  invited: number;
  suspended: number;
};

export const mockAdminUsers: AdminUser[] = [
  {
    id: "user-owner-001",
    displayName: "SFDataHub Owner",
    providers: ["discord", "google"],
    roles: ["owner", "admin"],
    status: "active",
    createdAt: "2025-05-18T09:24:00.000Z",
    lastLoginAt: "2025-11-23T08:45:00.000Z",
  },
  {
    id: "user-admin-201",
    displayName: "Astra Vigil",
    providers: ["discord"],
    roles: ["admin"],
    status: "active",
    createdAt: "2025-06-02T12:03:00.000Z",
    lastLoginAt: "2025-11-22T18:30:00.000Z",
  },
  {
    id: "user-admin-202",
    displayName: "Lukas Stark",
    providers: ["google", "github"],
    roles: ["admin"],
    status: "active",
    createdAt: "2025-07-14T15:21:00.000Z",
    lastLoginAt: "2025-11-21T20:14:00.000Z",
  },
  {
    id: "user-mod-301",
    displayName: "Marin Sol",
    providers: ["discord"],
    roles: ["moderator"],
    status: "active",
    createdAt: "2025-08-01T10:15:00.000Z",
    lastLoginAt: "2025-11-20T09:50:00.000Z",
  },
  {
    id: "user-mod-302",
    displayName: "Juno Kei",
    providers: ["google"],
    roles: ["moderator"],
    status: "suspended",
    createdAt: "2025-09-05T17:42:00.000Z",
    lastLoginAt: "2025-11-05T14:10:00.000Z",
  },
  {
    id: "user-mod-303",
    displayName: "Rei Aster",
    providers: ["discord", "github"],
    roles: ["moderator"],
    status: "invited",
    createdAt: "2025-11-15T11:00:00.000Z",
  },
  {
    id: "user-view-401",
    displayName: "Tess Rowan",
    providers: ["google"],
    roles: ["viewer"],
    status: "active",
    createdAt: "2025-07-28T08:18:00.000Z",
    lastLoginAt: "2025-11-19T07:45:00.000Z",
  },
  {
    id: "user-view-402",
    displayName: "Nico Vale",
    providers: ["discord"],
    roles: ["viewer"],
    status: "invited",
    createdAt: "2025-11-10T13:05:00.000Z",
  },
];

export function adminUsersSummary(users: AdminUser[]): AdminUsersSummary {
  return users.reduce(
    (acc, user) => {
      if (user.roles.includes("owner") || user.roles.includes("admin")) {
        acc.admins += 1;
      }
      if (user.roles.includes("moderator")) {
        acc.moderators += 1;
      }
      if (user.status === "invited") {
        acc.invited += 1;
      }
      if (user.status === "suspended") {
        acc.suspended += 1;
      }
      return acc;
    },
    { admins: 0, moderators: 0, invited: 0, suspended: 0 },
  );
}
