export type User = {
  id: string
  name: string | null
  email: string
  password: string
  role: string
  plan: string
  email_verified: boolean
  verify_token: string | null
  reset_token: string | null
  reset_token_exp: string | null
  avatar: string | null
  daily_edits_used: number
  daily_edits_date: string
  bonus_edits: number
  referral_code: string | null
  referred_by: string | null
  premium_until: string | null
  created_at: string
  updated_at: string
}

export type DbSession = {
  id: string
  session_token: string
  user_id: string
  expires: string
}

export type DbFile = {
  id: string
  user_id: string
  file_name: string
  file_size: number
  file_type: string
  tool_used: string | null
  created_at: string
}

export type Visit = {
  id: string
  page: string
  ip: string | null
  user_agent: string | null
  created_at: string
}

export type SiteStats = {
  id: string
  total_visits: number
  total_users: number
  total_files: number
  total_conversions: number
}

export type Question = {
  id: string
  email: string
  question: string
  created_at: string
}

export type BugReport = {
  id: string
  user_id: string
  user_name: string
  user_email: string
  title: string
  description: string
  status: string
  created_at: string
}

export type Review = {
  id: string
  user_id: string
  user_name: string
  user_email: string
  text: string
  stars: number
  created_at: string
}
