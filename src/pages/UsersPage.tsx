import { useMemo, useState } from "react";
import ContentShell from "../components/ContentShell";
import PageHeader from "../components/PageHeader";
import { adminUsersSummary, mockAdminUsers } from "../config/adminUsers";
import type { AdminRole, AdminStatus, AdminUser, AuthProvider } from "../config/adminUsers";

type RoleFilter = AdminRole | "all";
type StatusFilter = AdminStatus | "all";

const roleOptions: { label: string; value: RoleFilter }[] = [
  { label: "All roles", value: "all" },
  { label: "Owner", value: "owner" },
  { label: "Admin", value: "admin" },
  { label: "Moderator", value: "moderator" },
  { label: "Viewer", value: "viewer" },
];

const statusOptions: { label: string; value: StatusFilter }[] = [
  { label: "All statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" },
  { label: "Invited", value: "invited" },
];

const providerLabels: Record<AuthProvider, string> = {
  discord: "Discord",
  google: "Google",
  github: "GitHub",
  other: "Other",
};

const roleLabels: Record<AdminRole, string> = {
  owner: "Owner",
  admin: "Admin",
  moderator: "Moderator",
  viewer: "Viewer",
};

const statusLabels: Record<AdminStatus, string> = {
  active: "Active",
  suspended: "Suspended",
  invited: "Invited",
};

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function formatDate(value?: string) {
  if (!value) {
    return "–";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const day = date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  const time = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${day} · ${time}`;
}

export default function UsersPage() {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const filteredUsers = useMemo(() => {
    const query = normalizeSearch(searchTerm);
    return mockAdminUsers.filter((user) => {
      if (roleFilter !== "all" && !user.roles.includes(roleFilter)) {
        return false;
      }
      if (statusFilter !== "all" && user.status !== statusFilter) {
        return false;
      }
      if (query && !`${user.displayName} ${user.id}`.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [roleFilter, statusFilter, searchTerm]);

  const summary = useMemo(() => adminUsersSummary(filteredUsers), [filteredUsers]);

  return (
    <ContentShell
      title="Admin Users"
      description="Manage access to SFDataHub admin tools (read-only demo data for now)"
      headerContent={
        <PageHeader
          title="Admin Users"
          subtitle="Manage access to SFDataHub admin tools (read-only demo data for now)"
          hintRight="Demo data only - wiring to real user store later"
        />
      }
    >

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
              <p className="user-name">{user.displayName}</p>
              <p className="user-id">{user.id}</p>
            </div>
            <div className="user-cell user-cell--providers">
              {user.providers.map((provider) => (
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
              <h2>{selectedUser.displayName}</h2>
              <p className="user-detail-drawer__id">{selectedUser.id}</p>
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
                {selectedUser.providers.map((provider) => (
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
