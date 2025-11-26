import { useMemo, useState } from "react";
import ContentShell from "../components/ContentShell";
import PageHeader from "../components/PageHeader";
import useAccessControl, { type AccessGroupRecord, type FeatureAccessRecord } from "../hooks/useAccessControl";
import { updateFeatureAccess } from "../lib/adminAccessControlApi";
import type { AccessRole, FeatureAccessStatus } from "../types/accessControl";

type FeatureStatusFilter = FeatureAccessStatus | "all";

const statusOptions: { value: FeatureStatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "public", label: "Public" },
  { value: "logged_in", label: "Logged in" },
  { value: "beta", label: "Beta" },
  { value: "dev_only", label: "Dev only" },
  { value: "hidden", label: "Hidden" },
];

const statusMeta: Record<string, { label: string; tone: string }> = {
  public: { label: "Public", tone: "status-badge--public" },
  logged_in: { label: "Logged in", tone: "status-badge--logged-in" },
  beta: { label: "Beta", tone: "status-badge--beta" },
  dev_only: { label: "Dev only", tone: "status-badge--dev" },
  hidden: { label: "Hidden", tone: "status-badge--hidden" },
};

const roleLabels: Record<string, string> = {
  admin: "Admin",
  owner: "Owner",
  mod: "Moderator",
  moderator: "Moderator",
  developer: "Developer",
  user: "User",
};

const editableRoles: AccessRole[] = ["admin", "moderator", "developer", "user"];

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function matchesFeature(row: FeatureAccessRecord, query: string) {
  if (!query) return true;
  return `${row.route} ${row.titleKey} ${row.area}`.toLowerCase().includes(query);
}

function matchesGroup(row: AccessGroupRecord, query: string) {
  if (!query) return true;
  return `${row.id} ${row.label ?? ""}`.toLowerCase().includes(query);
}

function formatRole(role: AccessRole | undefined) {
  if (!role) return "—";
  return roleLabels[role] ?? role;
}

