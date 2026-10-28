"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { codeReview } from "@/lib/api/serverRequests";
import { CallToken } from "@/types/learners/codeReview";

// Turns the server's error into something a learner can act on.
function explain(err: unknown) {
  const text = err instanceof Error ? err.message : "";
  if (text.startsWith("401") || text.startsWith("422"))
    return "Please log in again to join the call.";
  if (text.startsWith("404")) return "You can't join this call.";
  if (text.startsWith("409"))
    return "Calls on this server use an external service, not this page.";
  if (text.startsWith("503")) return "Calls aren't set up on this server yet.";
  return "Could not start the call. Please try again.";
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3efe3] p-8 text-center">
      {children}
    </main>
  );
}

function Call() {
  const params = useParams();
  const id = params.id as string;
  const mode = useSearchParams().get("mode") === "voice" ? "voice" : "video";

  const [call, setCall] = useState<CallToken | null>(null);
  const [error, setError] = useState("");
  const [ended, setEnded] = useState(false);

  // Ask the server for a pass. It only gives one to this learner and their mentor.
  useEffect(() => {
    let cancelled = false;
    codeReview
      .getCallToken(id, mode)
      .then((res) => {
        if (!cancelled) setCall(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(explain(err));
      });
    return () => {
      cancelled = true;
    };
  }, [id, mode]);

  if (error) {
    return (
      <Centered>
        <p className="text-red-700">{error}</p>
      </Centered>
    );
  }

  if (ended) {
    return (
      <Centered>
        <div>
          <h1 className="text-2xl font-serif">Call ended</h1>
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Rejoin
            </button>
            <button
              onClick={() => window.close()}
              className="rounded-lg border border-black/20 px-4 py-2 text-sm"
            >
              Close this tab
            </button>
          </div>
        </div>
      </Centered>
    );
  }

  if (!call) {
    return (
      <Centered>
        <p className="text-black/60">Joining the call...</p>
      </Centered>
    );
  }

  return (
    <LiveKitRoom
      token={call.token}
      serverUrl={call.url}
      connect
      audio
      video={mode === "video"} // a voice call starts with the camera off
      data-lk-theme="default"
      style={{ height: "100vh" }}
      onDisconnected={() => setEnded(true)}
      onError={() =>
        setError("Lost the connection to the call. Please try again.")
      }
    >
      <VideoConference />
    </LiveKitRoom>
  );
}

export default function CallPage() {
  return (
    <Suspense fallback={null}>
      <Call />
    </Suspense>
  );
}
