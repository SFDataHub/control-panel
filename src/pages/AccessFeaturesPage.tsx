import { useMemo, useState } from "react";
import ContentShell from "../components/ContentShell";
import PageHeader from "../components/PageHeader";
import useAccessControl, { AccessGroupRecord, FeatureAccessRecord } from "../hooks/useAccessControl";
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
    </ContentShell>
  );
}
