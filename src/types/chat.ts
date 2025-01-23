export interface User {
  id: string;
  first_name: string;
  last_name?: string;
  photo_url?: string;
  username?: string;
}

export interface Message {
  id: string;
  user_id: string;
  text: string;
  type: 'text' | 'image';
  image_url?: string;
  reply_to?: {
    id: string;
    text: string;
    image_url?: string;
    user: {
      first_name: string;
    };
  };
  created_at: string;
  updated_at: string;
  likes: number;
  liked_by: string[];
  user: User;
}