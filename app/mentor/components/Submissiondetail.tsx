"use client";

import { useEffect, useState } from "react";
import { mentorSubmittedExercise } from "@/lib/api/serverRequests";
import SubmissionChat from "@/app/components/SubmissionChat";
import CallButtons from "@/app/components/CallButtons";
import { SubmissionDetailData } from "@/types/mentors/menteeSubmission";

export default function SubmissionDetail({
  submissionId,
  onReviewed,
}: {
  submissionId: string;
  onReviewed: () => void;
}) {
  const [loadResult, setLoadResult] = useState<
    | { submissionId: string; submission: SubmissionDetailData }
    | { submissionId: string; error: string }
    | null
  >(null);
  const [reviewError, setReviewError] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const result = loadResult?.submissionId === submissionId ? loadResult : null;
  const loading = result === null;
  const submission =
    result && "submission" in result ? result.submission : null;

  useEffect(() => {
    let cancelled = false;
    mentorSubmittedExercise
      .getSubmission(submissionId)
      .then((res) => {
        if (cancelled) return;
        setLoadResult({ submissionId, submission: res.data });
        setComment(res.data.mentor_comment ?? "");
      })
      .catch(() => {
        if (!cancelled)
          setLoadResult({
            submissionId,
            error: "Could not load this submission.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  async function review() {
    setSaving(true);
    setReviewError("");
    setSaved(false);
    try {
      const res = await mentorSubmittedExercise.reviewSubmission(submissionId, comment);
      setLoadResult((current) =>
        current?.submissionId === submissionId
          ? { submissionId, submission: res.data }
          : current,
      );
      setSaved(true);
      onReviewed(); // refresh the list and the counts
    } catch {
      setReviewError("Could not save your review. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading...</div>;
  if (!submission) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-red-600">
        {result && "error" in result ? result.error : "Submission not found."}
      </div>
    );
  }

  // The server sends "Passed 3 of 4 tests." and, when available, the AI's note after a blank line.
  const [summary, ...noteParts] = (submission.feedback ?? "").split("\n\n");
  const aiNote = noteParts.join("\n\n").trim();
  const tests = submission.test_results ?? [];

  return (
    <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-6">
      <header>
        <p className="text-sm text-slate-500">{submission.exercise_name}</p>
        <h2 className="mt-1 text-xl font-bold">{submission.user_name ?? "Unknown learner"}</h2>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span
            className={`rounded-full px-3 py-1 text-white ${submission.is_completed ? "bg-green-600" : "bg-red-600"}`}
          >
            {submission.is_completed ? "Tests passed" : "Tests failing"}
          </span>
          {submission.reviewed_at && (
            <span className="rounded-full border border-slate-300 px-3 py-1">Reviewed</span>
          )}
          {submission.submitted_at && (
            <span className="rounded-full border border-slate-300 px-3 py-1">
              {new Date(submission.submitted_at).toLocaleString()}
            </span>
          )}
        </div>
      </header>

      {summary && <p className="text-sm text-slate-600">{summary}</p>}

      {aiNote && (
        <div className="rounded border border-slate-200 bg-slate-50 p-3">
          <div className="mb-1 text-xs text-slate-500">AI feedback the learner saw</div>
          <p className="whitespace-pre-wrap text-sm">{aiNote}</p>
        </div>
      )}

      <section>
        <h3 className="mb-2 text-sm font-semibold">Code</h3>
        <pre className="max-h-96 overflow-auto rounded bg-[#1e1e1e] p-4 font-mono text-sm text-white/90">
          {submission.answer}
        </pre>
      </section>

      {tests.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold">Tests</h3>
          <ul className="space-y-2">
            {tests.map((t, i) => (
              <li key={t.test_id} className="rounded border border-slate-200">
                <details open={!t.passed}>
                  <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm">
                    <span className={t.passed ? "text-green-600" : "text-red-600"}>{t.passed ? "✓" : "✗"}</span>
                    <span>Test {t.number ?? i + 1}</span>
                    {t.is_hidden && <span className="text-xs text-slate-500">(hidden from the learner)</span>}
                  </summary>
                  <div className="space-y-2 border-t border-slate-200 px-3 py-2 font-mono text-xs">
                    <div>
                      <div className="text-slate-500">Input</div>
                      <pre className="whitespace-pre-wrap">{t.stdin || "(none)"}</pre>
                    </div>
                    <div>
                      <div className="text-slate-500">Expected</div>
                      <pre className="whitespace-pre-wrap">{t.expected_output}</pre>
                    </div>
                    <div>
                      <div className="text-slate-500">Got</div>
                      <pre className="whitespace-pre-wrap">{t.actual_output || "(nothing)"}</pre>
                    </div>
                    {t.stderr && <pre className="whitespace-pre-wrap text-red-600">{t.stderr}</pre>}
                    {t.timed_out && <div className="text-amber-600">Time limit reached</div>}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-sm font-semibold">Your review</h3>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="A note for the learner (optional)"
          className="w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
        />
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={review}
            disabled={saving}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Saving..." : submission.reviewed_at ? "Update review" : "Mark as reviewed"}
          </button>
          {saved && <span className="text-sm text-green-600">Saved</span>}
          {reviewError && <span className="text-sm text-red-600">{reviewError}</span>}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Talk to {submission.user_name ?? "the learner"}</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setChatOpen((o) => !o)}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            {chatOpen ? "Close chat" : "Chat"}
          </button>
          {submission.call && <CallButtons call={submission.call} />}
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
