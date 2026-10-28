"use client";

import { useEffect, useState } from "react";
import NavItem from "../components/NavItem";
import SubmissionDetail from "../components/Submissiondetail";
import { mentorSubmittedExercise } from "@/lib/api/serverRequests";
import {
  SubmissionFilter,
  SubmittedExercise,
  SubmissionPagination,
} from "@/types/mentors/menteeSubmission";

const filters: { id: SubmissionFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "To review" },
  { id: "fail", label: "Tests failing" },
  { id: "done", label: "Done" },
];

export default function Submission() {
  const [filter, setFilter] = useState<SubmissionFilter>("all");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<SubmittedExercise[]>([]);
  const [pagination, setPagination] = useState<SubmissionPagination | null>(
    null,
  );
  const [counts, setCounts] = useState<Record<SubmissionFilter, number>>({
    all: 0,
    pending: 0,
    fail: 0,
    done: 0,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0); // bump to reload after a review
  const requestKey = `${filter}:${page}:${refresh}`;
  const [loadResult, setLoadResult] = useState<
    { key: string; error?: string } | null
  >(null);
  const loading = loadResult?.key !== requestKey;
  const error = loadResult?.key === requestKey ? loadResult.error ?? "" : "";

  useEffect(() => {
    let cancelled = false;
    mentorSubmittedExercise
      .getAllSubmitted(filter, page)
      .then((res) => {
        if (cancelled) return;
        setRows(res.data);
        setCounts(res.counts);
        setPagination(res.pagination);
        setLoadResult({ key: requestKey });
      })
      .catch(() => {
        if (!cancelled)
          setLoadResult({ key: requestKey, error: "Could not load submissions." });
      });
    return () => {
      cancelled = true;
    };
  }, [filter, page, refresh, requestKey]);

  function chooseFilter(next: SubmissionFilter) {
    setFilter(next);
    setPage(1);
    setSelectedId(null);
  }

  return (
    <>
      <aside className="rounded-lg border border-slate-200 bg-white">
        <header className="px-4 pt-4 pb-3">
          <h2 className="text-lg font-bold">Submissions</h2>
          <p className="text-sm text-slate-500">
            {counts.pending === 0
              ? "Nothing waiting for your review"
              : `${counts.pending} waiting for your review`}
          </p>
        </header>

        <ul className="flex flex-col flex-wrap gap-1 px-3 pb-3 text-sm">
          {filters.map((f) => (
            <NavItem
              key={f.id}
              icon={null}
              label={`${f.label} (${counts[f.id]})`}
              active={filter === f.id}
              onClick={() => chooseFilter(f.id)}
            />
          ))}
        </ul>
      </aside>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* List */}
        <section className="space-y-2">
          {loading && <p className="p-3 text-sm text-slate-500">Loading...</p>}
          {error && <p className="p-3 text-sm text-red-600">{error}</p>}
          {!loading && !error && rows.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              No submissions here yet.
            </p>
          )}

          {rows.map((row) => (
            <button
              key={row.id}
              onClick={() => setSelectedId(row.id)}
              className={`block w-full rounded-lg border bg-white p-3 text-left hover:border-slate-400 ${
                selectedId === row.id ? "border-black" : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium">
                  {row.user_name ?? "Unknown learner"}
                </span>
                {row.total_tests > 0 && (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs text-white ${
                      row.is_completed ? "bg-green-600" : "bg-red-600"
                    }`}
                  >
                    {row.passed_tests}/{row.total_tests}
                  </span>
                )}
              </div>
              <div className="mt-1 truncate text-sm text-slate-500">
                {row.exercise_name}
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {row.submitted_at
                    ? new Date(row.submitted_at).toLocaleString()
                    : ""}
                </span>
                {row.reviewed_at && <span>Reviewed</span>}
              </div>
            </button>
          ))}

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-2 text-sm">
              <button
                disabled={!pagination.has_prev}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border px-3 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-slate-500">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                disabled={!pagination.has_next}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </section>

        {/* Detail */}
        <section>
          {selectedId ? (
            <SubmissionDetail
              key={selectedId}
              submissionId={selectedId}
              onReviewed={() => setRefresh((n) => n + 1)}
            />
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
              Pick a submission to see the code and test results.
            </div>
          )}
        </section>
      </div>
    </>
  );
}
