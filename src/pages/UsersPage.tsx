import { useMemo, useState } from "react";
import ContentShell from "../components/ContentShell";
import PageHeader from "../components/PageHeader";
import { adminUsersSummary } from "../config/adminUsers";
import type { AdminRole, AdminStatus, AdminUser, AuthProvider } from "../config/adminUsers";
import { useAdminUsers } from "../hooks/useAdminUsers";

type RoleFilter = AdminRole | "all";
type StatusFilter = AdminStatus | "all";

const roleOptions: { label: string; value: RoleFilter }[] = [
  { label: "All roles", value: "all" },
  { label: "Admin", value: "admin" },
  { label: "Moderator", value: "mod" },
  { label: "Creator", value: "creator" },
  { label: "User", value: "user" },
];

const statusOptions: { label: string; value: StatusFilter }[] = [
  { label: "All statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" },
  { label: "Banned", value: "banned" },
];

const providerLabels: Record<AuthProvider, string> = {
  discord: "Discord",
  google: "Google",
};

const roleLabels: Record<AdminRole, string> = {
  admin: "Admin",
  mod: "Moderator",
  creator: "Creator",
  user: "User",
};

const statusLabels: Record<AdminStatus, string> = {
  active: "Active",
  suspended: "Suspended",
  banned: "Banned",
};

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const day = date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${day} at ${time}`;
}

function getDisplayName(user: AdminUser) {
  return user.displayName ?? user.profile?.displayName ?? user.userId ?? "Unknown user";
}

function getProviders(user: AdminUser): AuthProvider[] {
  const providers = new Set<AuthProvider>();
  if (user.primaryProvider) {
    providers.add(user.primaryProvider);
  }
  const providerEntries = user.providers ?? {};
  (Object.keys(providerEntries) as AuthProvider[]).forEach((provider) => providers.add(provider));
  return Array.from(providers);
}

export default function UsersPage() {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const { users, isLoading, error, refresh } = useAdminUsers();

  const filteredUsers = useMemo(() => {
    const query = normalizeSearch(searchTerm);
    return users.filter((user) => {
      if (roleFilter !== "all" && !user.roles.includes(roleFilter)) {
        return false;
      }
      if (statusFilter !== "all" && user.status !== statusFilter) {
        return false;
      }
      const searchableName = getDisplayName(user).toLowerCase();
      if (query && !`${searchableName} ${user.id}`.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [roleFilter, statusFilter, searchTerm, users]);

  const summary = useMemo(() => adminUsersSummary(filteredUsers), [filteredUsers]);

  return (
    <ContentShell
      title="Admin Users"
      description="Read-only view of admin users from Firestore via auth-api"
      headerContent={
        <PageHeader
          title="Admin Users"
          subtitle="Manage access to SFDataHub admin tools (read-only)"
          hintRight="Data loaded from auth-api /admin/users"
        />
      }
    >
      <div className="admin-top">
        <p className="admin-top__hint">
          {error ? "Couldn't load admin users." : "Connected to auth-api (read-only)."}
        </p>
        <div className="admin-top__actions">
          {isLoading && <span className="admin-top__status">Loading...</span>}
          <button type="button" className="btn secondary" onClick={refresh} disabled={isLoading}>
            Refresh
          </button>
        </div>
      </div>

      <div className="admin-filters">
        <label className="filter-control">
          <span>Role</span>
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-control">
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-control filter-control--grow">
          <span>Search by name or id</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search text"
          />
        </label>
      </div>

      <div className="admin-summary">
        <div className="summary-card">
          <p>Total admins</p>
          <strong>{summary.admins}</strong>
        </div>
        <div className="summary-card">
          <p>Moderators</p>
          <strong>{summary.moderators}</strong>
        </div>
        <div className="summary-card">
          <p>Invited users</p>
          <strong>{summary.invited}</strong>
        </div>
        <div className="summary-card">
          <p>Suspended users</p>
          <strong>{summary.suspended}</strong>
        </div>
      </div>

      <div className="user-table">
        {filteredUsers.map((user) => (
          <button
            type="button"
            key={user.id}
            className="user-row"
            onClick={() => setSelectedUser(user)}
          >
            <div className="user-cell user-cell--name">
              <p className="user-name">{getDisplayName(user)}</p>
              <p className="user-id">{user.id}</p>
            </div>
            <div className="user-cell user-cell--providers">
              {getProviders(user).map((provider) => (
                <span key={provider} className={`pill provider-pill provider-pill--${provider}`}>
                  {providerLabels[provider]}
                </span>
              ))}
            </div>
            <div className="user-cell user-cell--roles">
              {user.roles.map((role) => (
                <span key={role} className={`pill role-pill role-pill--${role}`}>
                  {roleLabels[role]}
                </span>
              ))}
            </div>
            <div className="user-cell">
              <span className={`status-chip status-chip--${user.status}`}>{statusLabels[user.status]}</span>
            </div>
            <div className="user-cell">
              <p className="user-meta">
                <span className="user-meta__label">Created</span>
                {formatDate(user.createdAt)}
              </p>
            </div>
            <div className="user-cell">
              <p className="user-meta">
                <span className="user-meta__label">Last login</span>
                {formatDate(user.lastLoginAt)}
              </p>
            </div>
          </button>
        ))}
        {filteredUsers.length === 0 && (
          <div className="placeholder-card">
            <p>No users match your filters.</p>
          </div>
        )}
      </div>

      {selectedUser && (
        <aside className="user-detail-drawer">
          <div className="user-detail-drawer__header">
            <div>
              <p className="monitoring-panel__eyebrow">User details</p>
              <h2>{getDisplayName(selectedUser)}</h2>
              <p className="user-detail-drawer__id">{selectedUser.userId}</p>
            </div>
            <div className="user-detail-drawer__header-meta">
              <span className={`status-chip status-chip--${selectedUser.status}`}>
                {statusLabels[selectedUser.status]}
              </span>
              <button type="button" className="btn secondary" onClick={() => setSelectedUser(null)}>
                Close
              </button>
            </div>
          </div>
          <div className="user-detail-drawer__grid">
            <div>
              <p className="user-meta__label">Providers</p>
              <div className="user-detail-drawer__badges">
                {getProviders(selectedUser).map((provider) => (
                  <span key={provider} className={`pill provider-pill provider-pill--${provider}`}>
                    {providerLabels[provider]}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="user-meta__label">Roles</p>
              <div className="user-detail-drawer__badges">
                {selectedUser.roles.map((role) => (
                  <span key={role} className={`pill role-pill role-pill--${role}`}>
                    {roleLabels[role]}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="user-meta__label">Created</p>
              <p className="user-meta">{formatDate(selectedUser.createdAt)}</p>
            </div>
            <div>
              <p className="user-meta__label">Last login</p>
              <p className="user-meta">{formatDate(selectedUser.lastLoginAt)}</p>
            </div>
          </div>
          <div className="user-detail-drawer__activity">
            <p className="monitoring-panel__eyebrow">Activity (coming soon)</p>
            <p className="user-meta">Recent actions and audit logs will appear here once wired to the backend.</p>
          </div>
        </aside>
      )}
    </ContentShell>
  );
}
