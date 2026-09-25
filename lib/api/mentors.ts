import { MentorsResponse,MentorProfile } from "@/types/learners/mentorTypes";
import { ExerciseResponse ,Exercise} from "@/types/learners/exerciseType";
import { SubmissionType,SubmitExerciseData } from "@/types/learners/submitExercise";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}




export const mentors = {
    getMentor: (id:string) => request<MentorProfile>(`/api/all_mentors/${id}`),
    getMentors: () => request<MentorsResponse>(`/api/all_mentors`),
    getMentorStatus:(id:string)=> request(`/api/mentor/${id}/status`),
    postMentorRequest:(id:string) => request(`/api/mentor/${id}/request`,{method:'POST'})
}

export const exercise = {
  getExercise:()=> request<ExerciseResponse>('/api/exercises/all_exercise'),
  getExerciseById: (id:string)=> request<Exercise>(`/api/exercises/all_exercise/${id}`)
}

export const submitExerciseFunction = {
  postExercise:(id:string,data:SubmitExerciseData)=> request(`/api/submit/post_exercise/${id}`,{method:'POST',body:JSON.stringify(data)}),
  getSubmitted:(id:string)=> request(`/api/submit/submitted_exercise/${id}`)
}