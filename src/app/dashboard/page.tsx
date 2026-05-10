'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import SummaryCards from '@/components/Ledger/SummaryCards'
import EntityManager from '@/components/Ledger/PartySelector'
import LedgerEntryForm from '@/components/Ledger/LedgerEntryForm'
import LedgerTable from '@/components/Ledger/LedgerTable'
import DateRangeFilter from '@/components/Ledger/DateRangeFilter'
import { useToast } from '@/components/Toast'
import { Loader2, Calendar, Search, X } from 'lucide-react'
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

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [parties, setParties] = useState<Party[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [businessName, setBusinessName] = useState('')
  const [entries, setEntries] = useState<Entry[]>([])
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<Entry | undefined>(undefined)
  const [selectedMonth, setSelectedMonth] = useState('All')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [masterSearch, setMasterSearch] = useState('')
  const [masterResults, setMasterResults] = useState<Entry[]>([])
  const [masterChecking, setMasterChecking] = useState(false)
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
    
    if (selectedMonth !== 'All') {
      const [year, month] = selectedMonth.split('-')
      const monthStart = `${year}-${month}-01`
      const endDateVal = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]
      query = query.gte('date', monthStart).lte('date', endDateVal)
    }

    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)

    const { data: entryData } = await query
    setEntries(entryData?.map(e => ({ ...e, party_name: e.parties?.name })) || [])
    setLoading(false)
  }, [supabase, selectedPartyId, selectedMonth, startDate, endDate, router])

  useEffect(() => {
    const timeout = setTimeout(() => { fetchData() }, 0)
    return () => clearTimeout(timeout)
  }, [fetchData])


  const handleAddParty = async (name: string, email?: string, password?: string, commissionRate?: number) => {
    const result = await createPartyWithAccount(name, email, password, commissionRate)
    if (result?.error) {
      throw new Error(result.error)
    }
    fetchData()
  }

  const handleUpdateParty = async (id: string, name: string) => {
    const { error } = await supabase.from('parties').update({ name }).eq('id', id)
    if (error) throw error
    fetchData()
  }

  useEffect(() => {
    const q = masterSearch.trim()
    if (!q) {
      setMasterResults([])
      setMasterChecking(false)
      return
    }

    setMasterChecking(true)
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('ledger_entries')
        .select('*, parties(name)')
        .ilike('utr', `%${q}%`)
        .order('date', { ascending: true })
      
      if (data) {
        setMasterResults(data.map(d => ({ ...d, party_name: d.parties?.name })))
      } else {
        setMasterResults([])
      }
      setMasterChecking(false)
    }, 500)

    return () => clearTimeout(timeout)
  }, [masterSearch, supabase])

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

    // Check UTR Uniqueness
    if (formData.utr && formData.utr.trim() !== '' && formData.utr.trim() !== '-' && formData.utr.trim() !== '—') {
      const query = supabase.from('ledger_entries').select('id').eq('utr', formData.utr.trim())
      if (editingEntry) query.neq('id', editingEntry.id)
      const { data: existing } = await query
      if (existing && existing.length > 0) {
        throw new Error(`UTR "${formData.utr.trim()}" already exists. UTR must be unique.`)
      }
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
    const exportData = masterSearch ? masterResults : entries
    if (type === 'csv') {
      let csv = 'Date,Party,Mode,Source,UTR,Remark,Received,Commission,Net,Paid,Pending\n'
      const entriesWithBalance = [...exportData].map(e => ({ ...e }))
      const chronological = [...entriesWithBalance].sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })

      let currentBalance = 0
      chronological.forEach(e => {
        const com = (e.received * e.commission_rate) / 100
        const net = e.received - com
        currentBalance += (net - e.paid)
        ;(e as any).runningPending = currentBalance
      })

      entriesWithBalance.forEach(e => {
        const com = (e.received * e.commission_rate) / 100
        const net = e.received - com
        csv += `${e.date},${e.party_name},${e.mode},${e.source},${e.utr},${e.remark || ''},${e.received},${com.toFixed(2)},${net.toFixed(2)},${e.paid},${((e as any).runningPending).toFixed(2)}\n`
      })
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: `ledger_${selectedPartyId || 'all'}.csv`, style: 'display:none' })
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      toast('CSV exported', 'success')
      return
    }
    const element = document.getElementById('ledger-content')
    if (!element) { toast('Export element not found', 'error'); return }
    try {
      element.classList.add('printing')
      await new Promise(r => setTimeout(r, 100))
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: element.scrollWidth, windowHeight: element.scrollHeight })
      element.classList.remove('printing')
      const imgData = canvas.toDataURL('image/png', 1.0)
      if (type === 'image') {
        Object.assign(document.createElement('a'), { href: imgData, download: `ledger_${selectedPartyId || 'all'}.png` }).click()
        toast('Image saved', 'success')
      } else {
        const pdf = new jsPDF('p', 'mm', 'a4')
        const w = pdf.internal.pageSize.getWidth()
        pdf.addImage(imgData, 'PNG', 0, 0, w, (canvas.height * w) / canvas.width, undefined, 'FAST')
        pdf.save(`ledger_${selectedPartyId || 'all'}.pdf`)
        toast('PDF saved', 'success')
      }
    } catch {
      element?.classList.remove('printing')
      toast('Export failed. Check console.', 'error')
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

  const months = ['All']
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`)
  }

  return (
    <div className="animate-in">
      {/* Master Search */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--surface-2)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        <Search size={18} style={{ color: 'var(--primary)' }} />
        <input 
          type="text" 
          placeholder="Master Search: Find any transaction by UTR number across all parties and months..."
          value={masterSearch}
          onChange={e => setMasterSearch(e.target.value)}
          style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', color: 'var(--foreground)' }}
        />
        {masterChecking && <Loader2 size={16} className="animate-spin text-muted" />}
        {masterSearch && <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setMasterSearch('')}><X size={16} /></button>}
      </div>

      {masterSearch && (
        <div className="card mb-4" style={{ border: '2px solid var(--primary)', animation: 'slideUp 0.3s ease-out' }}>
          <div className="flex-between mb-3">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em' }}>Master Search Results</h3>
            <span className="badge badge-neutral">{masterResults.length} found</span>
          </div>
          {masterChecking ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 size={24} className="animate-spin text-muted" /></div>
          ) : masterResults.length > 0 ? (
            <LedgerTable entries={masterResults} parties={parties} isAllParties={true} businessName={businessName} onEdit={(e) => setEditingEntry(e)} onDelete={handleDeleteEntry} onExport={handleExport} />
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)', fontSize: '0.9rem' }}>No transactions found matching "{masterSearch}".</div>
          )}
        </div>
      )}

      {!masterSearch && (
        <>
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

          {/* Month Filter */}
          <div className="card mb-3" style={{ padding: '0.75rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', flexShrink: 0, paddingRight: '0.5rem', borderRight: '1px solid var(--border)' }}>
                <Calendar size={15} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Filter by Month</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {months.map(m => {
                  const label = m === 'All' ? 'All Time' : new Date(m + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  return (
                    <button 
                      key={m} 
                      className={`party-chip ${selectedMonth === m ? 'selected' : ''}`} 
                      onClick={() => setSelectedMonth(m)}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '5rem', gap: '1rem', color: 'var(--muted)' }}>
              <Loader2 size={28} className="animate-spin" style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Updating statistics…</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
