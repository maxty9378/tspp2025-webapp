export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      stories: {
        Row: {
          id: string
          user_id: string
          created_at: string
          expires_at: string
          viewed: boolean
        }
        Insert: {
          user_id: string
          expires_at: string
          viewed?: boolean
        }
        Update: {
          viewed?: boolean
        }
      }
      story_slides: {
        Row: {
          id: string
          story_id: string
          media_url: string
          media_type: string
          created_at: string
          likes: number
          liked_by: string[]
        }
        Insert: {
          story_id: string
          media_url: string
          media_type: string
          likes?: number
          liked_by?: string[]
        }
        Update: {
          likes?: number
          liked_by?: string[]
        }
      }
      users: {
        Row: {
          id: string
          username: string
          first_name: string
          last_name: string | null
          photo_url: string | null
          points: number
          visit_count: number
          last_visit: string
          last_active: string
          is_admin: boolean
          role: 'participant' | 'organizer'
          streak: number
          created_at: string
          updated_at: string
          liked_by: string[] | null
          likes: string[] | null
          total_coins_earned: number | null
          daily_likes_given: number | null
          last_like_date: string | null
          greeting_message: string | null
          preset_applied: boolean | null
          achievements: Json[] | null
        }
        Insert: {
          id: string
          username: string
          first_name: string
          last_name?: string | null
          photo_url?: string | null
          points?: number
          visit_count?: number
          last_visit?: string
          last_active?: string
          is_admin?: boolean
          role?: 'participant' | 'organizer'
          streak?: number
          liked_by?: string[] | null
          likes?: string[] | null
          total_coins_earned?: number | null
          daily_likes_given?: number | null
          last_like_date?: string | null
          greeting_message?: string | null
          preset_applied?: boolean | null
          achievements?: Json[] | null
        }
        Update: {
          username?: string
          first_name?: string
          last_name?: string | null
          photo_url?: string | null
          points?: number
          visit_count?: number
          last_visit?: string
          last_active?: string
          is_admin?: boolean
          role?: 'participant' | 'organizer'
          streak?: number
          updated_at?: string
          liked_by?: string[] | null
          likes?: string[] | null
          total_coins_earned?: number | null
          daily_likes_given?: number | null
          last_like_date?: string | null
          greeting_message?: string | null
          preset_applied?: boolean | null
          achievements?: Json[] | null
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}