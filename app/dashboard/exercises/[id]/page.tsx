"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SubmitExercise from "@/app/components/submitExercise";
import PlaygroundEditor from "../../../components/playgroundeditor";
import { ExerciseContent } from "@/types/learners/exerciseType";
import {
  exercise as exercises,
  submitExerciseFunction,
} from "@/lib/api/serverRequests";

export default function ExerciseDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [exercise, setExercise] = useState<ExerciseContent | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitPage, setSubmitPage] = useState(false);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    async function loadExercise() {
      try {
        const data = await exercises.getExerciseById(id);
        const loaded = data.data ?? null;
        setExercise(loaded);

        // Already passed? The server keeps one passed submission per exercise.
        if (loaded) {
          try {
            await submitExerciseFunction.getSubmitted(id);
            setSolved(true);
          } catch {
            setSolved(false); // 404 means not solved yet
          }
        }
      } catch (error) {
        console.error("Exercise error:", error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadExercise();
    }
  }, [id]);

  if (loading) {
    return <main className="p-8">Loading exercise...</main>;
  }

  if (!exercise) {
    return <main className="p-8">Exercise not found.</main>;
  }

  const examples = exercise.examples ?? [];
  const visibleExamples = examples.filter((e) => !e.is_hidden);
  const testCount = exercise.test_count ?? 0;
  const hiddenCount = Math.max(testCount - visibleExamples.length, 0);
  const isCodeExercise = exercise.category === "programming" || testCount > 0;

  const backButton = (
    <button
      onClick={() => {
        router.push("/dashboard");
      }}
      className="mb-6 text-sm text-black/50 hover:text-black"
    >
      ← Back to dashboard
    </button>
  );

  // Written answers keep the original page.
  if (!isCodeExercise) {
    return (
      <main className="min-h-screen bg-[#f3efe3] p-8">
        <h1 className="text-3xl font-serif">{exercise.title}</h1>

        <p className="mt-4">{exercise.description}</p>

        {exercise.instructions && (
          <div className="mt-6">
            <h2 className="text-lg font-serif">Instructions</h2>
            <p className="mt-2 whitespace-pre-wrap">{exercise.instructions}</p>
          </div>
        )}

        <button
          type="button"
          className="mt-4 bg-[#1f1b16] text-[#f3efe3] px-4 py-2 rounded"
          onClick={() => {
            setSubmitPage((p) => !p);
          }}
        >
          {submitPage ? "Close submission" : "Click to submit your exercise"}
        </button>

        {submitPage && <SubmitExercise exerciseId={id} />}
        <div className="mt-6">{backButton}</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3efe3] p-8">
      {backButton}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: the task */}
        <section className="space-y-6">
          <div>
            <h1 className="text-3xl font-serif">{exercise.title}</h1>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {exercise.language && (
                <span className="rounded-full bg-[#1f1b16] px-3 py-1 text-[#f3efe3]">
                  {exercise.language}
                </span>
              )}
              {exercise.xp_points !== undefined && (
                <span className="rounded-full border border-black/20 px-3 py-1">
                  {exercise.xp_points} XP
                </span>
              )}
              {solved && (
                <span className="rounded-full bg-green-600 px-3 py-1 text-white">
                  Solved ✓
                </span>
              )}
            </div>
          </div>

          <p>{exercise.description}</p>

          {exercise.instructions && (
            <div>
              <h2 className="text-lg font-serif">Instructions</h2>
              <p className="mt-2 whitespace-pre-wrap">
                {exercise.instructions}
              </p>
            </div>
          )}

          {visibleExamples.length > 0 && (
            <div>
              <h2 className="text-lg font-serif">Examples</h2>
              <div className="mt-2 space-y-3">
                {visibleExamples.map((example, index) => (
                  <div
                    key={example.id}
                    className="rounded border border-black/10 bg-black/5 p-3 text-sm"
                  >
                    <div className="mb-1 text-xs text-black/50">
                      Example {index + 1}
                    </div>
                    {example.stdin ? (
                      <>
                        <div className="text-xs text-black/50">Input</div>
                        <pre className="mb-2 whitespace-pre-wrap font-mono">
                          {example.stdin}
                        </pre>
                      </>
                    ) : null}
                    <div className="text-xs text-black/50">Expected output</div>
                    <pre className="whitespace-pre-wrap font-mono">
                      {example.expected_output}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {testCount > 0 && (
            <p className="text-sm text-black/60">
              Submitting checks your code against {testCount} test
              {testCount === 1 ? "" : "s"}
              {hiddenCount > 0 ? `, ${hiddenCount} of them hidden` : ""}. Use
              Run to try your code first.
            </p>
          )}
        </section>

        {/* Right: the editor */}
        <section>
          <PlaygroundEditor
            language={exercise.language}
            starterCode={exercise.starter_code}
            exerciseId={id}
            examples={examples}
            solved={solved}
            onSolved={() => setSolved(true)}
            className="h-[85vh]"
          />
        </section>
      </div>
    </main>
  );
}
