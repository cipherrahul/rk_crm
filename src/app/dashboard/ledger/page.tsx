'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import SummaryCards from '@/components/Ledger/SummaryCards'
import EntityManager from '@/components/Ledger/PartySelector'
import LedgerEntryForm from '@/components/Ledger/LedgerEntryForm'
import LedgerTable from '@/components/Ledger/LedgerTable'
import DateRangeFilter from '@/components/Ledger/DateRangeFilter'
import { useToast } from '@/components/Toast'
import { Loader2 } from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useRouter } from 'next/navigation'
import { createPartyWithAccount, updatePartyPasswordAsAdmin } from '@/app/actions/party'

interface Party { id: string; name: string }
interface Source { id: string; name: string }
interface Entry {
  id: string; date: string; mode: string; source: string; utr: string; remark?: string
  received: number; paid: number; commission_rate: number; party_id: string
  party_name?: string
  parties?: { name: string }
}

export default function LedgerWorkPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [parties, setParties] = useState<Party[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [businessName, setBusinessName] = useState('')
  const [entries, setEntries] = useState<Entry[]>([])
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<Entry | undefined>(undefined)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('business_name, role').eq('id', user.id).single()
      if (profile?.role === 'party') { router.replace('/dashboard/party'); return }
      setBusinessName(profile?.business_name || '')
    }
    const { data: partyData } = await supabase.from('parties').select('*').order('name')
    setParties(partyData || [])
    const { data: sourceData } = await supabase.from('sources').select('*').order('name')
    setSources(sourceData || [])
    
    let query = supabase.from('ledger_entries').select('*, parties(name)').order('date', { ascending: false }).order('created_at', { ascending: false })
    if (selectedPartyId) query = query.eq('party_id', selectedPartyId)
    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)

    const { data: entryData } = await query
    setEntries(entryData?.map(e => ({ ...e, party_name: e.parties?.name })) || [])
    setLoading(false)
  }, [supabase, selectedPartyId, startDate, endDate, router])

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
    fetchData()
  }

  const handleEntrySubmit = async (formData: Omit<Entry, 'id' | 'party_id' | 'party_name' | 'parties'>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not logged in')

    if (formData.utr && formData.utr.trim() !== '' && formData.utr.trim() !== '-' && formData.utr.trim() !== '—') {
      const query = supabase.from('ledger_entries').select('id').eq('utr', formData.utr.trim())
      if (editingEntry) query.neq('id', editingEntry.id)
      const { data: existing } = await query
      if (existing && existing.length > 0) throw new Error(`UTR "${formData.utr.trim()}" already exists.`)
    }

    if (editingEntry) {
      const { error } = await supabase.from('ledger_entries').update(formData).eq('id', editingEntry.id)
      if (error) throw error
      setEditingEntry(undefined)
    } else {
      const { error } = await supabase.from('ledger_entries').insert({ ...formData, user_id: user.id })
      if (error) throw error
    }
    fetchData()
  }

  const handleDeleteEntry = async (id: string) => {
    const { error } = await supabase.from('ledger_entries').delete().eq('id', id)
    if (error) { toast(error.message, 'error'); return }
    toast('Entry deleted', 'success')
    fetchData()
  }

  const handleExport = async (type: 'csv' | 'pdf' | 'image' | 'print') => {
    if (type === 'print') { window.print(); return }
    const exportData = entries
    if (type === 'csv') {
      let csv = 'Date,Party,Mode,Source,UTR,Remark,Received,Paid\n'
      exportData.forEach(e => { csv += `${e.date},${e.party_name},${e.mode},${e.source},${e.utr},${e.remark || ''},${e.received},${e.paid}\n` })
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: `ledger.csv`, style: 'display:none' })
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      return
    }
    const element = document.getElementById('ledger-content')
    if (!element) return
    element.classList.add('printing')
    await new Promise(r => setTimeout(r, 100))
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
    element.classList.remove('printing')
    const imgData = canvas.toDataURL('image/png', 1.0)
    if (type === 'image') {
      Object.assign(document.createElement('a'), { href: imgData, download: `ledger.png` }).click()
    } else {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const w = pdf.internal.pageSize.getWidth()
      pdf.addImage(imgData, 'PNG', 0, 0, w, (canvas.height * w) / canvas.width)
      pdf.save(`ledger.pdf`)
    }
  }

  const totals = entries.reduce((acc, e) => {
    const com = (e.received * e.commission_rate) / 100
    const net = e.received - com
    return { received: acc.received + e.received, paid: acc.paid + e.paid, commission: acc.commission + com, pending: acc.pending + (net - e.paid) }
  }, { received: 0, paid: 0, commission: 0, pending: 0 })

  const selectedParty = parties.find(p => p.id === selectedPartyId)
  const selectedPartyName = selectedParty?.name || ''
  const selectedPartyCommission = (selectedParty as any)?.commission_rate || 0.5

  return (
    <div className="animate-in">
      <div className="mb-4">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Ledger Management</h1>
        <p className="text-muted">Manage transactions and entry records.</p>
      </div>

      <SummaryCards totalReceived={totals.received} totalPaid={totals.paid} totalCommission={totals.commission} totalPending={totals.pending} />

      <DateRangeFilter 
        startDate={startDate} 
        endDate={endDate} 
        onStartChange={setStartDate} 
        onEndChange={setEndDate} 
        onDownload={() => handleExport('pdf')} 
        parties={parties}
        selectedPartyId={selectedPartyId}
        onPartyChange={setSelectedPartyId}
      />

      <EntityManager 
        parties={parties} 
        selectedPartyId={selectedPartyId} 
        onSelect={setSelectedPartyId} 
        onAddParty={handleAddParty} 
        onUpdateParty={handleUpdateParty}
        onDeleteParty={handleDeleteParty}
        onAddSource={handleAddSource} 
        onUpdatePassword={updatePartyPasswordAsAdmin}
        hideManagement={true}
      />

      <LedgerEntryForm 
        partyId={selectedPartyId} 
        partyName={selectedPartyName} 
        defaultCommissionRate={selectedPartyCommission} 
        sources={sources} 
        onSubmit={handleEntrySubmit} 
        initialData={editingEntry} 
        onCancel={editingEntry ? () => setEditingEntry(undefined) : undefined} 
      />

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><Loader2 size={28} className="animate-spin text-muted" /></div>
      ) : (
        <LedgerTable entries={entries} parties={parties} isAllParties={!selectedPartyId} businessName={businessName} onEdit={(e) => setEditingEntry(e)} onDelete={handleDeleteEntry} onExport={handleExport} />
      )}
    </div>
  )
}
