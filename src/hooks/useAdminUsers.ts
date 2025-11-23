import { useCallback, useEffect, useState } from "react";

import type {
  AdminRole,
  AdminStatus,
  AdminUser,
  AuthProvider,
  ProviderDocEntry,
} from "../config/adminUsers";

const ADMIN_USERS_PATH = "/admin/users";
const ALLOWED_ROLES: AdminRole[] = ["admin", "mod", "creator", "user"];
const ALLOWED_STATUSES: AdminStatus[] = ["active", "suspended", "banned"];
const ALLOWED_PROVIDERS: AuthProvider[] = ["discord", "google"];

export interface UseAdminUsersResult {
  users: AdminUser[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

const isAuthProvider = (value: unknown): value is AuthProvider =>
  typeof value === "string" && ALLOWED_PROVIDERS.includes(value as AuthProvider);

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
    .map((role) => String(role) as AdminRole)
    .filter((role) => ALLOWED_ROLES.includes(role));
  return normalized.length ? normalized : ["user"];
};

const normalizeStatus = (status: unknown): AdminStatus => {
  if (typeof status === "string" && ALLOWED_STATUSES.includes(status as AdminStatus)) {
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

const normalizeAdminUser = (raw: unknown): AdminUser => {
  const user = (raw ?? {}) as Partial<AdminUser>;
  const id = typeof user.id === "string" && user.id.length ? user.id : "unknown-user";
  const userId =
    typeof user.userId === "string" && user.userId.length ? user.userId : id ?? "unknown-user";

  return {
    id,
    userId,
    displayName:
      typeof user.displayName === "string" && user.displayName.length
        ? user.displayName
        : user.profile?.displayName ?? null,
    avatarUrl: typeof user.avatarUrl === "string" ? user.avatarUrl : null,
    primaryProvider: isAuthProvider(user.primaryProvider) ? user.primaryProvider : null,
    providers: normalizeProviders(user.providers),
    profile: user.profile,
    roles: normalizeRoles(user.roles),
    status: normalizeStatus(user.status),
    createdAt: normalizeTimestamp(user.createdAt),
    lastLoginAt: normalizeTimestamp(user.lastLoginAt),
    notes: typeof user.notes === "string" ? user.notes : null,
  };
};

export function useAdminUsers(): UseAdminUsersResult {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = (import.meta.env.VITE_AUTH_BASE_URL ?? "").replace(/\/+$/, "");

  const fetchUsers = useCallback(async (cancelToken?: { cancelled: boolean }) => {
    if (cancelToken?.cancelled) {
      return;
    }

    if (!baseUrl) {
      setUsers([]);
      setError("Auth API base URL is missing (VITE_AUTH_BASE_URL).");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}${ADMIN_USERS_PATH}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const message =
          response.status === 401
            ? "Not authenticated to load admin users (401)."
            : response.status === 403
              ? "Insufficient permissions to load admin users (403)."
              : `Failed to load admin users (${response.status}).`;
        throw new Error(message);
      }

      const payload = (await response.json()) as { users?: unknown[] };
      const incoming = Array.isArray(payload?.users) ? payload.users : [];
      const normalized = incoming.map(normalizeAdminUser);
      if (!cancelToken?.cancelled) {
        setUsers(normalized);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unexpected error while loading admin users.";
      if (!cancelToken?.cancelled) {
        setError(message);
        setUsers([]);
      }
    } finally {
      if (!cancelToken?.cancelled) {
        setIsLoading(false);
      }
    }
  }, [baseUrl]);

  useEffect(() => {
    const cancelToken = { cancelled: false };
    fetchUsers(cancelToken);
    return () => {
      cancelToken.cancelled = true;
    };
  }, [fetchUsers]);

  const refresh = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, isLoading, error, refresh };
}
