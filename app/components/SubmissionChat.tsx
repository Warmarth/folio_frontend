"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { codeReview } from "@/lib/api/serverRequests";
import { ChatMessage } from "@/types/learners/codeReview";

const POLL_MS = 8000; // new messages show up within a few seconds

// The chat for one submission. The same component serves the learner and the mentor.
export default function SubmissionChat({ submissionId }: { submissionId: string }) {
  const [messageResult, setMessageResult] = useState<{
    submissionId: string;
    messages: ChatMessage[];
  } | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const activeSubmissionId = useRef<string | null>(null);
  const loading = messageResult?.submissionId !== submissionId;
  const messages =
    messageResult?.submissionId === submissionId ? messageResult.messages : [];

  const load = useCallback(
    (targetId: string) =>
      codeReview
        .getMessages(targetId)
        .then((res) => {
          if (activeSubmissionId.current === targetId)
            setMessageResult({ submissionId: targetId, messages: res.data });
        })
        .catch(() => {
          if (activeSubmissionId.current === targetId)
            setMessageResult((current) =>
              current?.submissionId === targetId
                ? current
                : { submissionId: targetId, messages: [] },
            );
        }),
    [],
  );

  useEffect(() => {
    activeSubmissionId.current = submissionId;
    void load(submissionId);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void load(submissionId);
    }, POLL_MS);
    return () => {
      clearInterval(timer);
      if (activeSubmissionId.current === submissionId)
        activeSubmissionId.current = null;
    };
  }, [load, submissionId]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError("");
    try {
      await codeReview.sendMessage(submissionId, body);
      setText("");
      await load(submissionId);
    } catch {
      setError("Could not send. You may be sending too fast, so wait a moment.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-lg border border-black/10 bg-white">
      <div ref={listRef} className="h-64 space-y-3 overflow-y-auto p-3">
        {loading && <p className="text-sm text-black/50">Loading...</p>}
        {!loading && messages.length === 0 && (
          <p className="text-sm text-black/50">No messages yet. Say hello and ask your question.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.is_mine ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                m.is_mine ? "bg-black text-white" : "bg-black/5 text-black"
              }`}
            >
              {!m.is_mine && <div className="mb-0.5 text-xs font-medium text-black/60">{m.sender_name}</div>}
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              {m.created_at && (
                <div className={`mt-1 text-[10px] ${m.is_mine ? "text-white/60" : "text-black/40"}`}>
                  {new Date(m.created_at).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-black/10 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          placeholder="Write a message..."
          className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-black"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {sending ? "..." : "Send"}
        </button>
      </form>
      {error && <p className="px-3 pb-3 text-xs text-red-600">{error}</p>}
    </div>
  );
}
