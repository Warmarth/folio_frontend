export type UserProfile = {
  name?: string;
  email?: string;
  bio?: string;
  image_url?: string;
  created_at?: string;
  item_count?: number;
  view_count?: number;
};


export interface MePesponse{
  data :{
          email?: string;
          profile?: Partial<UserProfile>;
        }
        | null
        | undefined;
}