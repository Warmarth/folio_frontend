"use client";

import { useState } from "react";
import { CallLinks, CallOption } from "@/types/learners/codeReview";

// Video and voice calls open in a new tab, in a room only the learner and their mentor are given.
// A "Call with" picker lists every call service; one that isn't set up yet is greyed out.
export default function CallButtons({ call }: { call: CallLinks }) {
  const options: CallOption[] =
    call.options && call.options.length > 0
      ? call.options
      : [
          {
            provider: call.provider,
            label: call.provider === "livekit" ? "LiveKit" : "Jitsi",
            available: true,
            video: call.video,
            voice: call.voice,
          },
        ];

  // Start on the first service that works.
  const [choice, setChoice] = useState(
    (options.find((o) => o.available) ?? options[0]).provider,
  );
  const selected = options.find((o) => o.provider === choice) ?? options[0];
  const several = options.length > 1;

  const base =
    "rounded-lg border border-black/20 px-4 py-2 text-sm font-medium";
  const active = `${base} hover:bg-black/5`;
  const off = `${base} cursor-not-allowed opacity-40`;

  const callButton = (kind: "video" | "voice") => {
    const text = `${kind === "video" ? "Video call" : "Voice call"}${several ? ` with ${selected.label}` : ""}`;
    return selected.available ? (
      <a
        href={selected[kind]}
        target="_blank"
        rel="noopener noreferrer"
        className={active}
      >
        {text}
      </a>
    ) : (
      <span aria-disabled="true" className={off}>
        {text}
      </span>
    );
  };

  return (
    <>
      {several && (
        <label className="flex items-center gap-2 text-sm text-black/60">
          Call with
          <select
            value={selected.provider}
            onChange={(e) =>
              setChoice(e.target.value as CallOption["provider"])
            }
            className="rounded-lg border border-black/20 bg-white px-3 py-2 text-sm text-black"
          >
            {options.map((o) => (
              <option
                key={o.provider}
                value={o.provider}
                disabled={!o.available}
              >
                {o.label}
                {o.available ? "" : " (not set up)"}
              </option>
            ))}
          </select>
        </label>
      )}
      {callButton("video")}
      {callButton("voice")}
      <p className="basis-full text-xs text-black/40">
        {selected.available
          ? "Calls open in a new tab."
          : `${selected.label} calls aren't set up yet.`}
        {selected.available &&
          selected.provider === "jitsi" &&
          " The first person in may be asked to sign in."}
        {selected.available &&
          several &&
          " You and the other person need to pick the same service, so say which in the chat."}
      </p>
    </>
  );
}
