import { useCallback, useEffect, useState } from "react";

import type { LogEntry } from "../config/logs";
import { fetchAdminLogs } from "../lib/adminLogsApi";

const LOG_PAGE_LIMIT = 200;

export function useAdminLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAdminLogs({ limit: LOG_PAGE_LIMIT });
      setLogs(result.items);
      setNextCursor(result.nextCursor);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load logs.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor) {
      return;
    }
    setError(null);
    try {
      const result = await fetchAdminLogs({ limit: LOG_PAGE_LIMIT, cursor: nextCursor });
      setLogs((previous) => [...previous, ...result.items]);
      setNextCursor(result.nextCursor);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load logs.";
      setError(message);
    }
  }, [nextCursor]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  return {
    logs,
    loading,
    error,
    loadMore,
    hasMore: Boolean(nextCursor),
    reload: loadInitial,
  };
}
