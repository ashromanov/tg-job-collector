import { useEffect, useState } from "react";
import { type CV, listCVs } from "../api/cvs";
import { type Match, listMatches } from "../api/matches";
import { StatusBadge } from "../components/StatusBadge";
import { ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";

const PAGE_SIZE = 20;
const STATUSES = ["all", "pending", "outreach_sent", "outreach_pending", "skipped", "failed"];

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-700 bg-green-100";
  if (score >= 60) return "text-yellow-700 bg-yellow-100";
  return "text-red-700 bg-red-100";
}

function MatchCard({ match }: { match: Match }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      <div
        className="px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {match.job?.title ?? "Untitled Job"}
              </h3>
              {match.job?.company && (
                <span className="text-xs text-gray-500">
                  {match.job.company}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">
                CV: {match.cv?.name ?? match.cv_id}
              </span>
              <StatusBadge status={match.status} />
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span
              className={clsx(
                "inline-flex items-center justify-center w-12 h-8 rounded-lg text-sm font-bold",
                scoreColor(match.score)
              )}
            >
              {match.score}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(match.created_at).toLocaleDateString()}
            </span>
            {expanded ? (
              <ChevronUp size={14} className="text-gray-400" />
            ) : (
              <ChevronDown size={14} className="text-gray-400" />
            )}
          </div>
        </div>

        {!expanded && match.reasoning && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
            {match.reasoning}
          </p>
        )}
      </div>

      {expanded && match.reasoning && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
          <p className="text-xs font-medium text-gray-600 mb-2">Reasoning</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {match.reasoning}
          </p>
        </div>
      )}
    </div>
  );
}

export function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cvFilter, setCvFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [minScore, setMinScore] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    listCVs()
      .then((r) => setCvs(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setOffset(0);
    setMatches([]);
    setHasMore(true);
    fetchMatches(0, true);
  }, [cvFilter, statusFilter, minScore]);

  async function fetchMatches(off: number, replace: boolean) {
    replace ? setLoading(true) : setLoadingMore(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        limit: PAGE_SIZE,
        offset: off,
      };
      if (cvFilter !== "all") params.cv_id = cvFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      if (minScore > 0) params.min_score = minScore;
      const res = await listMatches(params);
      const data = res.data;
      setMatches((prev) => (replace ? data : [...prev, ...data]));
      setHasMore(data.length === PAGE_SIZE);
      setOffset(off + data.length);
    } catch {
      setError("Failed to load matches");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Matches</h1>
        <span className="text-sm text-gray-500">{matches.length} loaded</span>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={cvFilter}
          onChange={(e) => setCvFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">All CVs</option>
          {cvs.map((cv) => (
            <option key={cv.id} value={cv.id}>
              {cv.name}
            </option>
          ))}
        </select>

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

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 shrink-0">
            Min score: {minScore}
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-28 accent-blue-600"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          No matches found
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => fetchMatches(offset, false)}
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
