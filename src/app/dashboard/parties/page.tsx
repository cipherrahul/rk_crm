'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import EntityManager from '@/components/Ledger/PartySelector'
import { useToast } from '@/components/Toast'
import { Loader2, Users } from 'lucide-react'
import { createPartyWithAccount, updatePartyPasswordAsAdmin, togglePartyBlock } from '@/app/actions/party'
import { useRouter } from 'next/navigation'

export default function PartiesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [parties, setParties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role === 'party') { 
        router.replace('/dashboard/party')
        return 
      }
    }

    const { data } = await supabase.from('parties').select('*').order('name')
    setParties(data || [])
    setLoading(false)
  }, [supabase, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddParty = async (name: string, email?: string, password?: string, commissionRate?: number) => {
    const result = await createPartyWithAccount(name, email, password, commissionRate)
    if (result?.error) throw new Error(result.error)
    fetchData()
  }

  const handleUpdateParty = async (id: string, name: string) => {
    const { error } = await supabase.from('parties').update({ name }).eq('id', id)
    if (error) throw error
    fetchData()
  }

  const handleDeleteParty = async (id: string) => {
    const { error } = await supabase.from('parties').delete().eq('id', id)
    if (error) throw error
    fetchData()
  }

  const handleAddSource = async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not logged in')
    const { error } = await supabase.from('sources').insert({ name, user_id: user.id })
    if (error) throw error
    toast('Source added', 'success')
  }

  return (
    <div className="animate-in">
      <div className="mb-4">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={22} style={{ color: 'var(--primary)' }} /> Manage Parties
        </h1>
        <p className="text-muted text-sm">Create and manage your parties and their login accounts.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={24} className="animate-spin text-muted" />
        </div>
      ) : (
        <EntityManager 
          parties={parties} 
          selectedPartyId={null} 
          onSelect={() => {}} 
          onAddParty={handleAddParty} 
          onUpdateParty={handleUpdateParty}
          onDeleteParty={handleDeleteParty}
          onAddSource={handleAddSource} 
          onUpdatePassword={updatePartyPasswordAsAdmin}
          onToggleBlock={async (id, blocked) => {
            await togglePartyBlock(id, blocked)
            fetchData()
          }}
        />
      )}
    </div>
  )
}
