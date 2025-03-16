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
      study_logs: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          date?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          notification_frequency: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          notification_frequency?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          notification_frequency?: string
          created_at?: string
        }
      }
      problem_logs: {
        Row: {
          id: string
          user_id: string
          topic_id: string
          problems_completed: number
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          topic_id: string
          problems_completed: number
          date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          topic_id?: string
          problems_completed?: number
          date?: string
          created_at?: string
        }
      }
      topics: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
    }
    Views: {
      study_logs_with_users: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          date: string
          created_at: string
          email: string
          full_name: string | null
        }
      }
    }
  }
} 