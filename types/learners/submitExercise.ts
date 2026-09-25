export type SubmissionType = {
  id?: string;
  answer?: string;
  score?: number;
  feedback?: string;
  is_completed?: boolean;
};

export type SubmitExerciseProps = {
  exerciseId: string;
};

export interface SubmitExerciseData {
  answer: string;
}