'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import SummaryCards from '@/components/Ledger/SummaryCards'
import LedgerTable from '@/components/Ledger/LedgerTable'
import DateRangeFilter from '@/components/Ledger/DateRangeFilter'
import { useToast } from '@/components/Toast'
import { Loader2, ShieldAlert, KeyRound, Check, X } from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { updateOwnPassword } from '@/app/actions/party'

interface Entry {
  id: string; date: string; mode: string; source: string; utr: string; remark?: string
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
  const [isBlocked, setIsBlocked] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 1. Find the party record linked to this auth user
    const { data: party, error: partyError } = await supabase
      .from('parties')
      .select('id, name, is_blocked')
      .eq('linked_auth_id', user.id)
      .single()

    if (partyError || !party) {
      setUnauthorized(true)
      setLoading(false)
      return
    }

    if (party.is_blocked) {
      setIsBlocked(true)
      setLoading(false)
      return
    }

    setPartyName(party.name)

    // 2. Fetch entries for this party
    let query = supabase
      .from('ledger_entries')
      .select('*, parties(name)')
      .eq('party_id', party.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)

    const { data: entryData } = await query

    setEntries(entryData?.map(e => ({ ...e, party_name: e.parties?.name })) || [])
    setLoading(false)
  }, [supabase, startDate, endDate])

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

  if (isBlocked) return (
    <div className="card" style={{ textAlign: 'center', padding: '5rem', border: '2px solid var(--error)' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--error)' }}>
        <ShieldAlert size={32} />
      </div>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--error)', marginBottom: '0.75rem' }}>Account Restricted</h2>
      <p style={{ color: 'var(--muted)', maxWidth: 450, margin: '0 auto', lineHeight: 1.6, fontSize: '1rem' }}>
        Your account access has been restricted by the administrator. 
        You cannot view your ledger or perform any actions at this time.
      </p>
      <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
        <p className="text-sm text-muted">For support, contact the administrator or reach out via WhatsApp.</p>
      </div>
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
      let csv = 'Date,Mode,Source,UTR,Remark,Received,Commission,Net,Paid,Pending\n'
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
        csv += `${e.date},${e.mode},${e.source},${e.utr},${e.remark || ''},${e.received},${com.toFixed(2)},${net.toFixed(2)},${e.paid},${((e as any).runningPending).toFixed(2)}\n`
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

  const handlePasswordChange = async () => {
    if (!newPassword.trim()) return
    setIsChangingPassword(true)
    try {
      await updateOwnPassword(newPassword.trim())
      setNewPassword('')
      setShowPasswordChange(false)
      toast('Password updated successfully', 'success')
    } catch {
      toast('Failed to update password', 'error')
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="animate-in">
      <div className="flex-between mb-4">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>Welcome, {partyName}</h1>
          <p className="text-muted">Here are your transaction records and current balance.</p>
        </div>
        <div>
          {showPasswordChange ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface-2)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--warning)' }}>
              <input 
                type="password"
                autoFocus
                placeholder="Enter new password"
                style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', fontSize: '0.85rem', outline: 'none', width: '150px' }}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handlePasswordChange(); if (e.key === 'Escape') setShowPasswordChange(false) }}
              />
              <button className="btn btn-ghost btn-icon btn-sm" onClick={handlePasswordChange} disabled={isChangingPassword} style={{ color: 'var(--success)' }}><Check size={14} /></button>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowPasswordChange(false)}><X size={14} /></button>
            </div>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowPasswordChange(true)}>
              <KeyRound size={14} /> Change Password
            </button>
          )}
          <a href="https://wa.me/91870045559" target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ marginLeft: '0.5rem', background: '#25D366', color: '#fff', borderColor: '#25D366' }}>
            Quick Support (WhatsApp)
          </a>
        </div>
      </div>

      <SummaryCards 
        totalReceived={totals.received} 
        totalPaid={totals.paid} 
        totalCommission={totals.commission} 
        totalPending={totals.pending} 
      />

      <DateRangeFilter 
        startDate={startDate} 
        endDate={endDate} 
        onStartChange={setStartDate} 
        onEndChange={setEndDate} 
        onDownload={() => handleExport('pdf')} 
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
