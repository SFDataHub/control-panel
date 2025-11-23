import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AuthProvider = "discord" | "google";

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

export interface AuthUserProviderInfo {
  id: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface AuthUser {
  id: string;
  displayName: string;
  avatarUrl?: string;
  provider: AuthProvider;
  providers?: Partial<Record<AuthProvider, AuthUserProviderInfo>>;
  roles: string[];
  createdAt?: string;
  lastLoginAt?: string;
}

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  isLoading: boolean;
  login: (provider: AuthProvider) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_BASE_URL = (import.meta.env.VITE_AUTH_BASE_URL ?? "").replace(/\/+$/, "");

const SESSION_ENDPOINTS = AUTH_BASE_URL
  ? [`${AUTH_BASE_URL}/auth/me`, `${AUTH_BASE_URL}/auth/session`]
  : [];
const LOGOUT_ENDPOINT = AUTH_BASE_URL ? `${AUTH_BASE_URL}/auth/logout` : "";

function mapSessionPayload(payload: any): { status: AuthStatus; user: AuthUser | null } {
  if (payload?.authenticated && payload.user) {
    return { status: "authenticated", user: payload.user as AuthUser };
  }
  return { status: "unauthenticated", user: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [user, setUser] = useState<AuthUser | null>(null);
  const isFetchingRef = useRef(false);

  const fetchSession = useCallback(async () => {
    if (!AUTH_BASE_URL) {
      console.warn("[Auth] AUTH_BASE_URL not configured; treating as unauthenticated.");
      setUser(null);
      setStatus("unauthenticated");
      return;
    }

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setStatus((prev) => (prev === "authenticated" ? prev : "loading"));

    let lastError: unknown;

    try {
      for (const endpoint of SESSION_ENDPOINTS) {
        try {
          const response = await fetch(endpoint, { credentials: "include" });
          if (!response.ok) {
            if (response.status === 404 || response.status === 405) {
              lastError = new Error(`Session endpoint ${endpoint} unavailable (${response.status}).`);
              continue;
            }
            throw new Error(`Failed to fetch session (${response.status}).`);
          }
          const data = await response.json();
          const mapped = mapSessionPayload(data);
          setUser(mapped.user);
          setStatus(mapped.status);
          return;
        } catch (error) {
          lastError = error;
        }
      }

      if (lastError) {
        console.error("[Auth] Failed to refresh session.", lastError);
      }
      setUser(null);
      setStatus("unauthenticated");
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const login = useCallback((provider: AuthProvider) => {
    if (!AUTH_BASE_URL) {
      console.warn(`[Auth] Cannot initiate ${provider} login without AUTH_BASE_URL.`);
      return;
    }
    const redirect = encodeURIComponent(window.location.href);
    window.location.href = `${AUTH_BASE_URL}/auth/${provider}?redirect=${redirect}`;
  }, []);

  const logout = useCallback(async () => {
    if (!LOGOUT_ENDPOINT) {
      console.warn("[Auth] AUTH_BASE_URL is not configured. Clearing local session only.");
      setUser(null);
      setStatus("unauthenticated");
      return;
    }

    try {
      const response = await fetch(LOGOUT_ENDPOINT, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Logout failed (${response.status}).`);
      }
    } catch (error) {
      console.error("[Auth] Failed to logout. Clearing local session anyway.", error);
    } finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    isFetchingRef.current = false;
  }, [status, user]);

  const isLoading = status === "idle" || status === "loading";

  const value = useMemo(
    () => ({
      status,
      user,
      isLoading,
      login,
      logout,
      refresh,
    }),
    [status, user, isLoading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
