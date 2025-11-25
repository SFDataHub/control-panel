import { useCallback, useEffect, useState } from "react";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import type {
  AccessGroup,
  AccessRole,
  FeatureAccess,
  FeatureAccessStatus,
  FeatureArea,
  TimestampValue,
} from "../types/accessControl";

export interface FeatureAccessRecord extends FeatureAccess {
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface AccessGroupRecord extends AccessGroup {
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface UseAccessControlResult {
  features: FeatureAccessRecord[];
  accessGroups: AccessGroupRecord[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

const KNOWN_STATUSES: FeatureAccessStatus[] = ["public", "logged_in", "beta", "dev_only", "hidden"];

function normalizeTimestamp(value: TimestampValue): Date | null {
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "string" && value.trim()) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function normalizeArea(area: unknown): FeatureArea {
  if (typeof area === "string" && area.trim()) {
    return area.trim() as FeatureArea;
  }
  return "controlPanel";
}

function normalizeStatus(status: unknown): FeatureAccessStatus {
  if (typeof status === "string" && status.trim()) {
    const value = status.trim().toLowerCase();
    if (KNOWN_STATUSES.includes(value as FeatureAccessStatus)) {
      return value as FeatureAccessStatus;
    }
    return value as FeatureAccessStatus;
  }
  return "hidden";
}

function normalizeRole(role: unknown, fallback: AccessRole = "user"): AccessRole {
  if (typeof role === "string" && role.trim()) {
    return role.trim().toLowerCase() as AccessRole;
  }
  return fallback;
}

function normalizeRoleArray(value: unknown): AccessRole[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const roles = value
    .map((role) => normalizeRole(role))
    .filter((role, index, self) => role && self.indexOf(role) === index);
  return roles.length ? roles : undefined;
}

function normalizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const entries = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
  return entries.length ? entries : undefined;
}

function normalizeFeatureAccess(id: string, raw: Record<string, unknown>): FeatureAccessRecord {
  return {
    id,
    route: typeof raw.route === "string" && raw.route.trim() ? raw.route : "/",
    area: normalizeArea(raw.area),
    titleKey: typeof raw.titleKey === "string" && raw.titleKey.trim() ? raw.titleKey : id,
    status: normalizeStatus(raw.status),
    minRole: normalizeRole(raw.minRole),
    allowedRoles: normalizeRoleArray(raw.allowedRoles),
    allowedGroups: normalizeStringArray(raw.allowedGroups),
    allowedUserIds: normalizeStringArray(raw.allowedUserIds),
    showInTopbar: raw.showInTopbar === true,
    showInSidebar: raw.showInSidebar === true,
    navOrder: typeof raw.navOrder === "number" ? raw.navOrder : undefined,
    isExperimental: raw.isExperimental === true,
    createdAt: normalizeTimestamp(raw.createdAt as TimestampValue),
    updatedAt: normalizeTimestamp(raw.updatedAt as TimestampValue),
    createdBy: typeof raw.createdBy === "string" ? raw.createdBy : undefined,
    updatedBy: typeof raw.updatedBy === "string" ? raw.updatedBy : undefined,
  };
}

function normalizeAccessGroup(id: string, raw: Record<string, unknown>): AccessGroupRecord {
  return {
    id,
    label: typeof raw.label === "string" && raw.label.trim() ? raw.label : id,
    description: typeof raw.description === "string" ? raw.description : undefined,
    userIds: normalizeStringArray(raw.userIds),
    minRole: raw.minRole ? normalizeRole(raw.minRole) : undefined,
    allowedRoles: normalizeRoleArray(raw.allowedRoles),
    isSystem: raw.isSystem === true,
    createdAt: normalizeTimestamp(raw.createdAt as TimestampValue),
    updatedAt: normalizeTimestamp(raw.updatedAt as TimestampValue),
    createdBy: typeof raw.createdBy === "string" ? raw.createdBy : undefined,
    updatedBy: typeof raw.updatedBy === "string" ? raw.updatedBy : undefined,
  };
}

export default function useAccessControl(): UseAccessControlResult {
  const [features, setFeatures] = useState<FeatureAccessRecord[]>([]);
  const [accessGroups, setAccessGroups] = useState<AccessGroupRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (cancelToken?: { cancelled: boolean }) => {
    setIsLoading(true);
    setError(null);
    try {
      const [featureSnap, accessGroupsSnap] = await Promise.all([
        getDocs(collection(db, "feature_access")),
        getDocs(collection(db, "access_groups")),
      ]);

      if (cancelToken?.cancelled) return;

      const normalizedFeatures = featureSnap.docs
        .map((doc) => normalizeFeatureAccess(doc.id, doc.data() as Record<string, unknown>))
        .sort((a, b) => {
          const orderA = a.navOrder ?? Number.MAX_SAFE_INTEGER;
          const orderB = b.navOrder ?? Number.MAX_SAFE_INTEGER;
          if (orderA !== orderB) return orderA - orderB;
          return a.route.localeCompare(b.route);
        });

      const normalizedGroups = accessGroupsSnap.docs
        .map((doc) => normalizeAccessGroup(doc.id, doc.data() as Record<string, unknown>))
        .sort((a, b) => a.id.localeCompare(b.id));

      setFeatures(normalizedFeatures);
      setAccessGroups(normalizedGroups);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load access control collections.";
      if (!cancelToken?.cancelled) {
        setError(message);
        setFeatures([]);
        setAccessGroups([]);
      }
    } finally {
      if (!cancelToken?.cancelled) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const cancelToken = { cancelled: false };
    void fetchData(cancelToken);
    return () => {
      cancelToken.cancelled = true;
    };
  }, [fetchData]);

  const refresh = useCallback(() => {
    void fetchData();
  }, [fetchData]);

  return {
    features,
    accessGroups,
    isLoading,
    error,
    refresh,
  };
}
