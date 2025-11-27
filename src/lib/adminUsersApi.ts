import type {
  AdminRole,
  AdminStatus,
  AdminUser,
  AuthProvider,
  ProviderDocEntry,
} from "../config/adminUsers";

const BASE_URL = (import.meta.env.VITE_AUTH_BASE_URL ?? "").replace(/\/+$/, "");
const ADMIN_USERS_PATH = "/admin/users";
const ROLE_PRIORITY: AdminRole[] = ["user", "moderator", "developer", "admin"];
const BACKEND_ROLE_PRIORITY = ["user", "mod", "creator", "admin"] as const;
type BackendAdminRole = (typeof BACKEND_ROLE_PRIORITY)[number];

const ROLE_ALIASES: Record<string, AdminRole> = {
  admin: "admin",
  owner: "admin",
  moderator: "moderator",
  mod: "moderator",
  developer: "developer",
  dev: "developer",
  creator: "developer",
  user: "user",
};

const toBackendRole = (role: AdminRole): BackendAdminRole => {
  switch (role) {
    case "admin":
    case "owner":
      return "admin";
    case "moderator":
    case "mod":
      return "mod";
    case "developer":
    case "creator":
      return "creator";
    default:
      return "user";
  }
};

const STATUS_VALUES: AdminStatus[] = ["active", "suspended", "banned"];
const PROVIDERS: AuthProvider[] = ["discord", "google"];

const sortRoles = (roles: AdminRole[]): AdminRole[] => {
  const orderIndex = (role: AdminRole) => {
    const idx = ROLE_PRIORITY.indexOf(role);
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  };
  return [...roles].sort((a, b) => orderIndex(a) - orderIndex(b));
};

const isAuthProvider = (value: unknown): value is AuthProvider =>
  typeof value === "string" && PROVIDERS.includes(value as AuthProvider);

const normalizeTimestamp = (value: unknown): string | null => {
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
};

const normalizeRoles = (roles: unknown): AdminRole[] => {
  if (!Array.isArray(roles)) {
    return ["user"];
  }
  const normalized = roles
    .map((role) => ROLE_ALIASES[String(role).toLowerCase()])
    .filter((role): role is AdminRole => Boolean(role));
  const unique = Array.from(new Set(normalized));
  return unique.length ? sortRoles(unique) : ["user"];
};

const normalizeStatus = (status: unknown): AdminStatus => {
  if (typeof status === "string" && STATUS_VALUES.includes(status as AdminStatus)) {
    return status as AdminStatus;
  }
  return "active";
};

const normalizeProviders = (
  providers: unknown,
): Partial<Record<AuthProvider, ProviderDocEntry>> | undefined => {
  if (!providers || typeof providers !== "object") {
    return undefined;
  }
  const entries: Partial<Record<AuthProvider, ProviderDocEntry>> = {};
  Object.entries(providers as Record<string, ProviderDocEntry>).forEach(([key, value]) => {
    if (!isAuthProvider(key)) return;
    if (!value || typeof value !== "object") return;
    entries[key] = {
      id: String((value as ProviderDocEntry).id ?? ""),
      displayName:
        typeof (value as ProviderDocEntry).displayName === "string"
          ? (value as ProviderDocEntry).displayName
          : undefined,
      avatarUrl:
        typeof (value as ProviderDocEntry).avatarUrl === "string"
          ? (value as ProviderDocEntry).avatarUrl
          : undefined,
    };
  });
  return Object.keys(entries).length ? entries : undefined;
};

export const normalizeAdminUser = (raw: unknown): AdminUser => {
  const user = (raw ?? {}) as Partial<AdminUser> & Record<string, unknown>;
  const id = typeof user.id === "string" && user.id.length ? user.id : "unknown-user";
  const userId =
    typeof user.userId === "string" && user.userId.length ? user.userId : id ?? "unknown-user";
  const flags = Array.isArray((user as any).flags)
    ? ((user as any).flags as string[]).map((flag) => String(flag))
    : undefined;

  return {
    id,
    userId,
    displayName:
      typeof user.displayName === "string" && user.displayName.length
        ? user.displayName
        : (user.profile as any)?.displayName ?? null,
    avatarUrl: typeof user.avatarUrl === "string" ? user.avatarUrl : null,
    primaryProvider: isAuthProvider(user.primaryProvider) ? user.primaryProvider : null,
    providers: normalizeProviders(user.providers),
    profile: user.profile,
    roles: normalizeRoles(user.roles),
    status: normalizeStatus(user.status),
    createdAt: normalizeTimestamp(user.createdAt),
    lastLoginAt: normalizeTimestamp(user.lastLoginAt),
    notes: typeof user.notes === "string" ? user.notes : null,
    flags,
    isSystem:
      (user as any).isSystem === true ||
      (user as any).system === true ||
      (flags ?? []).includes("system"),
  };
};

const handleResponse = async (response: Response) => {
  if (response.ok) {
    if (response.status === 204) {
      return {};
    }
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  try {
    const body = await response.json();
    const detail = (body as any)?.error ?? (body as any)?.message ?? response.statusText;
    throw new Error(detail || `Failed with status ${response.status}.`);
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(response.statusText || "Request failed.");
  }
};

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  if (!BASE_URL) {
    throw new Error("Auth API base URL is missing (VITE_AUTH_BASE_URL).");
  }

  const response = await fetch(`${BASE_URL}${ADMIN_USERS_PATH}`, {
    method: "GET",
    credentials: "include",
  });

  const data = await handleResponse(response);
  const incoming = Array.isArray((data as any)?.users) ? (data as any).users : [];
  return incoming.map(normalizeAdminUser);
}

export async function updateUserRoles(userId: string, roles: AdminRole[]): Promise<AdminUser> {
  if (!BASE_URL) {
    throw new Error("Auth API base URL is missing (VITE_AUTH_BASE_URL).");
  }
  if (!userId) {
    throw new Error("User id is required to update roles.");
  }

  const payloadRoles = Array.from(
    new Set(roles.map(toBackendRole).filter((role): role is BackendAdminRole => Boolean(role))),
  );
  if (!payloadRoles.length) {
    payloadRoles.push("user");
  }

  const url = `${BASE_URL}${ADMIN_USERS_PATH}/${encodeURIComponent(userId)}/roles`;
  const response = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ roles: payloadRoles }),
  });

  const data = await handleResponse(response);
  const payload = (data as any)?.user ?? data;
  return normalizeAdminUser(payload);
}

export const roleOrder = ROLE_PRIORITY;