function formatTimestamp(date?: Date | null) {
  if (!date) return "—";
  const now = Date.now();
  const diffMs = date.getTime() - now;
  const absMs = Math.abs(diffMs);
  const minutes = Math.round(absMs / 60000);
  const hours = Math.round(absMs / (60 * 60 * 1000));
  const days = Math.round(absMs / (24 * 60 * 60 * 1000));

  if (minutes < 90) {
    return diffMs >= 0 ? `in ${minutes}m` : `${minutes}m ago`;
  }
  if (hours < 48) {
    return diffMs >= 0 ? `in ${hours}h` : `${hours}h ago`;
  }
  if (days < 10) {
    return diffMs >= 0 ? `in ${days}d` : `${days}d ago`;
  }
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AccessFeaturesPage() {
  const { features, accessGroups, isLoading, error, refresh } = useAccessControl();
  const [featureSearch, setFeatureSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FeatureStatusFilter>("all");
  const [groupSearch, setGroupSearch] = useState("");
  const [editingFeature, setEditingFeature] = useState<FeatureAccessRecord | null>(null);
  const [draft, setDraft] = useState<FeatureAccessRecord | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filteredFeatures = useMemo(() => {
    const query = normalizeSearch(featureSearch);
    return features.filter((feature) => {
      if (statusFilter !== "all" && feature.status !== statusFilter) {
        return false;
      }
      return matchesFeature(feature, query);
    });
  }, [featureSearch, features, statusFilter]);

  const filteredGroups = useMemo(() => {
    const query = normalizeSearch(groupSearch);
    return accessGroups.filter((group) => matchesGroup(group, query));
  }, [accessGroups, groupSearch]);

  const groupOptions = useMemo(
    () => accessGroups.map((group) => ({ id: group.id, label: group.label ?? group.id })),
    [accessGroups],
  );

  const startEdit = (feature: FeatureAccessRecord) => {
    setEditingFeature(feature);
    setDraft({ ...feature });
    setSaveError(null);
  };

  const closeEdit = () => {
    setEditingFeature(null);
    setDraft(null);
    setSaveError(null);
  };

  const toggleDraftArray = (key: "allowedRoles" | "allowedGroups", value: string) => {
    if (!draft) return;
    const current = draft[key] ?? [];
    const nextSet = new Set(current);
    if (nextSet.has(value)) {
      nextSet.delete(value);
    } else {
      nextSet.add(value);
    }
    setDraft({ ...draft, [key]: Array.from(nextSet) });
  };

  const hasChanges = useMemo(() => {
    if (!draft || !editingFeature) return false;

    const arraysEqual = (a?: string[], b?: string[]) => {
      const one = a ?? [];
      const two = b ?? [];
      if (one.length !== two.length) return false;
      return one.every((value) => two.includes(value));
    };

    return (
      draft.status !== editingFeature.status ||
      draft.minRole !== editingFeature.minRole ||
      draft.showInSidebar !== editingFeature.showInSidebar ||
      draft.showInTopbar !== editingFeature.showInTopbar ||
      !arraysEqual(draft.allowedRoles as string[] | undefined, editingFeature.allowedRoles as string[] | undefined) ||
      !arraysEqual(draft.allowedGroups, editingFeature.allowedGroups)
    );
  }, [draft, editingFeature]);

  const handleSave = async () => {
    if (!draft || !editingFeature) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await updateFeatureAccess(editingFeature.id, {
        status: draft.status,
        minRole: draft.minRole,
        allowedRoles: draft.allowedRoles,
        allowedGroups: draft.allowedGroups,
        showInSidebar: draft.showInSidebar,
        showInTopbar: draft.showInTopbar,
      });
      closeEdit();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save feature.";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ContentShell
      title="Access & Features"
      description="View which features and pages are visible for which roles and access groups."
      headerContent={
        <PageHeader
          title="Access & Features"
          subtitle="View which features and pages are visible for which roles and access groups."
          hintRight="Data from Firestore (read-only)"
        />
      }
    >
      <div className="admin-top">
        <p className="admin-top__hint">
          {error
            ? "Could not load access data from Firestore."
            : "Live snapshot from feature_access and access_groups (read-only)."}
        </p>
        {error && <p className="admin-top__hint">Debug: {error}</p>}
        <div className="admin-top__actions">
          {isLoading && <span className="admin-top__status">Loading...</span>}
          <button type="button" className="btn secondary" onClick={refresh} disabled={isLoading}>
            Refresh
          </button>
        </div>
      </div>

      <div className="access-grid">
        <section className="access-card">
          <header className="access-card__header">
            <div>
              <p className="monitoring-panel__eyebrow">Features</p>
              <h2 className="access-card__title">Features & Pages</h2>
              <p className="access-card__subtitle">Documents from collection feature_access.</p>
            </div>
            <span className="access-card__count">{filteredFeatures.length} items</span>
          </header>

          <div className="admin-filters">
            <label className="filter-control filter-control--grow">
              <span>Search by route, title, or area</span>
              <input
                value={featureSearch}
                onChange={(event) => setFeatureSearch(event.target.value)}
                placeholder="/access, controlPanel, ..."
              />
            </label>
            <label className="filter-control">
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as FeatureStatusFilter)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="access-table__wrapper">
            <table className="access-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Route</th>
                  <th>Area</th>
                  <th>Title key</th>
                  <th>Min role</th>
                  <th>Roles / Groups</th>
                  <th>Visibility</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeatures.map((feature) => {
                  const status =
                    statusMeta[feature.status] ?? {
                      label: feature.status,
                      tone: "status-badge--hidden",
                    };
                  return (
                    <tr key={feature.id}>
                      <td>
                        <span className={`status-badge ${status.tone}`}>{status.label}</span>
                      </td>
                      <td className="access-table__mono">{feature.route}</td>
                      <td>{feature.area}</td>
                      <td>{feature.titleKey}</td>
                      <td>
                        <span className={`pill role-pill role-pill--${feature.minRole}`}>
                          {formatRole(feature.minRole)}
                        </span>
                      </td>
                      <td>
                        <div className="access-table__chips">
                          {feature.allowedRoles?.map((role) => (
                            <span key={role} className={`pill role-pill role-pill--${role}`}>
                              {formatRole(role)}
                            </span>
                          ))}
                          {feature.allowedGroups?.map((groupId) => (
                            <span key={groupId} className="pill access-pill">
                              {groupId}
                            </span>
                          ))}
                          {!feature.allowedRoles?.length && !feature.allowedGroups?.length && (
                            <span className="access-table__meta">—</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="access-table__flags">
                          <span
                            className={`visibility-flag ${feature.showInSidebar ? "visibility-flag--on" : "visibility-flag--off"}`}
                          >
                            Sidebar
                          </span>
                          <span
                            className={`visibility-flag ${feature.showInTopbar ? "visibility-flag--on" : "visibility-flag--off"}`}
                          >
                            Topbar
                          </span>
                        </div>
                      </td>
                      <td className="access-table__meta">
                        {formatTimestamp(feature.updatedAt ?? feature.createdAt)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="text-link"
                          onClick={() => startEdit(feature)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredFeatures.length === 0 && !isLoading && (
            <div className="placeholder-card">
              <p>No features match your filters.</p>
            </div>
          )}
        </section>

        <section className="access-card">
          <header className="access-card__header">
            <div>
              <p className="monitoring-panel__eyebrow">Groups</p>
              <h2 className="access-card__title">Access groups</h2>
              <p className="access-card__subtitle">Documents from collection access_groups.</p>
            </div>
            <span className="access-card__count">{filteredGroups.length} items</span>
          </header>

          <div className="admin-filters">
            <label className="filter-control filter-control--grow">
              <span>Search by id or label</span>
              <input
                value={groupSearch}
                onChange={(event) => setGroupSearch(event.target.value)}
                placeholder="beta_testers, creator_program"
              />
            </label>
          </div>

          <div className="access-table__wrapper">
            <table className="access-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Label</th>
                  <th>Description</th>
                  <th>Min role</th>
                  <th>Allowed roles</th>
                  <th>User count</th>
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map((group) => (
                  <tr key={group.id}>
                    <td className="access-table__mono">{group.id}</td>
                    <td>{group.label}</td>
                    <td className="access-table__meta">{group.description ?? "—"}</td>
                    <td>
                      <span className={`pill role-pill role-pill--${group.minRole ?? "user"}`}>
                        {formatRole(group.minRole ?? "user")}
                      </span>
                    </td>
                    <td>
                      <div className="access-table__chips">
                        {group.allowedRoles?.map((role) => (
                          <span key={role} className={`pill role-pill role-pill--${role}`}>
                            {formatRole(role)}
                          </span>
                        ))}
                        {!group.allowedRoles?.length && <span className="access-table__meta">—</span>}
                      </div>
                    </td>
                    <td>{group.userIds?.length ?? 0}</td>
                    <td>
                      <div className="access-table__flags">
                        <span
                          className={`visibility-flag ${group.isSystem ? "visibility-flag--on" : "visibility-flag--off"}`}
                        >
                          {group.isSystem ? "System" : "Custom"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredGroups.length === 0 && !isLoading && (
            <div className="placeholder-card">
              <p>No access groups match your filters.</p>
            </div>
          )}
        </section>
      </div>

      {draft && editingFeature && (
        <div className="log-modal" role="dialog" aria-modal="true" aria-label="Edit feature access">
          <div className="log-modal__content access-modal">
            <header className="log-modal__header">
              <div>
                <p className="log-modal__eyebrow">Edit feature</p>
                <h2 className="access-modal__title">{editingFeature.titleKey}</h2>
                <p className="access-table__meta">{editingFeature.route}</p>
              </div>
              <button type="button" className="text-link" onClick={closeEdit} disabled={isSaving}>
                Close
              </button>
            </header>

            {saveError && <div className="error-banner">Failed to save: {saveError}</div>}

            <div className="access-modal__form">
              <label className="filter-control">
                <span>Status</span>
                <select
                  value={draft.status}
                  onChange={(event) =>
                    setDraft({ ...draft, status: event.target.value as FeatureAccessStatus })
                  }
                >
                  {statusOptions
                    .filter((option) => option.value !== "all")
                    .map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </select>
              </label>

              <label className="filter-control">
                <span>Min role</span>
                <select
                  value={draft.minRole}
                  onChange={(event) => setDraft({ ...draft, minRole: event.target.value as AccessRole })}
                >
                  {editableRoles.map((role) => (
                    <option key={role} value={role}>
                      {formatRole(role)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="filter-control">
                <span>Allowed roles</span>
                <div className="access-modal__chips">
                  {editableRoles.map((role) => {
                    const selected = draft.allowedRoles?.includes(role) ?? false;
                    return (
                      <button
                        type="button"
                        key={role}
                        className={`pill role-pill role-pill--${role} ${selected ? "" : "pill--ghost"}`}
                        onClick={() => toggleDraftArray("allowedRoles", role)}
                        aria-pressed={selected}
                      >
                        {formatRole(role)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="filter-control">
                <span>Allowed groups</span>
                <div className="access-modal__chips">
                  {groupOptions.map((group) => {
                    const selected = draft.allowedGroups?.includes(group.id) ?? false;
                    return (
                      <button
                        type="button"
                        key={group.id}
                        className={`pill access-pill ${selected ? "" : "pill--ghost"}`}
                        onClick={() => toggleDraftArray("allowedGroups", group.id)}
                        aria-pressed={selected}
                        title={group.label}
                      >
                        {group.label}
                      </button>
                    );
                  })}
                  {!groupOptions.length && <span className="access-table__meta">No groups loaded</span>}
                </div>
              </div>

              <div className="access-modal__toggles">
                <label className="access-toggle">
                  <input
                    type="checkbox"
                    checked={draft.showInSidebar}
                    onChange={(event) => setDraft({ ...draft, showInSidebar: event.target.checked })}
                  />
                  <span>Show in sidebar</span>
                </label>
                <label className="access-toggle">
                  <input
                    type="checkbox"
                    checked={draft.showInTopbar}
                    onChange={(event) => setDraft({ ...draft, showInTopbar: event.target.checked })}
                  />
                  <span>Show in topbar</span>
                </label>
              </div>
            </div>

            <footer className="access-modal__footer">
              <button type="button" className="btn secondary" onClick={closeEdit} disabled={isSaving}>
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </ContentShell>
  );
}
