export interface CallOption {
  provider: "jitsi" | "livekit"; // jitsi opens an outside page; livekit opens /call/<id> inside Folio
  label: string;
  available: boolean; // false until the service is set up on the server
  video: string;
  voice: string;
}

// `options` lists every call service turned on; the first is the default, and
// provider/video/voice repeat that default.
export interface CallLinks extends Omit<CallOption, "label"> {
  options?: CallOption[];
}

// A pass to join a LiveKit call, from POST /submission/<id>/call-token
export interface CallToken {
  token: string;
  url: string;
  room: string;
  mode: "video" | "voice";
}

export interface CallTokenResponse {
  data: CallToken;
}

export interface ChatMessage {
  id: string;
  sender_name: string;
  is_mine: boolean;
  body: string;
  created_at: string | null;
}

export interface ChatMessagesResponse {
  data: ChatMessage[];
}

export interface ChatMessageResponse {
  data: ChatMessage;
}

// One row in the learner's list of reviewed code.
export interface MySubmission {
  id: string;
  exercise_name: string;
  mentor_name: string | null;
  is_completed: boolean; // tests passed
  score: number | null;
  passed_tests: number;
  total_tests: number;
  reviewed_at: string | null;
  submitted_at: string | null;
}

export interface MySubmissionsResponse {
  data: MySubmission[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// A test as the learner sees it: hidden tests show only pass or fail.
export interface MyTestResult {
  test_id: string;
  passed: boolean;
  is_hidden: boolean;
  actual_output?: string;
  stderr?: string;
  timed_out?: boolean;
}

export interface MySubmissionDetail {
  id: string;
  exercise_id: string;
  exercise_name: string;
  answer: string;
  status: string;
  score: number | null;
  feedback: string | null; // "Passed 3 of 4 tests." and, after a blank line, the AI's note
  is_completed: boolean;
  test_results: MyTestResult[] | null;
  mentor_comment: string | null;
  reviewed_at: string | null;
  submitted_at: string | null;
  language: string;
  mentor_name: string | null;
  call: CallLinks;
}

export interface MySubmissionDetailResponse {
  data: MySubmissionDetail;
}
