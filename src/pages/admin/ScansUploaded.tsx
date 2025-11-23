import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import ContentShell from "../../components/ContentShell";
import PageHeader from "../../components/PageHeader";
import { db } from "../../lib/firebase";

type UploadStatus = "success" | "failed" | "processing" | "queued" | "unknown";

type UploadRecord = {
  id: string;
  status: UploadStatus;
  uploaderId: string | null;
  uploaderName: string | null;
  guildId: string | null;
  guildName: string | null;
  uploadedAt: Date | null;
  processingMs: number | null;
  fileSizeBytes: number | null;
  errorCode: string | null;
};

const FALLBACK_RECORDS: UploadRecord[] = [
  {
    id: "sim-001",
    status: "success",
    uploaderId: "ops-01",
    uploaderName: "Ops – Mira",
    guildId: "guild-emerald",
    guildName: "Emerald Vanguard",
    uploadedAt: new Date(Date.now() - 10 * 60 * 1000),
    processingMs: 4200,
    fileSizeBytes: 3_100_000,
    errorCode: null,
  },
  {
    id: "sim-002",
    status: "failed",
    uploaderId: "ops-03",
    uploaderName: "Ops – Kaia",
    guildId: "guild-obsidian",
    guildName: "Obsidian Pact",
    uploadedAt: new Date(Date.now() - 45 * 60 * 1000),
    processingMs: 2900,
    fileSizeBytes: 3_320_000,
    errorCode: "pipeline/timeout",
  },
  {
    id: "sim-003",
    status: "processing",
    uploaderId: "ops-05",
    uploaderName: "Ops – Nira",
    guildId: "guild-aurora",
    guildName: "Aurora Syndicate",
    uploadedAt: new Date(Date.now() - 12 * 60 * 1000),
    processingMs: null,
    fileSizeBytes: 2_910_000,
    errorCode: null,
  },
  {
    id: "sim-004",
    status: "success",
    uploaderId: "ops-04",
    uploaderName: "Ops – Fynn",
    guildId: "guild-horizon",
    guildName: "Horizon Keep",
    uploadedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    processingMs: 5600,
    fileSizeBytes: 3_420_000,
    errorCode: null,
  },
  {
    id: "sim-005",
    status: "failed",
    uploaderId: "ops-01",
    uploaderName: "Ops – Mira",
    guildId: "guild-horizon",
    guildName: "Horizon Keep",
    uploadedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    processingMs: 6000,
    fileSizeBytes: 3_280_000,
    errorCode: "ingest/schema-mismatch",
  },
];

