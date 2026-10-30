"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";

const WS_URL = process.env.NEXT_PUBLIC_PLAYGROUND_WS_URL ?? "";
// The localStorage key your login page saves the access token under.
const TOKEN_KEY = "access_token";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

type RunResult = {
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
  timedOut?: boolean;
  truncated?: boolean;
  durationMs?: number;
  error?: string;
};

// Visible example tests come from the exercise; hidden ones carry no content.
type ExampleTest = { id: string; stdin?: string; expected_output?: string; is_hidden: boolean };

type TestResult = {
  test_id: string;
  passed: boolean;
  is_hidden: boolean;
  actual_output?: string;
  stderr?: string;
  exit_code?: number | null;
  timed_out?: boolean;
};

type Submission = {
  status: string;
  score: number | null;
  feedback: string | null;
  is_completed: boolean;
  test_results: TestResult[] | null;
};

type Props = {
  language?: string; // lock the editor to one language (exercise mode)
  starterCode?: string;
  exerciseId?: string; // turns on Submit, saved drafts and the Results tab
  examples?: ExampleTest[];
  solved?: boolean;
  onSolved?: () => void;
  className?: string; // height of the whole editor
};

const LANGS: Record<string, { label: string; file: string; starter: string }> = {
  go: {
    label: "Go",
    file: "main.go",
    starter: 'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello")\n}\n',
  },
  python: { label: "Python", file: "main.py", starter: 'print("Hello")\n' },
  javascript: { label: "JavaScript", file: "main.js", starter: 'console.log("Hello");\n' },
  typescript: {
    label: "TypeScript",
    file: "main.ts",
    starter: 'const message: string = "Hello";\nconsole.log(message);\n',
  },
};

type Status = "connecting" | "connected" | "disconnected";
const DOT: Record<Status, string> = {
  connecting: "bg-yellow-500",
  connected: "bg-green-500",
  disconnected: "bg-red-500",
};

