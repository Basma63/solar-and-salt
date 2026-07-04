import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export type DailyDiesel = {
  id: string
  date: string
  opening_balance: number
  received_today: number
  distributed_today: number
  remaining: number
  created_at: string
  updated_at: string
}

export type DieselTransaction = {
  id: string
  type: 'received' | 'distributed'
  date: string
  quantity: number
  supplier?: string
  recipient?: string
  notes?: string
  created_at: string
  updated_at: string
}

export type DailySalt = {
  id: string
  date: string
  opening_balance: number
  production_today: number
  distributed_today: number
  remaining: number
  created_at: string
  updated_at: string
}

export type SaltTransaction = {
  id: string
  type: 'production' | 'distributed'
  date: string
  operating_hours?: number
  production_per_hour?: number
  production?: number
  quantity?: number
  recipient?: string
  notes?: string
  created_at: string
  updated_at: string
}
