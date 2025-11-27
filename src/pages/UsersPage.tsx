import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import ContentShell from "../components/ContentShell";
import PageHeader from "../components/PageHeader";
import { adminUsersSummary } from "../config/adminUsers";
import type { AdminRole, AdminStatus, AdminUser, AuthProvider } from "../config/adminUsers";
import { useAdminUsers } from "../hooks/useAdminUsers";
import useAuth from "../hooks/useAuth";
import { roleOrder, updateUserRoles } from "../lib/adminUsersApi";

type RoleFilter = AdminRole | "all";
type StatusFilter = AdminStatus | "all";
type RoleMenuState = { user: AdminUser; x: number; y: number; roles: AdminRole[] };

const editableRoles: AdminRole[] = roleOrder;

const roleOptions: { label: string; value: RoleFilter }[] = [
  { label: "All roles", value: "all" },
  { label: "Admin", value: "admin" },
  { label: "Moderator", value: "moderator" },
  { label: "Developer", value: "developer" },
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

const roleLabels: Record<string, string> = {
  admin: "Admin",
  moderator: "Moderator",
  mod: "Moderator",
  creator: "Developer",
  developer: "Developer",
  user: "User",
  owner: "Owner",
};

const statusLabels: Record<AdminStatus, string> = {
  active: "Active",
  suspended: "Suspended",
  banned: "Banned",
};

const sortRoles = (roles: AdminRole[]): AdminRole[] => {
  const orderIndex = (role: AdminRole) => {
    const idx = roleOrder.indexOf(role);
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  };
  return [...roles].sort((a, b) => orderIndex(a) - orderIndex(b));
};

const isSystemUser = (user: AdminUser) =>
  user.isSystem === true || (user.flags ?? []).includes("system");

const isSameUser = (left: AdminUser, right: AdminUser) =>
  left.userId === right.userId || left.id === right.id;

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
  const [roleMenu, setRoleMenu] = useState<RoleMenuState | null>(null);
  const [roleMenuError, setRoleMenuError] = useState<string | null>(null);
  const [isRoleSaving, setIsRoleSaving] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement | null>(null);
  const { users, isLoading, error, refresh, replaceUser } = useAdminUsers();
  const { user: authUser } = useAuth();

  const viewerRoles = useMemo(
    () => (authUser?.roles ?? []).map((role) => role.toLowerCase()),
    [authUser],
  );
  const canManageRoles = viewerRoles.some((role) => role === "admin" || role === "owner");

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

  const roleMenuPosition = useMemo(() => {
    if (!roleMenu) return undefined;
    const maxLeft = typeof window !== "undefined" ? Math.max(12, window.innerWidth - 260) : null;
    const maxTop = typeof window !== "undefined" ? Math.max(12, window.innerHeight - 220) : null;
    return {
      left: maxLeft ? Math.min(roleMenu.x, maxLeft) : roleMenu.x,
      top: maxTop ? Math.min(roleMenu.y, maxTop) : roleMenu.y,
    };
  }, [roleMenu]);

  useEffect(() => {
    if (!selectedUser) return;
    const latest = users.find((user) => isSameUser(user, selectedUser));
    if (latest && latest !== selectedUser) {
      setSelectedUser(latest);
    }
  }, [selectedUser, users]);

  const closeRoleMenu = useCallback(() => {
    setRoleMenu(null);
    setRoleMenuError(null);
    setIsRoleSaving(false);
  }, []);

  const openRoleMenu = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>, user: AdminUser) => {
      if (!canManageRoles || isSystemUser(user)) return;
      if (typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches) {
        return;
      }
      event.preventDefault();
      setRoleMenu({
        user,
        x: event.clientX,
        y: event.clientY,
        roles: sortRoles(user.roles),
      });
      setRoleMenuError(null);
      setIsRoleSaving(false);
    },
    [canManageRoles],
  );

  useEffect(() => {
    if (!roleMenu) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeRoleMenu();
      }
    };
    const handleClick = (event: MouseEvent) => {
      if (!roleMenuRef.current) return;
      if (!roleMenuRef.current.contains(event.target as Node)) {
        closeRoleMenu();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleClick);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleClick);
    };
  }, [closeRoleMenu, roleMenu]);

  const handleRoleToggle = useCallback(
    async (role: AdminRole) => {
      if (!roleMenu || isRoleSaving) return;

      const previousRoles = roleMenu.roles;
      const nextSet = new Set(previousRoles);
      if (nextSet.has(role)) {
        nextSet.delete(role);
      } else {
        nextSet.add(role);
      }
      const nextRoles = sortRoles(Array.from(nextSet));

      setRoleMenu({ ...roleMenu, roles: nextRoles });
      setIsRoleSaving(true);
      setRoleMenuError(null);
      try {
        const updatedUser = await updateUserRoles(
          roleMenu.user.userId || roleMenu.user.id,
          nextRoles,
        );
        replaceUser(updatedUser);
        setSelectedUser((current) =>
          current && isSameUser(current, updatedUser) ? updatedUser : current,
        );
        setRoleMenu((current) =>
          current ? { ...current, user: updatedUser, roles: sortRoles(updatedUser.roles) } : current,
        );
      } catch (err) {
        setRoleMenuError(err instanceof Error ? err.message : "Failed to update roles.");
        setRoleMenu((current) => (current ? { ...current, roles: previousRoles } : current));
      } finally {
        setIsRoleSaving(false);
      }
    },
    [isRoleSaving, replaceUser, roleMenu],
  );

  const summary = useMemo(() => adminUsersSummary(filteredUsers), [filteredUsers]);

  return (
    <ContentShell
      title="Admin Users"
      description="View and edit admin users from auth-api (right-click a user to toggle roles)."
      headerContent={
        <PageHeader
          title="Admin Users"
          subtitle="Manage access to SFDataHub admin tools via auth-api."
          hintRight="GET /admin/users · PATCH /admin/users/:userId/roles"
        />
      }
    >
      <div className="admin-top">
        <p className="admin-top__hint">
          {error ? `Couldn't load admin users. ${error}` : "Connected to auth-api (roles editable)."}
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
            onContextMenu={(event) => openRoleMenu(event, user)}
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
                  {roleLabels[role] ?? role}
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

      {roleMenu && (
        <div className="role-menu-overlay" onClick={closeRoleMenu}>
          <div
            ref={roleMenuRef}
            className="role-menu"
            style={roleMenuPosition}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="role-menu__header">
              <p className="role-menu__eyebrow">Roles</p>
              <h3 className="role-menu__title">{getDisplayName(roleMenu.user)}</h3>
              <p className="role-menu__id">{roleMenu.user.userId}</p>
            </div>
            {roleMenuError && <p className="role-menu__error">{roleMenuError}</p>}
            <div className="role-menu__roles">
              {editableRoles.map((role) => {
                const active = roleMenu.roles.includes(role);
                return (
                  <button
                    type="button"
                    key={role}
                    className={`pill role-pill role-pill--${role} ${active ? "" : "pill--ghost"}`}
                    onClick={() => handleRoleToggle(role)}
                    disabled={isRoleSaving}
                    aria-pressed={active}
                  >
                    {roleLabels[role] ?? role}
                  </button>
                );
              })}
            </div>
            <div className="role-menu__footer">
              <span className="role-menu__status">
                {isRoleSaving ? "Saving..." : "Right-click a user to manage roles"}
              </span>
              <button
                type="button"
                className="text-link"
                onClick={closeRoleMenu}
                disabled={isRoleSaving}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
                    {roleLabels[role] ?? role}
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
