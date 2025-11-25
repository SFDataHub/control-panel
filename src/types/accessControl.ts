import type { Timestamp } from "firebase/firestore";

export type AccessRole = "user" | "moderator" | "developer" | "admin" | (string & {});
export type FeatureAccessStatus = "logged_in" | "public" | "beta" | "dev_only" | "hidden" | (string & {});
export type FeatureArea = "controlPanel" | (string & {});
export type TimestampValue = Timestamp | string | Date | number | null;

export interface FeatureAccess {
  id: string;
  route: string;
  area: FeatureArea;
  titleKey: string;
  status: FeatureAccessStatus;
  minRole: AccessRole;
  allowedRoles?: AccessRole[];
  allowedGroups?: string[];
  allowedUserIds?: string[];
  showInTopbar: boolean;
  showInSidebar: boolean;
  navOrder?: number;
  isExperimental?: boolean;
  createdAt?: TimestampValue;
  updatedAt?: TimestampValue;
  createdBy?: string;
  updatedBy?: string;
}

export interface AccessGroup {
  id: string;
  label: string;
  description?: string;
  userIds?: string[];
  minRole?: AccessRole;
  allowedRoles?: AccessRole[];
  isSystem?: boolean;
  createdAt?: TimestampValue;
  updatedAt?: TimestampValue;
  createdBy?: string;
  updatedBy?: string;
}
