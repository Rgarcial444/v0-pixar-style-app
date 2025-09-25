"use client"

import { createClient } from "@supabase/supabase-js"

// Configuración para tu proyecto de Supabase
const supabaseUrl = "https://lqzoeqxezcadhezhzqgo.supabase.co"

// Tu clave anon de Supabase
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxem9lcXhlemNhZGhlemh6cWdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMTk2NTEsImV4cCI6MjA3MDc5NTY1MX0.TotoiUxPpYy2tQUVSL2pP5cwaEGleymPe5T8DQN8_SY"

export const hasSupabaseConfig = !!(supabaseUrl && supabaseKey)

// Create Supabase client
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
          image_type?: string | null // Hacer opcional
        }
        Insert: {
          id?: string
          title: string
          text: string
          created_at?: string
          updated_at?: string
          image_url?: string | null
          image_type?: string | null // Hacer opcional
        }
        Update: {
          id?: string
          title?: string
          text?: string
          created_at?: string
          updated_at?: string
          image_url?: string | null
          image_type?: string | null // Hacer opcional
        }
      }
    }
  }
}

// Helper function to check if Supabase is available
export function isSupabaseAvailable(): boolean {
  return hasSupabaseConfig && supabase !== null
}