export default function AdminScansUploaded() {
  const [records, setRecords] = useState<UploadRecord[]>(FALLBACK_RECORDS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<UploadStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const coll = collection(db, "scanUploads");
      const q = query(coll, orderBy("uploadedAt", "desc"), limit(100));
      const snap = await getDocs(q);
      const fetched = snap.docs.map((doc) => normaliseRecord(doc.id, doc.data()));
      if (fetched.length > 0) {
        setRecords(fetched);
        setError(null);
      } else {
        setRecords(FALLBACK_RECORDS);
        setError("Keine Live-Daten gefunden, Fallback aktiv.");
      }
    } catch (err) {
      console.error("[ScansUploaded] Firestore fetch failed", err);
      setRecords(FALLBACK_RECORDS);
      setError("Live-Daten nicht verfügbar, Fallback aktiv.");
    } finally {
      if (isRefresh) setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData(false);
  }, [fetchData]);

  const stats = useMemo(() => buildStats(records), [records]);

  const filteredUploads = useMemo(() => {
    const queryText = searchTerm.toLowerCase().trim();
    return records.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (queryText && !`${row.id} ${row.uploaderName ?? ""} ${row.guildName ?? ""}`.toLowerCase().includes(queryText)) {
        return false;
      }
      return true;
    });
  }, [records, searchTerm, statusFilter]);

  const failures = filteredUploads.filter((row) => row.status === "failed");

  return (
    <ContentShell
      title="Scans uploaded"
      description="Operational analytics for ingestion volume, health, and failure recovery"
      headerContent={
        <PageHeader
          title="Scans uploaded"
          subtitle="Operational analytics for ingestion volume, health, and failure recovery"
          hintRight="Firestore snapshot • 100 items"
        />
      }
    >
      <div className="admin-top">
        <p className="admin-top__hint">
          {error ?? "Live snapshot geladen. Filterbar nach Status und Suchbegriff."}
        </p>
        <div className="admin-top__actions">
          <button type="button" className="btn secondary" onClick={() => void fetchData(true)}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="admin-filters">
        <label className="filter-control">
          <span>Status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as UploadStatus | "all")}>
            <option value="all">All</option>
            <option value="success">Success</option>
            <option value="processing">Processing</option>
            <option value="queued">Queued</option>
            <option value="failed">Failed</option>
          </select>
        </label>
        <label className="filter-control filter-control--grow">
          <span>Search by id/uploader/guild</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search text"
          />
        </label>
      </div>

      <div className="admin-summary">
        <div className="summary-card">
          <p>Total uploads</p>
          <strong>{formatNumber(stats.totalUploads)}</strong>
        </div>
        <div className="summary-card">
          <p>Success rate</p>
          <strong>{formatPercent(stats.successRate)}</strong>
        </div>
        <div className="summary-card">
          <p>Avg. processing</p>
          <strong>{stats.avgProcessingMs ? formatDuration(stats.avgProcessingMs) : "–"}</strong>
        </div>
        <div className="summary-card">
          <p>Failed</p>
          <strong>{formatNumber(stats.failed)}</strong>
        </div>
      </div>

      <section className="monitoring-panel">
        <header className="monitoring-panel__header">
          <div>
            <p className="monitoring-panel__eyebrow">Status mix</p>
            <h2>Pipeline status</h2>
          </div>
          <p className="monitoring-panel__meta">Anteil je Status innerhalb des Fensters</p>
        </header>
        <div className="monitoring-panel__grid">
          {stats.statusBreakdown.map((item) => (
            <div key={item.status}>
              <p className="monitoring-panel__label">{formatStatus(item.status)}</p>
              <p className="monitoring-panel__value">{formatNumber(item.count)}</p>
              <p className="monitoring-panel__meta">{formatPercent(item.share)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="monitoring-panel">
        <header className="monitoring-panel__header">
          <div>
            <p className="monitoring-panel__eyebrow">Recent failures</p>
            <h2>Letzte Fehlversuche</h2>
          </div>
          <p className="monitoring-panel__meta">Gefiltert nach Status</p>
        </header>
        <div className="log-table">
          {failures.map((row) => (
            <article key={row.id} className="log-row">
              <div className="log-row__head">
                <div>
                  <p className="user-id">{row.id}</p>
                  <p className="log-row__service">{row.errorCode ?? "Unknown issue"}</p>
                </div>
                <span className="log-badge log-badge--error">{formatStatus(row.status)}</span>
              </div>
              <div className="log-row__body">
                <span className="log-row__timestamp">Uploader: {row.uploaderName ?? row.uploaderId ?? "?"}</span>
                <span className="log-row__timestamp">Guild: {row.guildName ?? row.guildId ?? "?"}</span>
                <span className="log-row__timestamp">
                  Processing: {row.processingMs ? formatDuration(row.processingMs) : "Pending"}
                </span>
              </div>
            </article>
          ))}
          {failures.length === 0 && (
            <div className="placeholder-card">
              <p>No failed uploads in this view.</p>
            </div>
          )}
        </div>
      </section>

      <section className="monitoring-panel">
        <header className="monitoring-panel__header">
          <div>
            <p className="monitoring-panel__eyebrow">Latest activity</p>
            <h2>Uploads</h2>
          </div>
          <p className="monitoring-panel__meta">
            {loading ? "Loading…" : `${filteredUploads.length} records`}
          </p>
        </header>
        <div className="log-table">
          {filteredUploads.map((row) => (
            <article key={row.id} className="log-row">
              <div className="log-row__head">
                <div>
                  <p className="user-id">{row.id}</p>
                  <p className="log-row__service">{row.uploaderName ?? row.uploaderId ?? "Unknown uploader"}</p>
                </div>
                <span className="log-badge" style={{ borderColor: statusColor(row.status), color: statusColor(row.status) }}>
                  {formatStatus(row.status)}
                </span>
              </div>
              <div className="log-row__body">
                <span className="log-row__timestamp">Guild: {row.guildName ?? row.guildId ?? "Unknown guild"}</span>
                <span className="log-row__timestamp">
                  Uploaded: {row.uploadedAt ? row.uploadedAt.toLocaleString() : "Unknown"}
                </span>
              </div>
              <div className="log-row__body">
                <span className="log-row__message">
                  Processing: {row.processingMs ? formatDuration(row.processingMs) : "Pending"} • File size: {row.fileSizeBytes ? formatFileSize(row.fileSizeBytes) : "?"}
                </span>
              </div>
            </article>
          ))}
          {filteredUploads.length === 0 && (
            <div className="placeholder-card">
              <p>No uploads match your filters.</p>
            </div>
          )}
        </div>
      </section>
    </ContentShell>
  );
}

function normaliseRecord(id: string, raw: Record<string, unknown>): UploadRecord {
  const status = normaliseStatus(raw.status);
  return {
    id,
    status,
    uploaderId: typeof raw.uploaderId === "string" ? raw.uploaderId : null,
    uploaderName: typeof raw.uploaderName === "string" ? raw.uploaderName : null,
    guildId: typeof raw.guildId === "string" ? raw.guildId : null,
    guildName: typeof raw.guildName === "string" ? raw.guildName : null,
    uploadedAt: raw.uploadedAt instanceof Timestamp
      ? raw.uploadedAt.toDate()
      : raw.uploadedAt instanceof Date
        ? raw.uploadedAt
        : null,
    processingMs: typeof raw.processingMs === "number" ? raw.processingMs : null,
    fileSizeBytes: typeof raw.fileSizeBytes === "number" ? raw.fileSizeBytes : null,
    errorCode: typeof raw.errorCode === "string" ? raw.errorCode : null,
  };
}

function normaliseStatus(status: unknown): UploadStatus {
  if (status === "success" || status === "failed" || status === "processing" || status === "queued") {
    return status;
  }
  return "unknown";
}

function buildStats(records: UploadRecord[]) {
  const counts = new Map<UploadStatus, number>();
  let processingSum = 0;
  let processingCount = 0;
  let failed = 0;
  let success = 0;
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  let last24h = 0;

  records.forEach((row) => {
    counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
    if (row.status === "failed") failed += 1;
    if (row.status === "success") success += 1;
    if (row.processingMs != null) {
      processingSum += row.processingMs;
      processingCount += 1;
    }
    if (row.uploadedAt && row.uploadedAt.getTime() >= dayAgo) {
      last24h += 1;
    }
  });

  const totalUploads = records.length;
  const statusBreakdown = Array.from(counts.entries()).map(([status, count]) => ({
    status,
    count,
    share: totalUploads ? count / totalUploads : 0,
  }));

  return {
    totalUploads,
    last24h,
    successRate: totalUploads ? success / totalUploads : 0,
    failed,
    avgProcessingMs: processingCount ? processingSum / processingCount : null,
    statusBreakdown,
  };
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: value > 0 && value < 0.1 ? 1 : 0,
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatFileSize(bytes: number): string {
  if (bytes <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatStatus(status: UploadStatus): string {
  switch (status) {
    case "success":
      return "Success";
    case "failed":
      return "Failed";
    case "processing":
      return "Processing";
    case "queued":
      return "Queued";
    default:
      return "Unknown";
  }
}

function statusColor(status: UploadStatus): string {
  switch (status) {
    case "success":
      return "#5CC689";
    case "failed":
      return "#FF6B6B";
    case "processing":
      return "#F9A825";
    case "queued":
      return "#5C8BC6";
    default:
      return "#8AA5C4";
  }
}
