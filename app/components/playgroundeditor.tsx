"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";

const WS_URL = process.env.NEXT_PUBLIC_PLAYGROUND_WS_URL ?? "";
// The localStorage key your login page saves the access token under.
const TOKEN_KEY = "access_token";

const LANGS: Record<string, { label: string; file: string; starter: string }> =
  {
    go: {
      label: "Go",
      file: "main.go",
      starter:
        'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello")\n}\n',
    },
    python: { label: "Python", file: "main.py", starter: 'print("Hello")\n' },
    javascript: {
      label: "JavaScript",
      file: "main.js",
      starter: 'console.log("Hello");\n',
    },
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

export default function PlaygroundEditor() {
  const [language, setLanguage] = useState("go");
  const [status, setStatus] = useState<Status>("disconnected");
  const [notice, setNotice] = useState("");

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const pending = useRef(new Map<number, (v: any) => void>());
  const nextId = useRef(1);
  const version = useRef(1);
  const languageRef = useRef(language);
  languageRef.current = language;
  const disposables = useRef<{ dispose: () => void }[]>([]);
  // Document URI chosen by the server (it contains this user's workspace folder).
  const docUri = useRef("");

  const isOpen = () => socketRef.current?.readyState === WebSocket.OPEN;

  function notify(method: string, params: any) {
    if (isOpen())
      socketRef.current!.send(
        JSON.stringify({ jsonrpc: "2.0", method, params }),
      );
  }

  function request(method: string, params: any) {
    return new Promise<any>((resolve) => {
      const id = nextId.current++;
      pending.current.set(id, resolve);
      socketRef.current!.send(
        JSON.stringify({ jsonrpc: "2.0", id, method, params }),
      );
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
            position: {
              line: position.lineNumber - 1,
              character: position.column - 1,
            },
          });
          if (!res?.contents) return null;
          const c = res.contents;
          const value =
            typeof c === "string"
              ? c
              : Array.isArray(c)
                ? c
                    .map((x: any) => (typeof x === "string" ? x : x.value))
                    .join("\n\n")
                : c.value;
          return { contents: [{ value }] };
        },
      });
      disposables.current.push(hover);
    }
  }

  function handleChange(code?: string) {
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
    if (
      monaco.Uri.parse(params.uri).toString() !==
      monaco.Uri.parse(docUri.current).toString()
    )
      return;

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
    const socket = new WebSocket(
      `${WS_URL}/?lang=${lang}&token=${encodeURIComponent(token)}`,
    );
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
      if (msg.method === "textDocument/publishDiagnostics")
        showDiagnostics(msg.params);
    };
    socket.onclose = (event) => {
      if (socketRef.current !== socket) return;
      socketRef.current = null;
      setStatus("disconnected");
      if (event.code === 1013)
        setNotice("Server is busy. Try again in a moment.");
      else if (event.reason === "idle")
        setNotice("Disconnected after inactivity. Click Reconnect.");
      else if (event.reason === "Too many messages")
        setNotice("Too many requests. Please slow down.");
      else if (event.code === 1008)
        setNotice("Session not accepted. Please log in again.");
    };
  }

  // Connect on load and whenever the language changes.
  useEffect(() => {
    connect(language);
    return disconnect;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Remove hover providers when leaving the page.
  useEffect(() => {
    const list = disposables.current;
    return () => list.forEach((d) => d.dispose());
  }, []);

  return (
    <div className="flex h-[80vh] flex-col overflow-hidden rounded border bg-black border-white/10">
      <div className="flex items-center gap-3 border-b border-white/10 px-3 py-2 text-sm text-white/70">
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
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${DOT[status]}`} />
          {status}
        </span>
        {notice && <span className="text-yellow-500">{notice}</span>}
        {status === "disconnected" && (
          <button
            onClick={() => connect(language)}
            className="rounded px-2 py-1 hover:bg-white/5"
          >
            Reconnect
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          language={language}
          path={`playground/${LANGS[language].file}`}
          defaultValue={LANGS[language].starter}
          onMount={handleMount}
          onChange={handleChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
