import { createClient } from '@supabase/supabase-js'

export const createAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY // Only available on server

  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing. Please add it to your .env.local')
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
