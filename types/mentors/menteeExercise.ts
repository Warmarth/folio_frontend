
export interface menteeExerciseData  {
  data: Record<string, unknown>;
  id?: string;
  title: string;
  created_at?: string;
  level?: string;
  description?: string;
  xp_points?:number
};


export type Exercise = {
  title?: string;
  description?: string;
  level?: string;
  category?: string;
  xp_points?: number;
  created_at?: string;
  instructions?: string;
  evaluation_criteria?: string;
};

export interface menteeExerciseResponse{
    data : menteeExerciseData[]
}

