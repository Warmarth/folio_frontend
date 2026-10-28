import { MentorsResponse, MentorResponse } from "@/types/learners/mentorTypes";
import { ExerciseResponse, ExerciseData } from "@/types/learners/exerciseType";
import { SubmitExerciseData } from "@/types/learners/submitExercise";
import { ProfileResponse, SingleProfile } from "@/types/learners/users";
import { MePesponse } from "@/types/learners/metype";
import { LearnerType } from "@/types/mentors/menteeType";
import {
  menteeExerciseData,
  menteeExerciseResponse,
} from "@/types/mentors/menteeExercise";
import {
  SubmissionDetailResponse,
  SubmissionFilter,
  SubmittedExerciseResponse,
} from "@/types/mentors/menteeSubmission";
import {
  CallTokenResponse,
  ChatMessageResponse,
  ChatMessagesResponse,
  MySubmissionDetailResponse,
  MySubmissionsResponse,
} from "@/types/learners/codeReview";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("access_token");
  const isForm = options.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${res.status})`);
  }
  return res.json();
}

export function logout() {
  localStorage.removeItem("access_token");
}

export const mentors = {
  getMentor: (id: string) => request<MentorResponse>(`/api/all_mentors/${id}`),
  getMentors: () => request<MentorsResponse>(`/api/all_mentors`),
  getMentorStatus: (id: string) => request(`/api/mentor/${id}/status`),
  postMentorRequest: (id: string) =>
    request(`/api/mentor/${id}/request`, { method: "POST" }),
};

export const exercise = {
  getExercise: () => request<ExerciseResponse>("/api/exercises/all_exercise"),
  getExerciseById: (id: string) =>
    request<ExerciseData>(`/api/exercises/all_exercise/${id}`),
};

export const submitExerciseFunction = {
  postExercise: (id: string, data: SubmitExerciseData) =>
    request(`/api/submit/post_exercise/${id}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getSubmitted: (id: string) => request(`/api/submit/submitted_exercise/${id}`),
};

export const users = {
  getUser: (id: string) => request<SingleProfile>(`/api/all_profile/${id}`),
  getUsers: () => request<ProfileResponse>(`/api/all_profile`),
};

export const me = {
  getMe: () => request<MePesponse>(`/api/profile`),
  uploadProfile: (formdata: FormData) =>
    request(`/api/upload_image`, { method: "POST", body: formdata }),
};

export const learners = {
  getLearners: () => request<LearnerType[]>(`/api/mentor/all_active_mentee`),
};

export const mentorExercise = {
  getExercise: () =>
    request<menteeExerciseResponse>("/api/exercises/all_exercise/mentor"),
  getExerciseById: (id: string) =>
    request<menteeExerciseData>(`/api/exercises/all_exercise/${id}`),
};

export const mentorSubmittedExercise = {
  getAllSubmitted: (filter: SubmissionFilter = "all", page = 1) =>
    request<SubmittedExerciseResponse>(
      `/api/submit/submitted_exercise?filter=${filter}&page=${page}`,
    ),
  getSubmission: (id: string) =>
    request<SubmissionDetailResponse>(`/api/submit/mentor/submission/${id}`),
  reviewSubmission: (id: string, comment: string) =>
    request<SubmissionDetailResponse>(
      `/api/submit/mentor/submission/${id}/review`,
      { method: "POST", body: JSON.stringify({ comment }) },
    ),
};

export const codeReview = {
  getMine: (page = 1) =>
    request<MySubmissionsResponse>(`/api/submit/my_submissions?page=${page}`),
  getOne: (id: string) =>
    request<MySubmissionDetailResponse>(`/api/submit/my_submissions/${id}`),
  getMessages: (id: string) =>
    request<ChatMessagesResponse>(`/api/submit/submission/${id}/messages`),
  sendMessage: (id: string, body: string) =>
    request<ChatMessageResponse>(`/api/submit/submission/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
  getCallToken: (id: string, mode: "video" | "voice") =>
    request<CallTokenResponse>(`/api/submit/submission/${id}/call-token`, {
      method: "POST",
      body: JSON.stringify({ mode }),
    }),
};
