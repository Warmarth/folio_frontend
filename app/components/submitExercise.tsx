"use client";

import { useCallback, useEffect, useState } from "react";
import {
  SubmissionType,
  SubmitExerciseProps,
} from "@/types/learners/submitExercise";
import { submitExerciseFunction } from "@/lib/api/mentors";

interface DataProp {
  message?: string;
  submission?: SubmissionType;
}

export default function SubmitExercise({ exerciseId }: SubmitExerciseProps) {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSubmission, setCheckingSubmission] = useState(true);
  const [submission, setSubmission] = useState<SubmissionType | null>(null);
  const [error, setError] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!answer.trim()) {
      setError("Please enter an answer.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = (await submitExerciseFunction.postExercise(exerciseId, {
        answer: answer.trim(),
      })) as DataProp;

      setSubmission(data.submission ?? {});
      setHasSubmitted(true);
      setAnswer("");
    } catch (error) {
      console.error("Submit exercise error:", error);
      setError("Something went wrong while submitting.");
    } finally {
      setLoading(false);
    }
  }

  const getExercise = useCallback(async () => {
    try {
      setCheckingSubmission(true);
      setError("");

      const response = (await submitExerciseFunction.getSubmitted(
        exerciseId,
      )) as { data?: SubmissionType | null };
      const submitted = response.data ?? null;

      setSubmission(submitted);
      setHasSubmitted(Boolean(submitted));
    } catch (error) {
      console.error("Get submitted exercise error:", error);
      setError("Something went wrong while retrieving your submission.");
    } finally {
      setCheckingSubmission(false);
    }
  }, [exerciseId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void getExercise();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [getExercise]);

  if (checkingSubmission) {
    return (
      <section className="mt-8 bg-white border border-black/10 rounded-lg p-6">
        <p className="text-sm text-black/50">Checking your submission...</p>
      </section>
    );
  }

  return (
    <section className="mt-8 bg-white border border-black/10 rounded-lg p-6">
      <h2 className="text-xl font-serif">
        {hasSubmitted ? "Your submission" : "Submit your answer"}
      </h2>

      {!hasSubmitted && (
        <p className="text-sm text-black/50 mt-1 mb-4">
          Write your answer below and submit it for evaluation.
        </p>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {!hasSubmitted && (
        <form onSubmit={handleSubmit}>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Write your answer here..."
            rows={8}
            disabled={loading}
            className="w-full border border-black/10 rounded-lg p-4 outline-none focus:border-black/40 resize-y"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-[#1f1b16] text-[#f3efe3] px-5 py-3 rounded-lg disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Exercise"}
          </button>
        </form>
      )}

      {submission && (
        <div className="mt-6 border-t border-black/10 pt-5">
          <h3 className="font-medium">Submission result</h3>

          {submission.answer && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-black/40">
                Your answer
              </p>

              <p className="mt-2 text-sm leading-6 whitespace-pre-wrap">
                {submission.answer}
              </p>
            </div>
          )}

          <p className="mt-4 text-sm">
            Status:{" "}
            <strong>
              {submission.is_completed ? "Completed" : "Not passed"}
            </strong>
          </p>

          <p className="text-sm mt-1">Score: {submission.score ?? 0} XP</p>

          {submission.feedback && (
            <div className="mt-4 bg-[#f3efe3] rounded-lg p-4">
              <p className="text-xs uppercase tracking-wide text-black/40">
                Feedback
              </p>

              <p className="mt-2 text-sm leading-6">{submission.feedback}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
