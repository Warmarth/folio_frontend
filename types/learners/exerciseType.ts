
export interface Exercise  {
  data: {};
  id?: string;
  title: string;
  created_at?: string;
  level?: string;
  description?: string;
};

export interface ExerciseResponse{
    data : Exercise[]
}

