import { useCallback, useEffect, useState } from "react";

import type { AdminUser } from "../config/adminUsers";
import { fetchAdminUsers } from "../lib/adminUsersApi";

export interface UseAdminUsersResult {
  users: AdminUser[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  replaceUser: (user: AdminUser) => void;
}

export function useAdminUsers(): UseAdminUsersResult {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (cancelToken?: { cancelled: boolean }) => {
    if (cancelToken?.cancelled) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const normalized = await fetchAdminUsers();
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
  }, []);

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

  const replaceUser = useCallback((updated: AdminUser) => {
    setUsers((prev) => {
      let replaced = false;
      const next = prev.map((user) => {
        if (user.userId === updated.userId || user.id === updated.id) {
          replaced = true;
          return updated;
        }
        return user;
      });
      return replaced ? next : [updated, ...next];
    });
  }, []);

  return { users, isLoading, error, refresh, replaceUser };
}
