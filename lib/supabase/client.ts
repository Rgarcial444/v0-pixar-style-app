import { createBrowserClient } from '@supabase/ssr'

const FALLBACK_SUPABASE_URL = "https://lqzoeqxezcadhezhzqgo.supabase.co"
const FALLBACK_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxem9lcXhlemNhZGhlemh6cWdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMTk2NTEsImV4cCI6MjA3MDc5NTY1MX0.TotoiUxPpYy2tQUVSL2pP5cwaEGleymPe5T8DQN8_SY"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_KEY
  
  return createBrowserClient(supabaseUrl, supabaseKey)
}
