'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPartyWithAccount(name: string, email?: string, password?: string, commissionRate?: number) {
  const supabase = await createServerClient()
  const { data: { user: adminUser } } = await supabase.auth.getUser()

  if (!adminUser) return { error: 'Unauthorized' }

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

    if (authError) return { error: authError.message }
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

  if (partyError) return { error: partyError.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function updatePartyPasswordAsAdmin(partyId: string, newPassword: string) {
  const supabase = await createServerClient()
  const { data: { user: adminUser } } = await supabase.auth.getUser()
  if (!adminUser) throw new Error('Unauthorized')

  const { data: party } = await supabase.from('parties').select('linked_auth_id').eq('id', partyId).single()
  if (!party || !party.linked_auth_id) throw new Error('Party has no linked account')

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(party.linked_auth_id, { password: newPassword })
  if (error) throw error

  return { success: true }
}

export async function updateOwnPassword(newPassword: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
  return { success: true }
}

export async function togglePartyBlock(partyId: string, blocked: boolean) {
  const supabase = await createServerClient()
  const { data: { user: adminUser } } = await supabase.auth.getUser()
  if (!adminUser) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('parties')
    .update({ is_blocked: blocked })
    .eq('id', partyId)

  if (error) throw error
  
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/parties')
  revalidatePath('/dashboard/ledger')
  
  return { success: true }
}
