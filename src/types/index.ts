export interface UserProfile {
  id: string;
  username: string;
  first_name: string;
  last_name?: string;
  photo_url?: string;
  points: number;
  visit_count: number;
  last_visit: string;
  last_active: string;
  is_admin: boolean;
  role: 'participant' | 'organizer';
  streak: number;
  created_at: string;
  updated_at: string;
  liked_by?: string[];
  likes?: string[];
  messages?: Array<{
    likes: number;
  }>;
  total_coins_earned?: number;
  daily_likes_given?: number;
  last_like_date?: string;
  greeting_message?: string;
  slogan?: string;
  last_slogan_date?: string;
  achievements?: Achievement[];
  completed_surveys?: number;
  speaker_story_posted?: boolean;
  team_story_posted?: boolean;
  success_story_posted?: boolean;
  team_activity_count?: number;
}

export interface TaskCompletion {
  id: string;
  user_id: string;
  task_type: 'daily' | 'achievement' | 'story';
  completed_at: string;
  points_awarded: number;
  user: {
    id: string;
    first_name: string;
    last_name?: string;
    photo_url?: string;
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  date_earned: string;
  type: 'daily_liker' | 'streak' | 'points';
}