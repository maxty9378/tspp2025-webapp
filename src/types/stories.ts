export interface User {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
}

export interface Comment {
  id: string;
  user: User;
  text: string;
  created_at: string;
}

export interface Slide {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  created_at: string;
  likes: number;
  comments: Comment[];
}

export interface Story {
  id: string;
  user: User;
  slides: Slide[];
  created_at: string;
  expires_at: string;
  isPopular?: boolean;
  hashtag?: string;
  viewed?: boolean;
}