'use client'

import { useState, useEffect } from 'react'
import { Save, X, Calendar, Landmark, CreditCard, Hash, IndianRupee, Percent, Calculator, Loader2 } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { createClient } from '@/utils/supabase/client'

interface Source { id: string; name: string }
interface EntryData {
  id?: string; date: string; mode: string; source: string; utr: string; remark?: string
  received: number; paid: number; commission_rate: number; extra_charge?: number; party_id?: string
}

interface EntryFormProps {
  partyId: string | null
  partyName: string
  defaultCommissionRate?: number
  sources: Source[]
  onSubmit: (entry: EntryData) => Promise<void>
  initialData?: EntryData
  onCancel?: () => void
}

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

export default function LedgerEntryForm({ partyId, partyName, defaultCommissionRate = 0.5, sources, onSubmit, initialData, onCancel }: EntryFormProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [utrChecking, setUtrChecking] = useState(false)
  const [utrError, setUtrError] = useState('')
  const supabase = createClient()
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    mode: 'Cash',
    source: '',
    utr: '',
    remark: '',
    received: '',
    paid: '',
    extra_charge: '',
    commission_rate: defaultCommissionRate.toString()
  })

  // Update commission rate if defaultCommissionRate changes (e.g. when changing party)
  useEffect(() => {
    if (!initialData && partyId) {
      setFormData(f => ({ ...f, commission_rate: defaultCommissionRate.toString() }))
    }
  }, [defaultCommissionRate, partyId, initialData])

  useEffect(() => {
    if (initialData) {
      // Avoid synchronous setState in effect body to satisfy strict lint rules
      const timeout = setTimeout(() => {
        setFormData({
          ...initialData,
          remark: initialData.remark || '',
          received: initialData.received.toString(),
          paid: initialData.paid.toString(),
          extra_charge: (initialData as any).extra_charge?.toString() || '',
          commission_rate: initialData.commission_rate.toString()
        })
      }, 0)
      return () => clearTimeout(timeout)
    }
  }, [initialData])

  useEffect(() => {
    const utr = formData.utr.trim()
    if (!utr || utr === '-' || utr === '—') {
      setUtrError('')
      setUtrChecking(false)
      return
    }

    setUtrChecking(true)
    setUtrError('')

    const timeout = setTimeout(async () => {
      const query = supabase.from('ledger_entries').select('id').eq('utr', utr)
      if (initialData?.id) query.neq('id', initialData.id)
      
      const { data, error } = await query
      if (!error && data && data.length > 0) {
        setUtrError('This UTR already exists')
      }
      setUtrChecking(false)
    }, 500)

    return () => clearTimeout(timeout)
  }, [formData.utr, initialData?.id, supabase])

  const received = parseFloat(formData.received) || 0
  const paid = parseFloat(formData.paid) || 0
  const extraCharge = parseFloat(formData.extra_charge) || 0
  const commRate = parseFloat(formData.commission_rate) || 0
  const commission = (received * commRate) / 100
  const net = received - commission - extraCharge
  const pending = net - paid

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!partyId) { toast('Please select a party first', 'error'); return }
    setSubmitting(true)
    try {
      await onSubmit({ ...formData, party_id: partyId, received, paid, commission_rate: commRate, extra_charge: extraCharge })
      if (!initialData) setFormData(f => ({ ...f, utr: '', remark: '', received: '', paid: '', extra_charge: '' }))
      toast(initialData ? 'Entry updated' : 'Entry added successfully', 'success')
    } catch (err: any) {
      toast(err.message || 'Failed to save entry', 'error')
    } finally { setSubmitting(false) }
  }

  if (!partyId) return (
    <div className="card animate-in-delay-2 mb-3" style={{ border: '2px dashed var(--border)', background: 'var(--surface-2)', padding: '2.5rem', textAlign: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '0.5rem' }}>
          <Calculator size={24} />
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No Party Selected</h3>
        <p className="text-muted text-sm" style={{ maxWidth: '300px' }}>
          Please select a party from the dropdown above to add a new transaction record to their ledger.
        </p>
      </div>
    </div>
  )

  const field = (label: string, icon: React.ReactNode, input: React.ReactNode, error?: string, loading?: boolean) => (
    <div className="form-field">
      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
        {label}
        {loading && <Loader2 size={12} className="animate-spin text-muted" />}
      </label>
      <div className="input-wrap has-icon">
        <span className="input-icon">{icon}</span>
        {input}
      </div>
      {error && <div style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: 500 }}>{error}</div>}
    </div>
  )

  return (
    <div className="card animate-in-delay-2 mb-3">
      <div className="flex-between mb-3">
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '2px' }}>
            {initialData ? '✏️ Edit Entry' : '+ New Entry'}
          </h3>
          <p className="text-sm text-muted">Party: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{partyName}</span></p>
        </div>
        {onCancel && <button className="btn btn-ghost btn-sm" onClick={onCancel}><X size={14} /> Cancel</button>}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          {field('Date', <Calendar size={14} />,
            <input type="date" value={formData.date} onChange={e => setFormData(f => ({ ...f, date: e.target.value }))} required />
          )}
          {field('Mode', <Landmark size={14} />,
            <select value={formData.mode} onChange={e => setFormData(f => ({ ...f, mode: e.target.value }))}>
              <option>Cash</option>
              <option>Cash Deposit</option>
              <option>CDM Deposit</option>
              <option>UPI</option>
            </select>
          )}
          {field('Source', <CreditCard size={14} />,
            <select value={formData.source} onChange={e => setFormData(f => ({ ...f, source: e.target.value }))}>
              <option value="">Select Source</option>
              {sources.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              <option>Other</option>
            </select>
          )}
          {field('Received (₹)', <IndianRupee size={14} />,
            <input type="number" step="0.01" placeholder="0.00" value={formData.received} onChange={e => setFormData(f => ({ ...f, received: e.target.value }))} />
          )}
          {field('UTR / Ref No.', <Hash size={14} />,
            <input type="text" placeholder="Transaction ID" value={formData.utr} onChange={e => setFormData(f => ({ ...f, utr: e.target.value }))} style={{ borderColor: utrError ? 'var(--error)' : undefined }} />,
            utrError,
            utrChecking
          )}
          {field('Commission %', <Percent size={14} />,
            <input type="number" step="0.01" value={formData.commission_rate} onChange={e => setFormData(f => ({ ...f, commission_rate: e.target.value }))} />
          )}
          {field('Paid (₹)', <IndianRupee size={14} />,
            <input type="number" step="0.01" placeholder="0.00" value={formData.paid} onChange={e => setFormData(f => ({ ...f, paid: e.target.value }))} />
          )}
          {field('Extra Charge (₹)', <IndianRupee size={14} />,
            <input type="number" step="0.01" placeholder="0.00" value={formData.extra_charge} onChange={e => setFormData(f => ({ ...f, extra_charge: e.target.value }))} />
          )}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          {field('Remark / Note', <Calculator size={14} />,
            <input type="text" placeholder="Add any extra details here..." value={formData.remark} onChange={e => setFormData(f => ({ ...f, remark: e.target.value }))} />
          )}
        </div>

        {/* Live Preview */}
        {received > 0 && (
          <div className="preview-panel mb-3">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <Calculator size={14} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live Calculation</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              {[
                { label: 'Received', value: fmt(received), color: 'var(--success)' },
                { label: `Commission (${commRate}%)`, value: fmt(commission), color: 'var(--primary)' },
                { label: 'Extra Charge', value: fmt(extraCharge), color: 'var(--error)' },
                { label: 'Net Amount', value: fmt(net), color: 'var(--foreground)' },
                { label: 'Pending', value: fmt(pending), color: pending > 0 ? 'var(--warning)' : 'var(--success)' }
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{item.label}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: item.color, letterSpacing: '-0.02em' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={submitting || utrChecking || !!utrError} style={{ minWidth: 140 }}>
          {submitting ? '…' : <><Save size={15} /> {initialData ? 'Update Entry' : 'Add Entry'}</>}
        </button>
      </form>
    </div>
  )
}
