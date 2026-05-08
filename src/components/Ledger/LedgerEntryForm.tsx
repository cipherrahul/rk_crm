'use client'

import { useState, useEffect } from 'react'
import { Save, X, Calendar, Landmark, CreditCard, Hash, IndianRupee, Percent, Calculator } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface Source { id: string; name: string }
interface EntryData {
  id?: string; date: string; mode: string; source: string; utr: string
  received: number; paid: number; commission_rate: number; party_id?: string
}

interface EntryFormProps {
  partyId: string | null
  partyName: string
  sources: Source[]
  onSubmit: (entry: EntryData) => Promise<void>
  initialData?: EntryData
  onCancel?: () => void
}

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

export default function LedgerEntryForm({ partyId, partyName, sources, onSubmit, initialData, onCancel }: EntryFormProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    mode: 'Cash',
    source: '',
    utr: '',
    received: '',
    paid: '',
    commission_rate: '0.5'
  })

  useEffect(() => {
    if (initialData) {
      // Avoid synchronous setState in effect body to satisfy strict lint rules
      const timeout = setTimeout(() => {
        setFormData({
          ...initialData,
          received: initialData.received.toString(),
          paid: initialData.paid.toString(),
          commission_rate: initialData.commission_rate.toString()
        })
      }, 0)
      return () => clearTimeout(timeout)
    }
  }, [initialData])

  const received = parseFloat(formData.received) || 0
  const paid = parseFloat(formData.paid) || 0
  const commRate = parseFloat(formData.commission_rate) || 0
  const commission = (received * commRate) / 100
  const net = received - commission
  const pending = net - paid

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!partyId) { toast('Please select a party first', 'error'); return }
    setSubmitting(true)
    try {
      await onSubmit({ ...formData, party_id: partyId, received, paid, commission_rate: commRate })
      if (!initialData) setFormData(f => ({ ...f, utr: '', received: '', paid: '' }))
      toast(initialData ? 'Entry updated' : 'Entry added successfully', 'success')
    } catch {
      toast('Failed to save entry', 'error')
    } finally { setSubmitting(false) }
  }

  if (!partyId) return null

  const field = (label: string, icon: React.ReactNode, input: React.ReactNode) => (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <div className="input-wrap has-icon">
        <span className="input-icon">{icon}</span>
        {input}
      </div>
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
          {field('UTR / Ref No.', <Hash size={14} />,
            <input type="text" placeholder="Transaction ID" value={formData.utr} onChange={e => setFormData(f => ({ ...f, utr: e.target.value }))} />
          )}
          {field('Received (₹)', <IndianRupee size={14} />,
            <input type="number" step="0.01" placeholder="0.00" value={formData.received} onChange={e => setFormData(f => ({ ...f, received: e.target.value }))} />
          )}
          {field('Paid (₹)', <IndianRupee size={14} />,
            <input type="number" step="0.01" placeholder="0.00" value={formData.paid} onChange={e => setFormData(f => ({ ...f, paid: e.target.value }))} />
          )}
          {field('Commission %', <Percent size={14} />,
            <input type="number" step="0.01" value={formData.commission_rate} onChange={e => setFormData(f => ({ ...f, commission_rate: e.target.value }))} />
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

        <button type="submit" className="btn btn-primary" disabled={submitting} style={{ minWidth: 140 }}>
          {submitting ? '…' : <><Save size={15} /> {initialData ? 'Update Entry' : 'Add Entry'}</>}
        </button>
      </form>
    </div>
  )
}
