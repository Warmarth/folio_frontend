import { CallLinks } from "@/types/learners/codeReview";

export type SubmissionFilter = "all" | "pending" | "fail" | "done";

// One row in the mentor's list (light: no code, no per-test details).
export interface SubmittedExercise {
  id: string;
  user_name: string | null;
  exercise_id: string;
  exercise_name: string;
  status: string;
  score: number | null;
  is_completed: boolean; // tests passed
  passed_tests: number;
  total_tests: number;
  reviewed_at: string | null;
  submitted_at: string | null;
}

export interface SubmissionPagination {
  page: number;
  per_page: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface SubmittedExerciseResponse {
  data: SubmittedExercise[];
  counts: Record<SubmissionFilter, number>;
  pagination: SubmissionPagination;
}

// One test of a submission, as the mentor sees it (hidden tests included).
export interface SubmissionTestResult {
  test_id: string;
  number: number | null;
  passed: boolean;
  is_hidden: boolean;
  stdin: string | null;
  expected_output: string | null;
  actual_output?: string;
  stderr?: string;
  exit_code?: number | null;
  timed_out?: boolean;
  duration_ms?: number | null;
}

export interface SubmissionDetailData {
  id: string;
  user_id: string;
  user_name: string | null;
  exercise_id: string;
  exercise_name: string;
  answer: string;
  status: string;
  score: number | null;
  feedback: string | null;
  is_completed: boolean;
  test_results: SubmissionTestResult[] | null;
  mentor_comment: string | null;
  reviewed_at: string | null;
  submitted_at: string | null;
  call?: CallLinks;
}

export interface SubmissionDetailResponse {
  data: SubmissionDetailData;
}
