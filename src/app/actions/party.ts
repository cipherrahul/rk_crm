'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPartyWithAccount(name: string, email?: string, password?: string, commissionRate?: number) {
  const supabase = await createServerClient()
  const { data: { user: adminUser } } = await supabase.auth.getUser()

  if (!adminUser) throw new Error('Unauthorized')

  // 1. If email and password provided, create Auth User via Admin Client
  let authUserId = null
  if (email && password) {
    const admin = createAdminClient()
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'party', full_name: name }
    })

    if (authError) throw authError
    authUserId = authData.user?.id

    // Create profile for the new user with 'party' role
    if (authUserId) {
      const { error: profileError } = await admin
        .from('profiles')
        .upsert({ 
          id: authUserId, 
          role: 'party', 
          business_name: name 
        })
      if (profileError) console.error('Profile creation error:', profileError)
    }
  }

  // 2. Create entry in parties table
  const { error: partyError } = await supabase
    .from('parties')
    .insert({ 
      name, 
      user_id: adminUser.id, // Linked to the admin who created it
      linked_auth_id: authUserId, // The actual party's auth user ID
      commission_rate: commissionRate || 0.5
    })

  if (partyError) throw partyError

  revalidatePath('/dashboard')
  return { success: true }
}
