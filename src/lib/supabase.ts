import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface OcrRecord {
  id: string
  user_id: string
  image_url: string
  extracted_text: string
  cnpj: string | null
  data: string | null
  total: number | null
  confidence: number | null
  created_at: string
}

export interface UserProfile {
  id: string
  email: string
  is_admin: boolean
  created_at: string
}