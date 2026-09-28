"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Exercise } from "@/types/mentors/menteeExercise";
import { mentorExercise } from "@/lib/api/serverRequests";

export default function ExerciseDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExercise() {
      try {
        const data = await mentorExercise.getExerciseById(id);
        setExercise(data.data || null);
      } catch (error) {
        console.error("Error fetching exercise:", error);
      } finally {
        setLoading(false);
      }
    }

    loadExercise();
  }, [id]);

  return (
    <main className="p-8">
      {loading ? (
        <p>Loading exercise...</p>
      ) : exercise ? (
        <div>
          <h1 className="text-2xl font-bold mb-4">{exercise.title}</h1>
          <p className="mb-2">
            <strong>Description:</strong> {exercise.description}
          </p>
          <p className="mb-2">
            <strong>Level:</strong> {exercise.level}
          </p>
          <p className="mb-2">
            <strong>Category:</strong> {exercise.category}
          </p>
          <p className="mb-2">
            <strong>XP Points:</strong> {exercise.xp_points}
          </p>
          <p className="mb-2">
            <strong>Created At:</strong>{" "}
            {exercise.created_at
              ? new Date(exercise.created_at).toLocaleString()
              : "Not available"}
          </p>
          <p className="mb-2">
            <strong>Instructions:</strong> {exercise.instructions}
          </p>
          <p className="mb-2">
            <strong>Evaluation Criteria:</strong> {exercise.evaluation_criteria}
          </p>
        </div>
      ) : (
        <p>Exercise not found.</p>
      )}
    </main>
  );
}
