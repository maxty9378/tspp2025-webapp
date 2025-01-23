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
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  is_admin?: boolean;
  [key: string]: any;
}

export interface AdminAction {
  type: 'ADD_POINTS' | 'RESET_STATS' | 'MAKE_ADMIN' | 'SET_ROLE' | 'UPDATE_USER_DATA';
  points?: number;
  role?: 'participant' | 'organizer';
  presetData?: {
    firstName: string;
    lastName: string;
    photoUrl: string;
  };
}