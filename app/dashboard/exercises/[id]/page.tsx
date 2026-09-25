"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SubmitExercise from "@/app/components/submitExercise";
import { Exercise } from "@/types/learners/exerciseType";
import { exercise as exercises } from "@/lib/api/mentors";

export default function ExerciseDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitPage, setSubmitPage] = useState(false);

  useEffect(() => {
    async function loadExercise() {
      try {
        const data = await exercises.getExerciseById(id);

        setExercise((data.data as Exercise) ?? null);
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

  return (
    <main className="min-h-screen bg-[#f3efe3] p-8">
      <h1 className="text-3xl font-serif">{exercise.title}</h1>

      <p className="mt-4">{exercise.description}</p>

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
      <button
        onClick={() => {
          router.push("/dashboard");
        }}
        className="mb-6 text-sm text-black/50 hover:text-black"
      >
        ← Back to dashboard
      </button>
    </main>
  );
}
