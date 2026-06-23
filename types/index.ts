export interface Profile {
  id: string
  username: string
  created_at: string
}

export interface Entry {
  id: string
  user_id: string
  date: string          // ISO date string YYYY-MM-DD
  items: string[]
  created_at: string
  updated_at: string
  day_number?: number    // computed, never stored
}

export interface GuestEntry {
  date: string
  items: string[]
}
