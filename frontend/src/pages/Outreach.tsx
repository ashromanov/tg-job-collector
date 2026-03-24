import { useEffect, useState } from "react";
import { type OutreachLog, listOutreach, retryOutreach } from "../api/outreach";
import { StatusBadge } from "../components/StatusBadge";
import { RefreshCw } from "lucide-react";

const PAGE_SIZE = 20;
const STATUSES = ["all", "sent", "failed", "pending"];

export function Outreach() {
  const [logs, setLogs] = useState<OutreachLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [retrying, setRetrying] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    setOffset(0);
    setLogs([]);
    setHasMore(true);
    fetchLogs(0, true);
  }, [statusFilter]);

  async function fetchLogs(off: number, replace: boolean) {
    replace ? setLoading(true) : setLoadingMore(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        limit: String(PAGE_SIZE),
        offset: String(off),
      };
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await listOutreach(params);
      const data = res.data;
      setLogs((prev) => (replace ? data : [...prev, ...data]));
      setHasMore(data.length === PAGE_SIZE);
      setOffset(off + data.length);
    } catch {
      setError("Failed to load outreach logs");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  async function handleRetry(id: string) {
    setRetrying((prev) => new Set(prev).add(id));
    try {
      await retryOutreach(id);
      setLogs((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: "pending" } : l))
      );
    } catch {
      setError("Failed to retry outreach");
    } finally {
      setRetrying((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Outreach</h1>
        <span className="text-sm text-gray-500">{logs.length} loaded</span>
      </div>

      <div className="flex gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          No outreach logs
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="border border-gray-200 rounded-lg bg-white overflow-hidden"
            >
              <div
                className="px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpanded(log.id)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {log.tg_contact}
                      </span>
                      <StatusBadge status={log.status} />
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {log.message_text}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {log.sent_at && (
                      <span className="text-xs text-gray-400">
                        {new Date(log.sent_at).toLocaleDateString()}
                      </span>
                    )}
                    {log.status === "failed" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRetry(log.id);
                        }}
                        disabled={retrying.has(log.id)}
                        className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 border border-orange-200 rounded-md px-2 py-1 disabled:opacity-50"
                      >
                        <RefreshCw
                          size={11}
                          className={retrying.has(log.id) ? "animate-spin" : ""}
                        />
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {expanded.has(log.id) && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      Full message
                    </p>
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap bg-white border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                      {log.message_text}
                    </pre>
                  </div>

                  {log.error_msg && (
                    <div>
                      <p className="text-xs font-medium text-red-600 mb-1">
                        Error
                      </p>
                      <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                        {log.error_msg}
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-gray-400">
                    Match ID: {log.match_id}
                  </div>
                </div>
              )}
            </div>
          ))}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => fetchLogs(offset, false)}
                disabled={loadingMore}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
