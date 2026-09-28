"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Exercise from "../components/Exercise";
import { menteeExerciseData } from "@/types/mentors/menteeExercise";
import { mentorExercise } from "@/lib/api/serverRequests";


const ExercisesPage = () => {
  const [exercises, setExercises] = useState<menteeExerciseData[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const data = await mentorExercise.getExercise();
        console.log("Fetched exercises:", data);
        setExercises(data.data || []);
      } catch (error) {
        console.error("Error fetching exercises:", error);
      }
    };

    fetchExercises();
  }, []);

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">Exercises</h1>

      <div className="grid grid-cols-1 gap-4">
        {exercises.length > 0 ? (
          exercises.map((exercise) => (
            <div
              key={exercise.id}
              onClick={() => router.push(`/mentor/exercises/${exercise.id}`)}
            >
              <Exercise
                key={exercise.id}
                title={exercise.title || ""}
                description={exercise.description || ""}
                level={exercise.level || ""}
                xp_reward={exercise.xp_points || 0}
              />
            </div>
          ))
        ) : (
          <div>No exercises available.</div>
        )}
      </div>
    </div>
  );
};

export default ExercisesPage;
