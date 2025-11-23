import { Link } from "react-router-dom";
import ContentShell from "../components/ContentShell";
import { coreServices } from "../config/services";
import type { Service } from "../config/services";

const serviceStatus: Record<string, { label: string; tone: "ok" | "warning" | "unknown" }> = {
  "auth-api": { label: "OK", tone: "ok" },
  "scan-import-api": { label: "Unknown", tone: "unknown" },
  firestore: { label: "OK", tone: "ok" },
  goatcounter: { label: "OK", tone: "ok" },
};

const serviceKindLabels: Record<Service["kind"], string> = {
  api: "API",
  db: "DB",
  analytics: "Analytics",
};

const errorsSummary = {
  errorsLast24h: 3,
  warningsLast24h: 12,
  lastError: {
    timestamp: "Nov 22, 2025 · 09:14 UTC",
    service: "Scan Import API",
  },
};

export default function DashboardPage() {
  return (
    <ContentShell
      title="SFDataHub Control Panel"
      description="Overview of services, errors and analytics"
    >
      <div className="dashboard-meta">
        <span className="env-badge">STAGING</span>
      </div>

      <div className="service-grid">
        {coreServices.map((service) => {
          const status = serviceStatus[service.id] ?? { label: "Unknown", tone: "unknown" };
          return (
            <article key={service.id} className="service-card">
              <div className="service-card__head">
                <div>
                  <p className="service-card__name">{service.name}</p>
                  <p className="service-card__desc">{service.description}</p>
                </div>
                <span className={`status-badge status-badge--${status.tone}`}>{status.label}</span>
              </div>
              <div className="service-card__tags">
                <span className="kind-pill kind-pill--light">
                  {serviceKindLabels[service.kind]}
                </span>
                <span className="kind-pill">{service.kind.toUpperCase()}</span>
              </div>
              <div className="service-card__actions">
                <Link className="text-link" to="/apis">
                  View in APIs & Services
                </Link>
                {service.url ? (
                  <a className="text-link" href={service.url} target="_blank" rel="noreferrer">
                    Open service
                  </a>
                ) : (
                  <span className="text-link text-link--muted">Endpoint TBD</span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <section className="monitoring-panel">
        <header className="monitoring-panel__header">
          <div>
            <p className="monitoring-panel__eyebrow">Errors & Logs</p>
            <h2>System insight</h2>
          </div>
          <Link className="btn secondary" to="/logs">
            Open Logs
          </Link>
        </header>
        <div className="monitoring-panel__grid">
          <div>
            <p className="monitoring-panel__label">Errors last 24h</p>
            <p className="monitoring-panel__value">{errorsSummary.errorsLast24h}</p>
          </div>
          <div>
            <p className="monitoring-panel__label">Warnings last 24h</p>
            <p className="monitoring-panel__value">{errorsSummary.warningsLast24h}</p>
          </div>
          <div>
            <p className="monitoring-panel__label">Last error</p>
            <p className="monitoring-panel__value">
              {errorsSummary.lastError.timestamp}
            </p>
            <p className="monitoring-panel__meta">Service: {errorsSummary.lastError.service}</p>
          </div>
        </div>
      </section>

      <section className="service-detail-panel">
        <div className="service-detail-panel__header">
          <p className="monitoring-panel__eyebrow">What does each API do?</p>
          <h2>Service catalog</h2>
        </div>
        <div className="service-detail-panel__list">
          {coreServices.map((service) => (
            <article key={service.id} className="service-detail-panel__card">
              <div className="service-detail-panel__row">
                <div>
                  <p className="service-detail-panel__name">{service.name}</p>
                  <p className="service-detail-panel__kind">{serviceKindLabels[service.kind]}</p>
                </div>
                {service.url ? (
                  <a className="text-link" href={service.url} target="_blank" rel="noreferrer">
                    Visit endpoint
                  </a>
                ) : (
                  <span className="text-link text-link--muted">URL TBD</span>
                )}
              </div>
              <p className="service-detail-panel__desc">{service.description}</p>
            </article>
          ))}
        </div>
      </section>
    </ContentShell>
  );
}
