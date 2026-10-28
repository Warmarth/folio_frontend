// One example test shown to learners. Hidden tests carry no input or expected output.
export interface ExampleTest {
  id: string;
  stdin?: string;
  expected_output?: string;
  is_hidden: boolean;
}

export type ExerciseLanguage = "go" | "python" | "javascript" | "typescript";

export interface ExerciseContent {
  id?: string;
  title: string;
  created_at?: string;
  level?: string;
  description?: string;
  xp_points?: number;

  // new: set by the exercise form
  category?: string;
  instructions?: string;
  language?: ExerciseLanguage;
  starter_code?: string;
  examples?: ExampleTest[];
  test_count?: number;
}

export interface ExerciseData extends ExerciseContent {
  data: ExerciseContent;
}

export interface ExerciseResponse {
  data: ExerciseData[];
}
