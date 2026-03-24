import { useEffect, useRef, useState } from "react";
import { type Job, listJobs } from "../api/jobs";
import { StatusBadge } from "../components/StatusBadge";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MapPin,
  Building2,
} from "lucide-react";

const EXTRACTION_STATUSES = [
  "all",
  "done",
  "pending",
  "failed",
  "skipped",
];

const PAGE_SIZE = 20;

function formatSalary(job: Job): string | null {
  if (!job.salary_min && !job.salary_max) return null;
  const currency = job.salary_currency ?? "";
  if (job.salary_min && job.salary_max) {
    return `${job.salary_min.toLocaleString()}–${job.salary_max.toLocaleString()} ${currency}`.trim();
  }
  if (job.salary_min) return `from ${job.salary_min.toLocaleString()} ${currency}`.trim();
  return `up to ${job.salary_max!.toLocaleString()} ${currency}`.trim();
}

function JobCard({ job }: { job: Job }) {
  const [expanded, setExpanded] = useState(false);
  const salary = formatSalary(job);

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
                {job.title ?? "Untitled"}
              </h3>
              <StatusBadge status={job.extraction_status} />
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
              {job.company && (
                <span className="flex items-center gap-1">
                  <Building2 size={12} />
                  {job.company}
                </span>
              )}
              {(job.city || job.country) && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {[job.city, job.country].filter(Boolean).join(", ")}
                  {job.is_remote && " (remote)"}
                </span>
              )}
              {job.is_remote && !job.city && !job.country && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  Remote
                </span>
              )}
              {salary && <span className="text-green-700 font-medium">{salary}</span>}
              {job.employment_type && <span>{job.employment_type}</span>}
              {job.experience_level && <span>{job.experience_level}</span>}
            </div>

            {job.tech_stack.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-2">
                {job.tech_stack.map((t) => (
                  <span
                    key={t}
                    className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {job.post_link && (
              <a
                href={job.post_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-gray-400 hover:text-blue-600 transition-colors"
              >
                <ExternalLink size={14} />
              </a>
            )}
            <span className="text-xs text-gray-400">
              {job.post_date
                ? new Date(job.post_date).toLocaleDateString()
                : new Date(job.created_at).toLocaleDateString()}
            </span>
            {expanded ? (
              <ChevronUp size={14} className="text-gray-400" />
            ) : (
              <ChevronDown size={14} className="text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-3">
          {(job.tg_contact ||
            job.emails.length > 0 ||
            job.phones.length > 0 ||
            job.apply_links.length > 0) && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">
                Contact / Apply
              </p>
              <div className="flex flex-wrap gap-2">
                {job.tg_contact && (
                  <a
                    href={`https://t.me/${job.tg_contact.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {job.tg_contact}
                  </a>
                )}
                {job.emails.map((e) => (
                  <a
                    key={e}
                    href={`mailto:${e}`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {e}
                  </a>
                ))}
                {job.phones.map((p) => (
                  <span key={p} className="text-xs text-gray-600">
                    {p}
                  </span>
                ))}
                {job.apply_links.map((l) => (
                  <a
                    key={l}
                    href={l}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Apply link
                  </a>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">
              Raw post text
            </p>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap bg-white border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
              {job.raw_text}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  useEffect(() => {
    setOffset(0);
    setJobs([]);
    setHasMore(true);
    fetchJobs(0, true);
  }, [debouncedSearch, statusFilter]);

  async function fetchJobs(off: number, replace: boolean) {
    replace ? setLoading(true) : setLoadingMore(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        limit: PAGE_SIZE,
        offset: off,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== "all") params.extraction_status = statusFilter;
      const res = await listJobs(params);
      const data = res.data;
      setJobs((prev) => (replace ? data : [...prev, ...data]));
      setHasMore(data.length === PAGE_SIZE);
      setOffset(off + data.length);
    } catch {
      setError("Failed to load jobs");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function loadMore() {
    fetchJobs(offset, false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Jobs</h1>
        <span className="text-sm text-gray-500">{jobs.length} loaded</span>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by title or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {EXTRACTION_STATUSES.map((s) => (
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
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          No jobs found
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={loadMore}
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
