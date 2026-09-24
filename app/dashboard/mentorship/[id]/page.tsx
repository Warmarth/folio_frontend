"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Mentor {
  name?: string;
  user_id?: string;
  email?: string;
  image_url?: string;
  bio?: string;
  expertise?: string;
}

type RelationshipStatus = "active" | "pending" | "declined" | "ended";
interface Relationship {
  id?: string;
  learner_id?: string;
  mentor_id?: string;
  status?: RelationshipStatus;
  learner_name?: string;
  mentor_name?: string;
  requested_at?: string;
  responded_at?: string;
  ended_at?: string;
}

export default function MentorshipDetailsPage() {
  const params = useParams();
  const mentor_id = params.id as string;

  const [mentor, setMentor] = useState<Mentor>({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Relationship>({});

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const getRelationshipStatuses = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      const mentor_user_id = sessionStorage.getItem("mentor_user_id");
      if (!token) {
        console.log("No access token");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/mentor/${mentor_user_id}/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Request failed with status ${response.status}`,
        );
      }

      setStatus(data ?? {});
    } catch (error) {
      console.error("Error fetching relationship status:", error);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    if (!mentor_id) return;
    const fetch_mentor = async () => {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          console.log("No access token");
          return;
        }

        const response = await fetch(
          `${API_URL}/api/all_mentors/${mentor_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch mentor");
        }

        sessionStorage.setItem("mentor_user_id", data?.data?.user_id);

        setMentor(data.data);
      } catch (error) {
        console.error("Error fetching mentor:", error);
      }
    };
    fetch_mentor();
  }, [mentor_id, API_URL]);

  useEffect(() => {
    if (!mentor.user_id) return;

    const timer = setTimeout(() => {
      void getRelationshipStatuses();
    }, 100);

    return () => clearTimeout(timer);
  }, [mentor.user_id, getRelationshipStatuses]);

  async function StartMentorship() {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        console.log("No access token");
        return;
      }
      const response = await fetch(
        `${API_URL}/api/mentor/${mentor.user_id}/request`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      console.log("Fetched mentor data:", data);
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch mentor");
      }
      await getRelationshipStatuses();
    } catch (error) {
      console.error("Error fetching mentor:", error);
    }
  }

  if (loading) {
    return (
      <main className="p-8">
        <p>Loading mentor...</p>
      </main>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold">Mentor Profile</h1>

        {mentor?.name ? (
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            {mentor.image_url && (
              <img
                src={mentor.image_url}
                alt={mentor.name}
                className="h-64 w-full object-cover"
              />
            )}

            <div className="p-6">
              <h2 className="text-2xl font-bold">{mentor.name}</h2>

              {mentor.email && (
                <p className="mt-1 text-gray-500">{mentor.email}</p>
              )}

              {mentor.bio && (
                <div className="mt-6">
                  <h3 className="font-semibold">About</h3>
                  <p className="mt-2 text-gray-600">{mentor.bio}</p>
                </div>
              )}

              {mentor.expertise && (
                <div className="mt-6">
                  <h3 className="font-semibold">Expertise</h3>
                  <p className="mt-2 text-gray-600">{mentor.expertise}</p>
                </div>
              )}

              {status.status === "active" ? (
                <button
                  className="mt-8 rounded-lg bg-gray-300 px-5 py-3 font-medium text-gray-700"
                  disabled
                >
                  Mentorship Active
                </button>
              ) : status.status === "pending" ? (
                <button
                  className="mt-8 rounded-lg bg-gray-300 px-5 py-3 font-medium text-gray-700"
                  disabled
                >
                  Request Pending
                </button>
              ) : status.status === "declined" ? (
                <button
                  className="mt-8 rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
                  onClick={StartMentorship}
                >
                  Request Again
                </button>
              ) : (
                <button
                  className="mt-8 rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
                  onClick={StartMentorship}
                >
                  Start Mentorship
                </button>
              )}
              {status.status==="ended"}

            </div>
          </div>
        ) : (
          <div className="rounded-xl border bg-white p-6">
            <p>Mentor not found.</p>
          </div>
        )}
      </div>
    </>
  );
}
