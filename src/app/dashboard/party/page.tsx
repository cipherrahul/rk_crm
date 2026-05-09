'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import SummaryCards from '@/components/Ledger/SummaryCards'
import LedgerTable from '@/components/Ledger/LedgerTable'
import { useToast } from '@/components/Toast'
import { Loader2, ShieldAlert } from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

interface Entry {
  id: string; date: string; mode: string; source: string; utr: string
  received: number; paid: number; commission_rate: number; party_id: string
  party_name?: string
  parties?: { name: string }
}

export default function PartyDashboardPage() {
  const { toast } = useToast()
  const [entries, setEntries] = useState<Entry[]>([])
  const [partyName, setPartyName] = useState('')
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 1. Find the party record linked to this auth user
    const { data: party, error: partyError } = await supabase
      .from('parties')
      .select('id, name')
      .eq('linked_auth_id', user.id)
      .single()

    if (partyError || !party) {
      setUnauthorized(true)
      setLoading(false)
      return
    }

    setPartyName(party.name)

    // 2. Fetch entries for this party
    const { data: entryData } = await supabase
      .from('ledger_entries')
      .select('*, parties(name)')
      .eq('party_id', party.id)
      .order('date', { ascending: false })

    setEntries(entryData?.map(e => ({ ...e, party_name: e.parties?.name })) || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10rem', gap: '1rem' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
      <span style={{ fontWeight: 600, color: 'var(--muted)' }}>Loading your records…</span>
    </div>
  )

  if (unauthorized) return (
    <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
      <ShieldAlert size={48} color="var(--error)" style={{ margin: '0 auto 1rem' }} />
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Account Not Linked</h2>
      <p style={{ color: 'var(--muted)', maxWidth: 400, margin: '0.5rem auto' }}>
        This account is not yet linked to a party record. Please contact the administrator.
      </p>
    </div>
  )

  const totals = entries.reduce((acc, e) => {
    const com = (e.received * e.commission_rate) / 100
    const net = e.received - com
    return { received: acc.received + e.received, paid: acc.paid + e.paid, commission: acc.commission + com, pending: acc.pending + (net - e.paid) }
  }, { received: 0, paid: 0, commission: 0, pending: 0 })

  const handleExport = async (type: 'csv' | 'pdf' | 'image' | 'print') => {
    if (type === 'print') { window.print(); return }
    if (type === 'csv') {
      let csv = 'Date,Mode,Source,UTR,Received,Commission,Net,Paid,Pending\n'
      const entriesWithBalance = [...entries].map(e => ({ ...e }))
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
        csv += `${e.date},${e.mode},${e.source},${e.utr},${e.received},${com.toFixed(2)},${net.toFixed(2)},${e.paid},${((e as any).runningPending).toFixed(2)}\n`
      })
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: `ledger_${partyName}.csv`, style: 'display:none' })
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
        Object.assign(document.createElement('a'), { href: imgData, download: `ledger_${partyName}.png` }).click()
        toast('Image saved', 'success')
      } else {
        const pdf = new jsPDF('p', 'mm', 'a4')
        const w = pdf.internal.pageSize.getWidth()
        pdf.addImage(imgData, 'PNG', 0, 0, w, (canvas.height * w) / canvas.width, undefined, 'FAST')
        pdf.save(`ledger_${partyName}.pdf`)
        toast('PDF saved', 'success')
      }
    } catch {
      element?.classList.remove('printing')
      toast('Export failed', 'error')
    }
  }

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>Welcome, {partyName}</h1>
        <p className="text-muted">Here are your transaction records and current balance.</p>
      </div>

      <SummaryCards 
        totalReceived={totals.received} 
        totalPaid={totals.paid} 
        totalCommission={totals.commission} 
        totalPending={totals.pending} 
      />

      <LedgerTable 
        entries={entries} 
        parties={[]} 
        isAllParties={false} 
        businessName={partyName} 
        readOnly={true}
        onEdit={() => {}} 
        onDelete={async () => {}} 
        onExport={handleExport} 
      />
    </div>
  )
}
