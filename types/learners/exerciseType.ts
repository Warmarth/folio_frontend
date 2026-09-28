
export interface ExerciseContent {
  id?: string;
  title: string;
  created_at?: string;
  level?: string;
  description?: string;
  xp_points?:number
};

export interface ExerciseData extends ExerciseContent {
  data: ExerciseContent;
}

export interface ExerciseResponse{
    data : ExerciseData[]
}

