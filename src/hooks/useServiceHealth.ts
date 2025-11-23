import { useCallback, useEffect, useMemo, useState } from "react";
import { coreServices } from "../config/services";
import type { Service, ServiceId, ServiceStatus } from "../config/services";

export type HealthStatus = ServiceStatus;

export type ServiceHealthEntry = {
  status: HealthStatus;
  latencyMs?: number;
  checkedAt?: string;
  errorMessage?: string;
};

export type ServiceHealthState = Partial<Record<ServiceId, ServiceHealthEntry>>;

type UseServiceHealthResult = {
  healthMap: ServiceHealthState;
  isLoading: boolean;
  error?: string;
  refresh: () => Promise<void>;
};

const defaultTimeout = 6000;

function mapHttpStatus(status: number): HealthStatus {
  if (status === 200) return "ok";
  if (status >= 500) return "down";
  if (status >= 400) return "degraded";
  return "unknown";
}

async function checkHttpHealth(url: string, timeoutMs?: number): Promise<ServiceHealthEntry> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs ?? defaultTimeout);
  const start = performance.now();
  try {
    const response = await fetch(url, { method: "GET", signal: controller.signal });
    const latencyMs = Math.round(performance.now() - start);
    const status = mapHttpStatus(response.status);
    clearTimeout(timer);
    return {
      status,
      latencyMs,
      checkedAt: new Date().toISOString(),
      errorMessage: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    clearTimeout(timer);
    const message = error instanceof Error ? error.message : "Network error";
    return {
      status: error instanceof DOMException && error.name === "AbortError" ? "down" : "down",
      latencyMs: Math.round(performance.now() - start),
      checkedAt: new Date().toISOString(),
      errorMessage: message,
    };
  }
}

async function checkFirestoreHealth(
  projectId: string | undefined,
  collection: string,
  document: string | undefined,
  timeoutMs?: number,
): Promise<ServiceHealthEntry> {
  if (!projectId) {
    return {
      status: "unknown",
      errorMessage: "Missing Firestore projectId (VITE_FIREBASE_PROJECT_ID)",
      checkedAt: new Date().toISOString(),
    };
  }
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
  const targetPath = document ? `${collection}/${document}` : collection;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${targetPath}`;
  const url = apiKey ? `${baseUrl}?pageSize=1&key=${apiKey}` : `${baseUrl}?pageSize=1`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs ?? defaultTimeout);
  const start = performance.now();

  try {
    const response = await fetch(url, { method: "GET", signal: controller.signal });
    const latencyMs = Math.round(performance.now() - start);
    clearTimeout(timer);
    if (response.ok) {
      return { status: "ok", latencyMs, checkedAt: new Date().toISOString() };
    }
    return {
      status: response.status >= 500 ? "down" : "degraded",
      latencyMs,
      checkedAt: new Date().toISOString(),
      errorMessage: `HTTP ${response.status}`,
    };
  } catch (error) {
    clearTimeout(timer);
    const message = error instanceof Error ? error.message : "Network error";
    return {
      status: "down",
      latencyMs: Math.round(performance.now() - start),
      checkedAt: new Date().toISOString(),
      errorMessage: message,
    };
  }
}

async function runHealthCheck(service: Service): Promise<[ServiceId, ServiceHealthEntry]> {
  const { healthCheck } = service;
  if (!healthCheck) {
    return [service.id, { status: service.status ?? "unknown" }];
  }

  if (healthCheck.type === "http") {
    const result = await checkHttpHealth(healthCheck.url, healthCheck.timeoutMs);
    return [service.id, result];
  }

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
  const result = await checkFirestoreHealth(
    projectId,
    healthCheck.firestoreCollection,
    healthCheck.firestoreDocument,
    healthCheck.timeoutMs,
  );
  return [service.id, result];
}

export default function useServiceHealth(services: Service[] = coreServices): UseServiceHealthResult {
  const [healthMap, setHealthMap] = useState<ServiceHealthState>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const servicesWithHealth = useMemo(() => services.filter((svc) => svc.healthCheck), [services]);

  const refresh = useCallback(async () => {
    if (servicesWithHealth.length === 0) {
      setHealthMap({});
      return;
    }
    setIsLoading(true);
    setError(undefined);
    try {
      const results = await Promise.all(servicesWithHealth.map((svc) => runHealthCheck(svc)));
      const next: ServiceHealthState = {};
      for (const [id, entry] of results) {
        next[id] = entry;
      }
      setHealthMap(next);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Health check failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [servicesWithHealth]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { healthMap, isLoading, error, refresh };
}
