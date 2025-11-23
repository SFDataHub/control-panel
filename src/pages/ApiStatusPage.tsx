import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContentShell from "../components/ContentShell";
import PageHeader from "../components/PageHeader";
import { coreServices } from "../config/services";
import type { Service, ServiceKind, ServiceStatus } from "../config/services";
import type { LogServiceId } from "../config/logs";

type KindFilter = ServiceKind | "all";
type StatusFilter = ServiceStatus | "all";

const kindOptions: { label: string; value: KindFilter }[] = [
  { label: "All", value: "all" },
  { label: "APIs", value: "api" },
  { label: "Database", value: "db" },
  { label: "Analytics", value: "analytics" },
  { label: "Other", value: "other" },
];

const statusOptions: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "OK", value: "ok" },
  { label: "Degraded", value: "degraded" },
  { label: "Down", value: "down" },
  { label: "Unknown", value: "unknown" },
];

const statusLabels: Record<ServiceStatus, { label: string; tone: "ok" | "warning" | "down" | "unknown" }> = {
  ok: { label: "OK", tone: "ok" },
  degraded: { label: "Degraded", tone: "warning" },
  down: { label: "Down", tone: "down" },
  unknown: { label: "Unknown", tone: "unknown" },
};

const kindLabels: Record<ServiceKind, string> = {
  api: "API",
  db: "Database",
  analytics: "Analytics",
  worker: "Worker",
  other: "Other",
};

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export default function ApiStatusPage() {
  const navigate = useNavigate();
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeService, setActiveService] = useState<Service | null>(null);

  const filteredServices = useMemo(() => {
    const query = normalizeSearch(searchTerm);

    return coreServices.filter((service) => {
      if (kindFilter !== "all") {
        if (kindFilter === "other") {
          if (service.kind !== "other" && service.kind !== "worker") {
            return false;
          }
        } else if (service.kind !== kindFilter) {
          return false;
        }
      }

      const serviceStatus = service.status ?? "unknown";
      if (statusFilter !== "all" && serviceStatus !== statusFilter) {
        return false;
      }

      if (query && !`${service.name} ${service.description}`.toLowerCase().includes(query)) {
        return false;
      }

      return true;
    });
  }, [kindFilter, statusFilter, searchTerm]);

  const openLogs = (serviceId: LogServiceId) => {
    navigate("/logs", { state: { defaultFilters: { service: serviceId } } });
  };

  const safeStatus = (service: Service) => statusLabels[service.status ?? "unknown"];

  return (
    <ContentShell
      title="APIs & Services"
      description="Catalog of backend services, databases and analytics powering SFDataHub"
      headerContent={
        <PageHeader
          title="APIs & Services"
          subtitle="Catalog of backend services, databases and analytics powering SFDataHub"
          hintRight="Data currently based on static config - health checks later"
        />
      }
    >

      <div className="service-filters">
        <label className="filter-control">
          <span>Category</span>
          <select value={kindFilter} onChange={(event) => setKindFilter(event.target.value as KindFilter)}>
            {kindOptions.map((option) => (
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
          <span>Search by name or description</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search text"
          />
        </label>
      </div>

      <div className="service-grid">
        {filteredServices.map((service) => {
          const status = safeStatus(service);
          return (
            <article key={service.id} className="service-card service-card--catalog">
              <header className="service-card__head">
                <div>
                  <p className="service-card__name">{service.name}</p>
                  <p className="service-card__desc">{service.description}</p>
                </div>
                <div className="service-card__status">
                  <span className={`status-badge status-badge--${status.tone}`}>{status.label}</span>
                  <span className="kind-pill kind-pill--light">{kindLabels[service.kind]}</span>
                </div>
              </header>

              {service.owner && (
                <p className="service-card__owner">
                  Owner: <span>{service.owner}</span>
                </p>
              )}

              <div className="service-card__actions">
                {service.url ? (
                  <a className="text-link" href={service.url} target="_blank" rel="noreferrer">
                    Open service
                  </a>
                ) : null}
                {service.docsUrl ? (
                  <a className="text-link" href={service.docsUrl} target="_blank" rel="noreferrer">
                    Docs
                  </a>
                ) : null}
                <button type="button" className="text-link" onClick={() => openLogs(service.id)}>
                  View logs
                </button>
                <button type="button" className="text-link text-link--muted" onClick={() => setActiveService(service)}>
                  Details
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {activeService && (
        <aside className="service-detail-drawer">
          <div className="service-detail-drawer__header">
            <div>
              <p className="monitoring-panel__eyebrow">Service details</p>
              <h2>{activeService.name}</h2>
              <p className="service-detail-drawer__description">{activeService.description}</p>
            </div>
            <button type="button" className="btn secondary" onClick={() => setActiveService(null)}>
              Close
            </button>
          </div>
          <div className="service-detail-drawer__meta">
            <div>
              <span>Kind</span>
              <strong>{kindLabels[activeService.kind]}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{safeStatus(activeService).label}</strong>
            </div>
            <div>
              <span>Owner</span>
              <strong>{activeService.owner ?? "Unassigned"}</strong>
            </div>
            <div>
              <span>Docs</span>
              {activeService.docsUrl ? (
                <a className="text-link" href={activeService.docsUrl} target="_blank" rel="noreferrer">
                  Open docs
                </a>
              ) : (
                <strong>Not linked</strong>
              )}
            </div>
            <div>
              <span>Endpoint</span>
              {activeService.url ? (
                <a className="text-link" href={activeService.url} target="_blank" rel="noreferrer">
                  Open service
                </a>
              ) : (
                <strong>Not linked</strong>
              )}
            </div>
          </div>
          <p className="service-detail-drawer__hint">
            How to debug issues for this service: capture failing requests, check logs with the prefilled filter,
            and loop in the listed owner if escalations are needed.
          </p>
          <div className="service-detail-drawer__footer">
            <button type="button" className="btn secondary" onClick={() => openLogs(activeService.id)}>
              View logs for this service
            </button>
          </div>
        </aside>
      )}
    </ContentShell>
  );
}
