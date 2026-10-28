"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type TestCaseInput = {
  stdin: string;
  expected_output: string;
  is_hidden: boolean;
};

const LANGUAGES = [
  { value: "go", label: "Go" },
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
];

const MAX_TEST_CASES = 10; // same limit as the backend

// Text copied from JSON has line breaks typed as \n and values wrapped in quotes.
// Fix both: real line breaks, and no wrapping quotes.
function fixPasted(text: string) {
  let t = text;
  if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) t = t.slice(1, -1);
  if (!t.includes("\n") && t.includes("\\n"))
    t = t.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
  return t;
}
const looksPasted = (text: string) => fixPasted(text) !== text;

function PastedWarning({
  text,
  onFix,
}: {
  text: string;
  onFix: (fixed: string) => void;
}) {
  if (!looksPasted(text)) return null;
  return (
    <p className="mt-1 text-xs text-amber-700">
      This looks copied from JSON: it has quote marks or \n typed as text.
      Learners would see it exactly like this.{" "}
      <button
        type="button"
        onClick={() => onFix(fixPasted(text))}
        className="font-medium underline"
      >
        Fix it
      </button>
    </p>
  );
}

export default function CreateExerciseForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [instructions, setInstructions] = useState("");
  const [evaluationCriteria, setEvaluationCriteria] = useState("");

  // Code exercises (category "programming")
  const [language, setLanguage] = useState("go");
  const [starterCode, setStarterCode] = useState("");
  const [testCases, setTestCases] = useState<TestCaseInput[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const isCodeExercise = category === "programming";

  function addTestCase() {
    // The first test is a visible example; later ones default to hidden.
    setTestCases((prev) =>
      prev.length >= MAX_TEST_CASES
        ? prev
        : [
            ...prev,
            { stdin: "", expected_output: "", is_hidden: prev.length > 0 },
          ],
    );
  }

  function updateTestCase(index: number, patch: Partial<TestCaseInput>) {
    setTestCases((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    );
  }

  function removeTestCase(index: number) {
    setTestCases((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    const token = localStorage.getItem("access_token");

    if (!token) {
      setError("You must be logged in as a mentor.");
      setLoading(false);
      return;
    }

    // Ignore rows left completely empty; every other row needs an expected output.
    const cleanTests = isCodeExercise
      ? testCases.filter((t) => t.stdin.trim() || t.expected_output.trim())
      : [];
    if (cleanTests.some((t) => !t.expected_output.trim())) {
      setError("Every test case needs an expected output.");
      setLoading(false);
      return;
    }

    const suspicious =
      isCodeExercise &&
      (looksPasted(starterCode) ||
        cleanTests.some(
          (t) => looksPasted(t.stdin) || looksPasted(t.expected_output),
        ));
    if (
      suspicious &&
      !window.confirm(
        "Some fields look copied from JSON (quote marks or \\n as text). Save anyway?",
      )
    ) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/exercises/create_exercise`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          instructions: instructions.trim(),
          evaluation_criteria: evaluationCriteria.trim(),
          level: difficulty,
          ...(isCodeExercise && {
            language,
            starter_code: starterCode,
            test_cases: cleanTests,
          }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create exercise.");
        return;
      }

      setSuccess(data.message || "Exercise created successfully.");

      setTimeout(() => {
        router.push("/mentor/exercises");
      }, 1000);
    } catch (error) {
      console.error(error);
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-gray-500">Exercises</p>

        <h1 className="mt-1 text-3xl font-bold">Create Exercise</h1>

        <p className="mt-2 text-gray-500">
          Create a practical exercise for your learners.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm"
      >
        {/* Title */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Exercise Title
          </label>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Build a REST API"
            required
            className="w-full rounded-lg border px-4 py-3 outline-none transition focus:border-black"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-2 block text-sm font-medium">Description</label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly explain what this exercise is about..."
            rows={4}
            required
            className="w-full resize-none rounded-lg border px-4 py-3 outline-none transition focus:border-black"
          />
        </div>

        {/* Category + Difficulty */}
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Category</label>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full rounded-lg border bg-white px-4 py-3 outline-none focus:border-black"
            >
              <option value="">Select category</option>
              <option value="programming">Programming</option>
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="database">Database</option>
              <option value="design">Design</option>
              <option value="business">Business</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Difficulty</label>

            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full rounded-lg border bg-white px-4 py-3 outline-none focus:border-black"
            >
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
              <option value="expert">expert</option>
              <option value="possible">Possible</option>
            </select>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <label className="mb-2 block text-sm font-medium">Instructions</label>

          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Tell the learner exactly what they need to do..."
            rows={7}
            required
            className="w-full resize-none rounded-lg border px-4 py-3 outline-none focus:border-black"
          />
        </div>

        {/* Code playground (programming exercises only) */}
        {isCodeExercise && (
          <div className="space-y-5 rounded-xl border bg-gray-50 p-5">
            <div>
              <h2 className="text-lg font-semibold">Code playground</h2>
              <p className="mt-1 text-xs text-gray-500">
                Learners write and run code in the editor. Tests check their
                output when they submit.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Language
                </label>

                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-lg border bg-white px-4 py-3 outline-none focus:border-black"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Starter code{" "}
                <span className="font-normal text-gray-500">(optional)</span>
              </label>

              <textarea
                value={starterCode}
                onChange={(e) => setStarterCode(e.target.value)}
                placeholder="What the editor starts with, e.g. the package line and function signature"
                rows={8}
                spellCheck={false}
                className="w-full resize-y rounded-lg border bg-white px-4 py-3 font-mono text-sm outline-none focus:border-black"
              />
              <PastedWarning text={starterCode} onFix={setStarterCode} />
            </div>

            {/* Test cases */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium">
                  Test cases{" "}
                  <span className="font-normal text-gray-500">
                    ({testCases.length}/{MAX_TEST_CASES})
                  </span>
                </label>

                <button
                  type="button"
                  onClick={addTestCase}
                  disabled={testCases.length >= MAX_TEST_CASES}
                  className="rounded-lg border bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  + Add test case
                </button>
              </div>

              {testCases.length === 0 && (
                <p className="rounded-lg border border-dashed bg-white px-4 py-6 text-center text-sm text-gray-500">
                  No tests yet. Learners can run their code, but they can&apos;t
                  submit until you add tests.
                </p>
              )}

              <div className="space-y-3">
                {testCases.map((test, index) => (
                  <div key={index} className="rounded-lg border bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Test {index + 1}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeTestCase(index)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs text-gray-500">
                          Input (type it exactly, no quotes)
                        </label>
                        <textarea
                          value={test.stdin}
                          onChange={(e) =>
                            updateTestCase(index, { stdin: e.target.value })
                          }
                          rows={3}
                          spellCheck={false}
                          className="w-full resize-y rounded-lg border px-3 py-2 font-mono text-sm outline-none focus:border-black"
                        />
                        <PastedWarning
                          text={test.stdin}
                          onFix={(v) => updateTestCase(index, { stdin: v })}
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs text-gray-500">
                          Expected output (no quotes)
                        </label>
                        <textarea
                          value={test.expected_output}
                          onChange={(e) =>
                            updateTestCase(index, {
                              expected_output: e.target.value,
                            })
                          }
                          rows={3}
                          spellCheck={false}
                          className="w-full resize-y rounded-lg border px-3 py-2 font-mono text-sm outline-none focus:border-black"
                        />
                        <PastedWarning
                          text={test.expected_output}
                          onFix={(v) =>
                            updateTestCase(index, { expected_output: v })
                          }
                        />
                      </div>
                    </div>

                    <label className="mt-3 flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={test.is_hidden}
                        onChange={(e) =>
                          updateTestCase(index, { is_hidden: e.target.checked })
                        }
                      />
                      Hidden from learners
                    </label>
                  </div>
                ))}
              </div>

              {testCases.length > 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  Visible tests are shown to learners as examples. Hidden tests
                  only show pass or fail. Trailing spaces and the final newline
                  are ignored when comparing output.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Evaluation Criteria */}
        <div>
          <label className="mb-2 block text-sm font-medium">
            Evaluation Criteria
          </label>

          <textarea
            value={evaluationCriteria}
            onChange={(e) => setEvaluationCriteria(e.target.value)}
            placeholder="What should the AI look for when evaluating the learner's answer?"
            rows={5}
            className="w-full resize-none rounded-lg border px-4 py-3 outline-none focus:border-black"
          />

          <p className="mt-2 text-xs text-gray-500">
            Only mentors see these criteria. Folio&apos;s AI evaluator can use
            them when scoring submissions.
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
            {success}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t pt-5">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Exercise"}
          </button>
        </div>
      </form>
    </div>
  );
}
