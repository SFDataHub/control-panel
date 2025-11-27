import type { AccessRole, FeatureAccessStatus } from "../types/accessControl";

const BASE_URL = (import.meta.env.VITE_AUTH_BASE_URL ?? "").replace(/\/+$/, "");

type UpdateFeaturePayload = Partial<{
  status: FeatureAccessStatus;
  minRole: AccessRole;
  allowedRoles: AccessRole[];
  allowedGroups: string[];
  showInSidebar: boolean;
  showInTopbar: boolean;
}>;

type UpdateAccessGroupPayload = Partial<{
  label: string;
  description: string;
  minRole: AccessRole;
  allowedRoles: AccessRole[];
  userIds: string[];
}>;

async function handleResponse(response: Response) {
  if (response.ok) {
    return response.json();
  }

  let details = "";
  try {
    const body = await response.json();
    details = (body?.error as string) ?? response.statusText;
  } catch {
    details = response.statusText;
  }

  throw new Error(`Request failed (${response.status}): ${details}`);
}

export async function updateFeatureAccess(featureId: string, payload: UpdateFeaturePayload) {
  if (!BASE_URL) {
    throw new Error("AUTH base URL missing (VITE_AUTH_BASE_URL).");
  }
  if (!featureId) {
    throw new Error("Feature id is required.");
  }

  const url = `${BASE_URL}/admin/access-control/features/${encodeURIComponent(featureId)}`;
  const response = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function updateAccessGroup(groupId: string, payload: UpdateAccessGroupPayload) {
  if (!BASE_URL) {
    throw new Error("AUTH base URL missing (VITE_AUTH_BASE_URL).");
  }
  if (!groupId) {
    throw new Error("Group id is required.");
  }

  const url = `${BASE_URL}/admin/access-control/groups/${encodeURIComponent(groupId)}`;
  const response = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
}

export async function fetchAccessConfig() {
  if (!BASE_URL) {
    throw new Error("AUTH base URL missing (VITE_AUTH_BASE_URL).");
  }

  const url = `${BASE_URL}/admin/access-control`;
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return handleResponse(response) as Promise<{
    features?: Array<Record<string, unknown>>;
    groups?: Array<Record<string, unknown>>;
  }>;
}
