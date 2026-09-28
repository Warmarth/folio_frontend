export type Profile = {
  id: string;
  name?: string;
  email?: string;
  bio?: string;
  image_url?: string;
  total_xp?:number
  created_at?: string;
};

export interface ProfileResponse{
    data:Profile[]
}
export interface SingleProfile{
    data:{
      data?:Profile | null
    }
}
