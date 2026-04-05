"use client"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const hasSupabaseConfig = !!(supabaseUrl && supabaseKey)

export const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseKey) : null

export type Database = {
  public: {
    Tables: {
      stories: {
        Row: {
          id: string
          title: string
          text: string
          created_at: string
          updated_at: string
          image_url: string | null
          image_type?: string | null
        }
        Insert: {
          id?: string
          title: string
          text: string
          created_at?: string
          updated_at?: string
          image_url?: string | null
          image_type?: string | null
        }
        Update: {
          id?: string
          title?: string
          text?: string
          created_at?: string
          updated_at?: string
          image_url?: string | null
          image_type?: string | null
        }
      }
    }
  }
}

export function isSupabaseAvailable(): boolean {
  return hasSupabaseConfig && supabase !== null
}
