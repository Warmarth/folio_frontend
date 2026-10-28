"use client";

import { useEffect, useState } from "react";
import { codeReview } from "@/lib/api/serverRequests";
import SubmissionChat from "@/app/components/SubmissionChat";
import CallButtons from "@/app/components/CallButtons";
import { MySubmission, MySubmissionDetail } from "@/types/learners/codeReview";

function Detail({ submissionId }: { submissionId: string }) {
  const [loadResult, setLoadResult] = useState<
    { submissionId: string; submission: MySubmissionDetail } |
    { submissionId: string; error: string } |
    null
  >(null);
  const [chat, setChat] = useState<{ submissionId: string; open: boolean } | null>(
    null,
  );
  const result = loadResult?.submissionId === submissionId ? loadResult : null;
  const loading = result === null;
  const submission = result && "submission" in result ? result.submission : null;
  const chatOpen = chat?.submissionId === submissionId && chat.open;

  useEffect(() => {
    let cancelled = false;
    codeReview
      .getOne(submissionId)
      .then((res) => {
        if (!cancelled) setLoadResult({ submissionId, submission: res.data });
      })
      .catch(() => {
        if (!cancelled)
          setLoadResult({ submissionId, error: "Could not load this submission." });
      });
    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  if (loading)
    return (
      <div className="rounded-lg border border-black/10 bg-white p-6 text-sm text-black/50">
        Loading...
      </div>
    );
  if (!submission) {
    return (
      <div className="rounded-lg border border-black/10 bg-white p-6 text-sm text-red-600">
        {result && "error" in result ? result.error : "Not found."}
      </div>
    );
  }

  // The server sends "Passed 3 of 4 tests." and, when available, the AI's note after a blank line.
  const [summary, ...noteParts] = (submission.feedback ?? "").split("\n\n");
  const aiNote = noteParts.join("\n\n").trim();
  const tests = submission.test_results ?? [];

  return (
    <div className="space-y-6 rounded-lg border border-black/10 bg-white p-6">
      <header>
        <h2 className="text-2xl font-serif">{submission.exercise_name}</h2>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-[#1f1b16] px-3 py-1 text-[#f3efe3]">
            {submission.language}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-white ${submission.is_completed ? "bg-green-600" : "bg-red-600"}`}
          >
            {submission.is_completed ? "Tests passed" : "Tests failing"}
          </span>
          {submission.reviewed_at && (
            <span className="rounded-full border border-black/20 px-3 py-1">
              Reviewed by your mentor
            </span>
          )}
          {submission.submitted_at && (
            <span className="rounded-full border border-black/20 px-3 py-1">
              {new Date(submission.submitted_at).toLocaleString()}
            </span>
          )}
        </div>
      </header>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Your code</h3>
        <pre className="max-h-96 overflow-auto rounded bg-[#1e1e1e] p-4 font-mono text-sm text-white/90">
          {submission.answer}
        </pre>
      </section>

      {tests.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold">
            Tests{" "}
            {summary && (
              <span className="font-normal text-black/50">· {summary}</span>
            )}
          </h3>
          <ul className="space-y-2 text-sm">
            {tests.map((t, i) => (
              <li key={t.test_id}>
                <div className={t.passed ? "text-green-700" : "text-red-700"}>
                  {t.passed ? "✓" : "✗"} Test {i + 1}
                  {t.is_hidden && (
                    <span className="text-black/40"> (hidden)</span>
                  )}
                </div>
                {!t.passed && !t.is_hidden && (
                  <div className="ml-5 mt-1 space-y-1 font-mono text-xs text-black/70">
                    <div>Got: {t.actual_output || "(nothing)"}</div>
                    {t.stderr && (
                      <pre className="whitespace-pre-wrap text-red-700">
                        {t.stderr}
                      </pre>
                    )}
                    {t.timed_out && (
                      <div className="text-amber-700">Time limit reached</div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-sm font-semibold">AI feedback</h3>
        {aiNote ? (
          <p className="whitespace-pre-wrap rounded border border-black/10 bg-black/5 p-3 text-sm">
            {aiNote}
          </p>
        ) : (
          <p className="text-sm text-black/50">
            No AI feedback for this submission.
          </p>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">
          Mentor feedback
          {submission.mentor_name ? (
            <span className="font-normal text-black/50">
              {" "}
              · {submission.mentor_name}
            </span>
          ) : null}
        </h3>
        {submission.mentor_comment ? (
          <p className="whitespace-pre-wrap rounded border border-black/10 bg-black/5 p-3 text-sm">
            {submission.mentor_comment}
          </p>
        ) : (
          <p className="text-sm text-black/50">
            {submission.reviewed_at
              ? "Your mentor reviewed this without leaving a note."
              : "Your mentor hasn't reviewed this yet."}
          </p>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">
          Talk to {submission.mentor_name ?? "your mentor"}
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              setChat({ submissionId, open: !chatOpen })
            }
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            {chatOpen ? "Close chat" : "Chat"}
          </button>
          <CallButtons call={submission.call} />
        </div>
        {chatOpen && (
          <div className="mt-3">
            <SubmissionChat submissionId={submission.id} />
          </div>
        )}
      </section>
    </div>
  );
}

export default function CodeReviewPage() {
  const [rows, setRows] = useState<MySubmission[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadResult, setLoadResult] = useState<
    { page: number; error?: string } | null
  >(null);
  const loading = loadResult?.page !== page;
  const error = loadResult?.page === page ? loadResult.error ?? "" : "";

  useEffect(() => {
    let cancelled = false;
    codeReview
      .getMine(page)
      .then((res) => {
        if (cancelled) return;
        setRows(res.data);
        setHasNext(res.pagination.has_next);
        setHasPrev(res.pagination.has_prev);
        setLoadResult({ page });
      })
      .catch(() => {
        if (!cancelled)
          setLoadResult({ page, error: "Could not load your submissions." });
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <main className="min-h-screen bg-[#f3efe3] p-8">
      <h1 className="text-3xl font-serif">Code review</h1>
      <p className="mt-2 text-black/60">
        Your submitted code, the feedback on it, and a way to reach your mentor.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <section className="space-y-2">
          {loading && <p className="text-sm text-black/50">Loading...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!loading && !error && rows.length === 0 && (
            <p className="rounded-lg border border-dashed border-black/20 p-6 text-center text-sm text-black/50">
              Nothing to review yet. Submit an exercise and it will appear here.
            </p>
          )}

          {rows.map((row) => (
            <button
              key={row.id}
              onClick={() => setSelectedId(row.id)}
              className={`block w-full rounded-lg border bg-white p-3 text-left hover:border-black/40 ${
                selectedId === row.id ? "border-black" : "border-black/10"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium">
                  {row.exercise_name}
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
              <div className="mt-1 flex items-center justify-between text-xs text-black/40">
                <span>
                  {row.submitted_at
                    ? new Date(row.submitted_at).toLocaleString()
                    : ""}
                </span>
                {row.reviewed_at && <span>Mentor reviewed</span>}
              </div>
            </button>
          ))}

          {(hasPrev || hasNext) && (
            <div className="flex items-center justify-between pt-2 text-sm">
              <button
                disabled={!hasPrev}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border bg-white px-3 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-black/50">Page {page}</span>
              <button
                disabled={!hasNext}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border bg-white px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </section>

        <section>
          {selectedId ? (
            <Detail submissionId={selectedId} />
          ) : (
            <div className="rounded-lg border border-dashed border-black/20 p-10 text-center text-sm text-black/50">
              Pick a submission to see your code and the feedback.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
