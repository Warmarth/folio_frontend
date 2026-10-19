"use client";
import { useState } from "react";
import CodeEditor from "../../components/codeEditor";

export default function Playground() {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");

  async function run() {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/playground/run`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ language: "go", code }),
      },
    );
    setOutput(JSON.stringify(await res.json(), null, 2));
  }

  return (
    <>
      <CodeEditor language="go" value={code} onChange={setCode} />
      <button onClick={run}>Run</button>
      <pre>{output}</pre>
    </>
  );
}
