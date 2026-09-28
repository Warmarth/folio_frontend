"use client";

import { useState, useEffect } from "react";
import { learners as getLearners } from "@/lib/api/serverRequests";
import { LearnerType } from "@/types/mentors/menteeType";

export default function Learner() {
  const [learners, setLearners] = useState<LearnerType[]>([]);

  useEffect(() => {
    const fetchLearners = async () => {
      try {
        const data = await getLearners.getLearners();
        console.log("Fetched learners:", data);
        setLearners(data);
      } catch (error) {
        console.error("Error fetching learners:", error);
      }
    };

    fetchLearners();
  }, []);

  return (
    <div>
      <h1>Learners</h1>

      {learners.map((learner) => (
        <div
          key={learner.id}
          className="bg-white rounded-xl shadow-md p-5 border mb-3 w-96"
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
              {learner.learner_name?.charAt(0).toUpperCase()}
            </div>

            {/* Learner information */}
            <div>
              <h3 className="font-semibold text-lg">{learner?.learner_name}</h3>

              <p className="text-sm text-gray-500">Role: {learner.role}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
