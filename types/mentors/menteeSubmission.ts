export type SubmissionStatus =
  | "pending"
  | "evaluating"
  | "completed"
  | "failed";

export type SubmissionData = {
  id: string;
  user_name?: string;
  exercise_name?: string;
  submitted_at?: string;
};


interface ExerciseSubmission {
  answer: string;
  complete_at: string;
  exercise_id: string;
  exercise_name: string;
  feedback: string;
  id: string;
  is_completed: boolean;
  score: number;
  status: SubmissionStatus;
  submitted_at: string;
  user_id: string;
  user_name: string;
}

export type SubmittedExercise  =  Partial<ExerciseSubmission>;

export interface SubmittedExerciseResponse{
    data?: SubmittedExercise[]
}