export interface MentorProfile {
  data: any;
id?:string
  name?: string;
  user_id?: string;
  email?: string;
  image_url?: string;
  bio?: string;
  expertise?: string;
}

export interface MentorsResponse{
 data :MentorProfile[]
}

export type RelationshipStatus = "active" | "pending" | "declined" | "ended";

export interface Relationship {
  id?: string;
  learner_id?: string;
  mentor_id?: string;
  status?: RelationshipStatus;
  learner_name?: string;
  mentor_name?: string;
  requested_at?: string;
  responded_at?: string;
  ended_at?: string;
}