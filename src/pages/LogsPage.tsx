import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import ContentShell from "../components/ContentShell";
import PageHeader from "../components/PageHeader";
import { coreServices } from "../config/services";
import { useAdminLogs } from "../hooks/useAdminLogs";
import type { LogEntry, LogLevel, LogServiceId } from "../config/logs";

type TimeRangeValue = "1h" | "24h" | "7d" | "all";

const serviceOptions: { label: string; value: LogServiceId | "all" }[] = [
  { label: "All services", value: "all" },
  { label: "Auth API", value: "auth-api" },
  { label: "Scan Import API", value: "scan-import-api" },
  { label: "Firestore Database", value: "firestore" },
  { label: "GoatCounter Analytics", value: "goatcounter" },
  { label: "Other", value: "other" },
];

const levelOptions: { label: string; value: LogLevel | "all" }[] = [
  { label: "All levels", value: "all" },
  { label: "Errors", value: "error" },
  { label: "Warnings", value: "warning" },
  { label: "Info", value: "info" },
];

const timeOffsets: Record<TimeRangeValue, number | null> = {
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  all: null,
};

const timeOptions: { label: string; value: TimeRangeValue }[] = [
  { label: "Last hour", value: "1h" },
  { label: "Last 24 hours", value: "24h" },
  { label: "Last 7 days", value: "7d" },
  { label: "All time", value: "all" },
];

const serviceNameMap = Object.fromEntries(coreServices.map((service) => [service.id, service.name])) as Record<
  LogServiceId,
  string
>;

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const day = date.toISOString().slice(0, 10);
  const time = date.toISOString().slice(11, 16);
  return `${day} - ${time}`;
}

export default function LogsPage() {
  const location = useLocation();
  const defaultFilters = (location.state as { defaultFilters?: { service?: LogServiceId | "all"; level?: LogLevel | "all" } })?.defaultFilters ?? {};
  const [serviceFilter, setServiceFilter] = useState<LogServiceId | "all">(defaultFilters.service ?? "all");
  const [levelFilter, setLevelFilter] = useState<LogLevel | "all">(defaultFilters.level ?? "all");
  const [timeFilter, setTimeFilter] = useState<TimeRangeValue>("24h");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const { logs, loading, error, hasMore, loadMore, reload } = useAdminLogs();

  const filteredLogs = useMemo(() => {
    const now = Date.now();
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return logs.filter((log) => {
      if (serviceFilter !== "all" && log.service !== serviceFilter) {
        return false;
      }
      if (levelFilter !== "all" && log.level !== levelFilter) {
        return false;
      }
      const offset = timeOffsets[timeFilter];
      if (offset !== null) {
        const timestamp = Date.parse(log.timestamp);
        if (Number.isNaN(timestamp) || timestamp < now - offset) {
          return false;
        }
      }
      if (normalizedSearch && !log.message.toLowerCase().includes(normalizedSearch)) {
        return false;
      }
      return true;
    });
  }, [logs, serviceFilter, levelFilter, timeFilter, searchTerm]);

  const counts = useMemo(
    () => ({
      error: filteredLogs.filter((log) => log.level === "error").length,
      warning: filteredLogs.filter((log) => log.level === "warning").length,
      info: filteredLogs.filter((log) => log.level === "info").length,
    }),
    [filteredLogs],
  );

  return (
    <ContentShell
      title="Logs"
      description="Inspect errors, warnings and info across SFDataHub services"
      headerContent={
        <PageHeader
          title="Logs"
          subtitle="Inspect errors, warnings and info across SFDataHub services"
          hintRight="Live audit log feed from auth-api"
        />
      }
    >
      <div className="logs-filters">
        <label className="filter-control">
          <span>Service</span>
          <select value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value as LogServiceId | "all")}>
            {serviceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-control">
          <span>Level</span>
          <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value as LogLevel | "all")}>
            {levelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-control">
          <span>Time range</span>
          <select value={timeFilter} onChange={(event) => setTimeFilter(event.target.value as TimeRangeValue)}>
            {timeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-control">
          <span>Search message</span>
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search text" />
        </label>
      </div>

      <div className="logs-summary">
        <div className="summary-card">
          <p>Errors</p>
          <strong>{counts.error}</strong>
        </div>
        <div className="summary-card">
          <p>Warnings</p>
          <strong>{counts.warning}</strong>
        </div>
        <div className="summary-card">
          <p>Info</p>
          <strong>{counts.info}</strong>
        </div>
      </div>

      {error && (
        <div className="logs-error">
          <p>{error}</p>
        </div>
      )}

      <div className="logs-actions">
        <button type="button" className="btn secondary" onClick={reload} disabled={loading}>
          Refresh
        </button>
      </div>

      <div className="log-table">
        {loading && logs.length === 0 ? (
          <p className="logs-empty">Loading logs…</p>
        ) : filteredLogs.length === 0 ? (
          <p className="logs-empty">No logs for the selected filters</p>
        ) : (
          filteredLogs.map((log) => (
            <button
              type="button"
              key={log.id}
              className="log-row"
              onClick={() => setSelectedLog(log)}
            >
              <div className="log-row__head">
                <span className="log-row__timestamp">{formatTimestamp(log.timestamp)}</span>
                <span className={`log-badge log-badge--${log.level}`}>{log.level}</span>
              </div>
              <div className="log-row__body">
                <span className="log-row__service">{serviceNameMap[log.service] ?? "Other"}</span>
                <span className="log-row__message">{log.message}</span>
              </div>
            </button>
          ))
        )}
      </div>

      {hasMore && (
        <div className="logs-load-more">
          <button type="button" className="btn secondary" onClick={loadMore} disabled={loading}>
            Load more
          </button>
        </div>
      )}

      {selectedLog && (
        <div className="log-modal" role="dialog" aria-modal="true">
          <div className="log-modal__content">
            <div className="log-modal__header">
              <div>
                <p className="log-modal__eyebrow">{selectedLog.level.toUpperCase()}</p>
                <h2>{selectedLog.message}</h2>
              </div>
              <button type="button" className="btn secondary" onClick={() => setSelectedLog(null)}>
                Close
              </button>
            </div>
            <div className="log-modal__body">
              <p>
                <strong>Timestamp:</strong> {formatTimestamp(selectedLog.timestamp)}
              </p>
              <p>
                <strong>Service:</strong> {serviceNameMap[selectedLog.service] ?? "Other"}
              </p>
              {selectedLog.details && (
                <div>
                  <p className="log-modal__section-title">Details</p>
                  <p>{selectedLog.details}</p>
                </div>
              )}
              {selectedLog.context != null && (
                <div>
                  <p className="log-modal__section-title">Context</p>
                  <pre>{JSON.stringify(selectedLog.context, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </ContentShell>
  );
}