export default function PlaygroundEditor({
  language: lockedLanguage,
  starterCode,
  exerciseId,
  examples = [],
  solved = false,
  onSolved,
  className = "h-[80vh]",
}: Props) {
  const [language, setLanguage] = useState(lockedLanguage && LANGS[lockedLanguage] ? lockedLanguage : "go");
  const [status, setStatus] = useState<Status>("disconnected");
  const [notice, setNotice] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [stdin, setStdin] = useState(() => examples.find((e) => !e.is_hidden)?.stdin ?? "");
  const [panel, setPanel] = useState<"output" | "results">("output");
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [initialCode, setInitialCode] = useState<string | null>(null);
  const draftKey = exerciseId ? `folio-draft-${exerciseId}` : null;

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const pending = useRef(new Map<number, (v: any) => void>());
  const nextId = useRef(1);
  const version = useRef(1);
  const languageRef = useRef(language);
  languageRef.current = language;
  const runRef = useRef<() => void>(() => {});

  // Sends the code to Flask, which checks the login and calls the runner.
  async function run() {
    if (running || !editorRef.current) return;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setResult({ error: "Please log in to run code." });
      return;
    }
    setRunning(true);
    setResult(null);
    setPanel("output");
    try {
      const res = await fetch(`${API_URL}/playground/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lang: languageRef.current, code: editorRef.current.getValue(), stdin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          res.status === 401 || res.status === 422
            ? "Session expired. Please log in again."
            : data.error || data.msg || `Run failed (${res.status})`;
        setResult({ error: message });
      } else {
        setResult(data);
      }
    } catch {
      setResult({ error: "Could not reach the server." });
    } finally {
      setRunning(false);
    }
  }
  runRef.current = run;

  // Sends the code to Flask, which grades it against the exercise's tests.
  async function submit() {
    if (!exerciseId || submitting || running || !editorRef.current) return;
    setPanel("results");
    setSubmitError("");
    setSubmission(null);
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setSubmitError("Please log in to submit.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/submit/post_exercise/${exerciseId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ answer: editorRef.current.getValue() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSubmission(data.submission);
        if (data.submission?.is_completed) onSolved?.();
      } else {
        if (data.submission) setSubmission(data.submission);
        setSubmitError(
          res.status === 401 || res.status === 422
            ? "Session expired. Please log in again."
            : data.message || `Submit failed (${res.status})`,
        );
      }
    } catch {
      setSubmitError("Could not reach the server.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetCode() {
    if (!editorRef.current) return;
    if (!window.confirm("Reset to the starter code? Your current code will be lost.")) return;
    editorRef.current.setValue(starterCode || LANGS[language].starter);
    if (draftKey) {
      try {
        localStorage.removeItem(draftKey);
      } catch {}
    }
  }
  const disposables = useRef<{ dispose: () => void }[]>([]);
  // Document URI chosen by the server (it contains this user's workspace folder).
  const docUri = useRef("");

  const isOpen = () => socketRef.current?.readyState === WebSocket.OPEN;

  function notify(method: string, params: any) {
    if (isOpen()) socketRef.current!.send(JSON.stringify({ jsonrpc: "2.0", method, params }));
  }

  function request(method: string, params: any) {
    return new Promise<any>((resolve) => {
      const id = nextId.current++;
      pending.current.set(id, resolve);
      socketRef.current!.send(JSON.stringify({ jsonrpc: "2.0", id, method, params }));
    });
  }

  // Safe to call twice: the server turns a repeated didOpen into a didChange.
  function openDocument() {
    if (!docUri.current || !isOpen() || !editorRef.current) return;
    version.current = 1;
    notify("textDocument/didOpen", {
      textDocument: {
        uri: docUri.current,
        languageId: languageRef.current,
        version: 1,
        text: editorRef.current.getValue(),
      },
    });
  }

  function handleMount(editor: any, monaco: any) {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current());
    openDocument();

    // Turn off Monaco's own JS/TS checker so only the language server reports errors.
    const ts = monaco.languages.typescript;
    for (const d of [ts.javascriptDefaults, ts.typescriptDefaults]) {
      d.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true,
        noSuggestionDiagnostics: true,
      });
      d.setModeConfiguration({
        completionItems: true,
        hovers: false,
        documentSymbols: true,
        definitions: true,
        references: true,
        documentHighlights: true,
        rename: true,
        diagnostics: false,
        documentRangeFormattingEdits: true,
        signatureHelp: true,
        onTypeFormattingEdits: true,
        codeActions: true,
        inlayHints: true,
      });
    }

    for (const lang of Object.keys(LANGS)) {
      const hover = monaco.languages.registerHoverProvider(lang, {
        provideHover: async (_model: any, position: any) => {
          if (!isOpen() || languageRef.current !== lang) return null;
          const res = await request("textDocument/hover", {
            textDocument: { uri: docUri.current },
            position: { line: position.lineNumber - 1, character: position.column - 1 },
          });
          if (!res?.contents) return null;
          const c = res.contents;
          const value =
            typeof c === "string"
              ? c
              : Array.isArray(c)
                ? c.map((x: any) => (typeof x === "string" ? x : x.value)).join("\n\n")
                : c.value;
          return { contents: [{ value }] };
        },
      });
      disposables.current.push(hover);
    }
  }

  function handleChange(code?: string) {
    if (draftKey) {
      try {
        localStorage.setItem(draftKey, code ?? "");
      } catch {}
    }
    if (!docUri.current) return;
    notify("textDocument/didChange", {
      textDocument: { uri: docUri.current, version: ++version.current },
      contentChanges: [{ text: code ?? "" }],
    });
  }

  function showDiagnostics(params: any) {
    const monaco = monacoRef.current;
    const model = editorRef.current?.getModel();
    if (!monaco || !docUri.current || !model) return;
    // Ignore other files such as go.mod or tsconfig.json.
    if (monaco.Uri.parse(params.uri).toString() !== monaco.Uri.parse(docUri.current).toString()) return;

    const sev: Record<number, number> = {
      1: monaco.MarkerSeverity.Error,
      2: monaco.MarkerSeverity.Warning,
      3: monaco.MarkerSeverity.Info,
      4: monaco.MarkerSeverity.Hint,
    };
    monaco.editor.setModelMarkers(
      model,
      "lsp",
      params.diagnostics.map((d: any) => ({
        severity: sev[d.severity] ?? monaco.MarkerSeverity.Info,
        message: d.message,
        startLineNumber: d.range.start.line + 1,
        startColumn: d.range.start.character + 1,
        endLineNumber: d.range.end.line + 1,
        endColumn: d.range.end.character + 1,
      })),
    );
  }

  function disconnect() {
    const old = socketRef.current;
    socketRef.current = null;
    old?.close();
    pending.current.forEach((resolve) => resolve(null));
    pending.current.clear();
  }

  function connect(lang: string) {
    disconnect();
    docUri.current = "";
    setNotice("");

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setStatus("disconnected");
      setNotice("Please log in to use the playground.");
      return;
    }

    setStatus("connecting");
    const socket = new WebSocket(`${WS_URL}/?lang=${lang}&token=${encodeURIComponent(token)}`);
    socketRef.current = socket;

    socket.onopen = () => {
      if (socketRef.current !== socket) return;
      setStatus("connected"); // the document opens once the server sends its workspace URI
    };
    socket.onmessage = (event) => {
      if (socketRef.current !== socket) return; // stale socket after a language switch
      const msg = JSON.parse(event.data);
      if (msg.type === "workspace") {
        docUri.current = msg.uri;
        openDocument();
        return;
      }
      if (msg.id !== undefined && !msg.method && pending.current.has(msg.id)) {
        pending.current.get(msg.id)!(msg.result);
        pending.current.delete(msg.id);
        return;
      }
      if (msg.method === "textDocument/publishDiagnostics") showDiagnostics(msg.params);
    };
    socket.onclose = (event) => {
      if (socketRef.current !== socket) return;
      socketRef.current = null;
      setStatus("disconnected");
      if (event.code === 1013) setNotice("Server is busy. Try again in a moment.");
      else if (event.reason === "idle") setNotice("Disconnected after inactivity. Click Reconnect.");
      else if (event.reason === "Too many messages") setNotice("Too many requests. Please slow down.");
      else if (event.code === 1008) setNotice("Session not accepted. Please log in again.");
    };
  }

  // Connect on load and whenever the language changes.
  useEffect(() => {
    connect(language);
    return disconnect;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Exercise mode: start from the learner's saved draft, else the starter code.
  useEffect(() => {
    if (!exerciseId) return;
    let draft: string | null = null;
    try {
      draft = localStorage.getItem(draftKey!);
    } catch {}
    setInitialCode(draft ?? (starterCode || LANGS[language].starter));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Remove hover providers when leaving the page.
  useEffect(() => {
    const list = disposables.current;
    return () => list.forEach((d) => d.dispose());
  }, []);

  // The server sends "Passed 3 of 4 tests." and, when available, the AI's note after a blank line.
  const [summary, ...noteParts] = (submission?.feedback ?? "").split("\n\n");
  const aiFeedback = noteParts.join("\n\n").trim();

  const tab = (name: "output" | "results", label: string) => (
    <button
      onClick={() => setPanel(name)}
      className={`px-3 py-1.5 text-xs ${panel === name ? "border-b-2 border-white text-white" : "text-white/50 hover:text-white/80"}`}
    >
      {label}
    </button>
  );

  return (
    <div className={`flex ${className} flex-col overflow-hidden rounded border border-white/10 bg-[#1e1e1e]`}>
      <div className="flex items-center gap-3 border-b border-white/10 px-3 py-2 text-sm text-white/70">
        {lockedLanguage ? (
          <span className="rounded border border-white/10 px-2 py-1">{LANGS[language].label}</span>
        ) : (
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded border border-white/10 bg-transparent px-2 py-1"
          >
            {Object.entries(LANGS).map(([key, l]) => (
              <option key={key} value={key} className="text-black">
                {l.label}
              </option>
            ))}
          </select>
        )}
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${DOT[status]}`} />
          {status}
        </span>
        {notice && <span className="text-yellow-500">{notice}</span>}
        {status === "disconnected" && (
          <button onClick={() => connect(language)} className="rounded px-2 py-1 hover:bg-white/5">
            Reconnect
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {exerciseId && (
            <button onClick={resetCode} className="rounded px-2 py-1 hover:bg-white/5">
              Reset
            </button>
          )}
          <button
            onClick={run}
            disabled={running || submitting}
            title="Run (Ctrl+Enter)"
            className="rounded bg-green-600 px-3 py-1 font-medium text-white hover:bg-green-500 disabled:opacity-50"
          >
            {running ? "Running..." : "▷ Run"}
          </button>
          {exerciseId && (
            <button
              onClick={submit}
              disabled={submitting || running || solved}
              className="rounded bg-white px-3 py-1 font-medium text-black hover:bg-white/90 disabled:opacity-60"
            >
              {solved ? "Solved ✓" : submitting ? "Grading..." : "Submit"}
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {exerciseId && initialCode === null ? (
          <div className="p-4 text-sm text-white/50">Loading editor...</div>
        ) : (
          <Editor
            height="100%"
            language={language}
            path={exerciseId ? `exercise/${exerciseId}/${LANGS[language].file}` : `playground/${LANGS[language].file}`}
            defaultValue={exerciseId ? (initialCode ?? "") : LANGS[language].starter}
            onMount={handleMount}
            onChange={handleChange}
            theme="vs-dark"
            options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true }}
          />
        )}
      </div>

      <div className="shrink-0 border-t border-white/10 px-3 py-2">
        <label className="mb-1 block text-xs text-white/40">Input for Run (stdin)</label>
        <textarea
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          rows={2}
          spellCheck={false}
          className="w-full resize-none rounded border border-white/10 bg-transparent px-2 py-1 font-mono text-sm text-white/80 outline-none focus:border-white/30"
        />
      </div>

      <div className="flex shrink-0 border-t border-white/10">
        {tab("output", "Output")}
        {exerciseId && tab("results", "Results")}
      </div>

      <div className="h-44 shrink-0 overflow-auto p-3 font-mono text-sm">
        {panel === "output" && (
          <>
            {!result && !running && <span className="text-white/40">Output appears here. Ctrl+Enter to run.</span>}
            {running && <span className="text-white/60">Running...</span>}
            {result?.error && <div className="text-red-400">{result.error}</div>}
            {result && !result.error && (
              <>
                {result.stdout && <pre className="whitespace-pre-wrap text-white/90">{result.stdout}</pre>}
                {result.stderr && <pre className="whitespace-pre-wrap text-red-400">{result.stderr}</pre>}
                {!result.stdout && !result.stderr && result.exitCode === 0 && !result.timedOut && (
                  <div className="text-white/50">
                    Your code ran but printed nothing. Print the result, and read the input if the exercise gives you some.
                  </div>
                )}
                <div className="mt-2 text-xs text-white/40">
                  {result.timedOut
                    ? "Stopped: time limit reached"
                    : result.truncated
                      ? "Output was cut off"
                      : `Exit code ${result.exitCode}`}
                  {result.durationMs !== undefined && ` · ${(result.durationMs / 1000).toFixed(1)}s`}
                </div>
              </>
            )}
          </>
        )}

        {panel === "results" && (
          <>
            {!submission && !submitting && !submitError && (
              <span className="text-white/40">Submit to check your solution against the tests.</span>
            )}
            {submitting && <span className="text-white/60">Grading... this can take a few seconds.</span>}
            {submitError && <div className="text-red-400">{submitError}</div>}
            {submission && (
              <>
                <div className={submission.is_completed ? "text-green-400" : "text-red-400"}>
                  {submission.is_completed ? "✓ All tests passed" : "✗ Not all tests passed"}
                  {summary && <span className="text-white/60"> · {summary}</span>}
                  {submission.is_completed && submission.score ? (
                    <span className="text-white/60"> · +{submission.score} XP</span>
                  ) : null}
                </div>
                {aiFeedback && (
                  <div className="mt-3 rounded border border-white/10 bg-white/5 p-3">
                    <div className="mb-1 text-xs text-white/40">Feedback</div>
                    <p className="whitespace-pre-wrap font-sans text-sm text-white/80">{aiFeedback}</p>
                  </div>
                )}
                <ul className="mt-3 space-y-2">
                  {(submission.test_results ?? []).map((r, i) => {
                    const example = examples.find((e) => e.id === r.test_id);
                    return (
                      <li key={r.test_id}>
                        <div className={r.passed ? "text-green-400" : "text-red-400"}>
                          {r.passed ? "✓" : "✗"} Test {i + 1}
                          {r.is_hidden && <span className="text-white/40"> (hidden)</span>}
                        </div>
                        {!r.passed && !r.is_hidden && (
                          <div className="ml-4 mt-1 space-y-1 text-xs text-white/70">
                            {example?.stdin ? <div>Input: <span className="text-white/90">{example.stdin}</span></div> : null}
                            {example?.expected_output !== undefined && (
                              <div>Expected: <span className="text-white/90">{example.expected_output}</span></div>
                            )}
                            <div>Got: <span className="text-white/90">{r.actual_output || "(nothing)"}</span></div>
                            {r.stderr && <pre className="whitespace-pre-wrap text-red-400">{r.stderr}</pre>}
                            {r.timed_out && <div className="text-yellow-500">Time limit reached</div>}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}