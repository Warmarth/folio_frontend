"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  BarChart3,
  Settings,
  AlertCircleIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import NavItem from "./components/NavItem";

interface UserInfo {
  name?: string;
  email?: string;
  image_url?: string;
  profile?: {
    name?: string;
    bio?: string;
    image_url?: string;
  };
}
interface learnerRequest {
  id: string;
  learner_id?: string;
  mentor_id?: string;
  status?: string;
  learner_name?: string;
  mentor_name?: string;
  requested_at?: string;
  reponded_at?: string;
  ended_at?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;
export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [userInfo, setUserInfo] = useState<UserInfo>({});
  const [mentorshipRequests, setMentorshipRequests] = useState<
    learnerRequest[]
  >([]);
  const [mentorshipLoading, setMentorshipLoading] = useState(false);
  const [mentorshipError, setMentorshipError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  function logout() {
    localStorage.removeItem("access_token");
    router.push("/login");
  }

  async function getUserInfo() {
    const token = localStorage.getItem("access_token");

    if (!token) {
      console.log("No access token");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/mentors_profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to fetch mentor:", data);
        return;
      }

      setUserInfo(data);
      console.log(data);
    } catch (error) {
      console.error("Error fetching mentor:", error);
    }
  }

  async function getRelationshipStatuses() {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setMentorshipLoading(true);
    setMentorshipError(null);

    try {
      const response = await fetch(`${API_URL}/api/mentor/mentee`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(
          errText || `Request failed with status ${response.status}`,
        );
      }

      const data: learnerRequest[] = await response.json();
      setMentorshipRequests(data);
    } catch (error) {
      console.error("Error fetching mentorship requests:", error);
      setMentorshipError(
        error instanceof Error
          ? error.message
          : "Failed to load mentorship requests",
      );
    } finally {
      setMentorshipLoading(false);
    }
  }

  async function respondToRequest(
    learnerId: string,
    action: "accept" | "decline",
  ) {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/api/mentor/${learnerId}/${action}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Failed to ${action} request`);
      }

      void getRelationshipStatuses();
    } catch (error) {
      console.error(`Error trying to ${action} request:`, error);
    }
  }

  useEffect(() => {
    const loadMentorData = () => {
      void getUserInfo();
      void getRelationshipStatuses();
    };

    queueMicrotask(loadMentorData);
  }, []);
  return (
    <div className="h-screen overflow-hidden bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r bg-white p-5 md:block">
        <div className="mb-10">
          <h1 className="text-2xl font-bold">Folio</h1>
          <p className="text-sm text-gray-500">Mentor Portal</p>
        </div>

        <nav className="space-y-2">
          <NavItem
            icon={<LayoutDashboard size={19} />}
            label="Dashboard"
            active={pathname === "/mentor/dashboard"}
            onClick={() => router.push("/mentor/dashboard")}
          />

          <NavItem
            icon={<BookOpen size={19} />}
            label="Exercises"
            active={pathname === "/mentor/exercises"}
            onClick={() => router.push("/mentor/exercises")}
          />

          <NavItem
            icon={<FileText size={19} />}
            label="Submissions"
            active={pathname === "/mentor/submissions"}
            onClick={() => router.push("/mentor/submissions")}
          />

          <NavItem
            icon={<Users size={19} />}
            label="Learners"
            active={pathname === "/mentor/learners"}
            onClick={() => router.push("/mentor/learners")}
          />

          <NavItem
            icon={<BarChart3 size={19} />}
            label="Performance"
            active={pathname === "/mentor/performance"}
            onClick={() => router.push("/mentor/performance")}
          />

          <NavItem
            icon={<Settings size={19} />}
            label="Settings"
            active={pathname === "/mentor/settings"}
            onClick={() => router.push("/mentor/settings")}
          />
        </nav>

        {/* Mentor profile */}
        <div className="absolute bottom-5 left-5 right-5 rounded-xl bg-gray-100 p-4">
          <div className="mb-3">
            {userInfo?.profile?.image_url ? (
              <img
                src={userInfo.profile.image_url}
                alt="Mentor"
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white">
                {userInfo?.profile?.name?.charAt(0).toUpperCase() || "M"}
              </div>
            )}
          </div>

          <p className="font-semibold">{userInfo?.profile?.name || "Mentor"}</p>

          <p className="truncate text-sm text-gray-500">
            {userInfo?.email || "mentor@example.com"}
          </p>
        </div>
        <button
          onClick={logout}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Sign out
        </button>
      </aside>

      {/* Main area */}
      <div className="ml-64 h-screen">
        {/* Fixed Header */}
        <header className="fixed left-64 right-0 top-0 z-50 h-20 border-b bg-white">
          <div className="flex h-full items-center justify-between px-6">
            <div>
              <p className="text-sm text-gray-500">Mentor Dashboard</p>

              <h2 className="text-xl font-bold">Good evening 👋</h2>
            </div>
            <div className="relative ml-auto m-4">
              <button
                onClick={() => setShowDropdown((prev) => !prev)}
                className="flex items-center bg-black text-white p-2 rounded-lg"
              >
                <AlertCircleIcon size={18} className="text-white" />
                <span className="ml-1">{mentorshipRequests.length}</span>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-72 rounded-lg border bg-white shadow-lg z-50">
                  <div className="border-b p-3 font-semibold text-sm">
                    Mentorship Requests
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {mentorshipLoading && (
                      <p className="p-3 text-sm text-gray-500">Loading...</p>
                    )}

                    {mentorshipError && (
                      <p className="p-3 text-sm text-red-500">
                        {mentorshipError}
                      </p>
                    )}

                    {!mentorshipLoading &&
                      !mentorshipError &&
                      mentorshipRequests.length === 0 && (
                        <p className="p-3 text-sm text-gray-500">
                          No requests yet
                        </p>
                      )}

                    {mentorshipRequests.map((req: learnerRequest) => (
                      <div
                        key={req.id}
                        className="border-b p-3 last:border-b-0"
                      >
                        <p className="text-sm font-medium">
                          {req.learner_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {req.requested_at}
                        </p>
                        {req.status && (
                          <span className="text-xs text-gray-400">
                            {req.status}
                          </span>
                        )}
                        {req.status === "pending" && req.learner_id && (
                          <div className="mt-1 flex gap-2">
                            <button
                              onClick={() =>
                                respondToRequest(req.learner_id!, "accept")
                              }
                              className="text-xs text-green-600 hover:underline"
                            >
                              accept
                            </button>
                            <button
                              onClick={() =>
                                respondToRequest(req.learner_id!, "decline")
                              }
                              className="text-xs text-red-600 hover:underline"
                            >
                              decline
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => router.push("/mentor/dashboard/create_exercise")}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              + Create Exercise
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="h-screen overflow-y-auto pt-20">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
