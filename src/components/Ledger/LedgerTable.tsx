'use client'

import { useState, useRef, useEffect } from 'react'
import { Edit, Trash2, FileSpreadsheet, Printer, FileText, Image as ImageIcon, Download, ChevronDown, Search, X } from 'lucide-react'

interface Entry {
  id: string; date: string; mode: string; source: string; utr: string; remark?: string
  received: number; paid: number; commission_rate: number; party_id: string
  party_name?: string
  parties?: { name: string }
}
interface LedgerTableProps {
  entries: Entry[]
  parties: { id: string; name: string }[]
  isAllParties: boolean
  businessName?: string
  readOnly?: boolean
  onEdit: (entry: Entry) => void
  onDelete: (id: string) => Promise<void>
  onExport: (type: 'csv' | 'pdf' | 'image' | 'print') => void
}

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }

function ExportMenu({ onExport }: { onExport: (t: 'csv' | 'pdf' | 'image' | 'print') => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div className="dropdown" ref={ref}>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(o => !o)}>
        <Download size={14} /> Export <ChevronDown size={13} />
      </button>
      {open && (
        <div className="dropdown-menu">
          {[
            { icon: <FileSpreadsheet size={15} />, label: 'CSV Spreadsheet', type: 'csv' as const },
            { icon: <FileText size={15} />, label: 'PDF Document', type: 'pdf' as const },
            { icon: <ImageIcon size={15} />, label: 'Image (.png)', type: 'image' as const },
            { icon: <Printer size={15} />, label: 'Print', type: 'print' as const },
          ].map(item => (
            <button key={item.type} className="dropdown-item" onClick={() => { onExport(item.type); setOpen(false) }}>
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function LedgerTable({ entries, parties, isAllParties, businessName, readOnly, onEdit, onDelete, onExport }: LedgerTableProps) {
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return
    setDeletingId(id)
    await onDelete(id)
    setDeletingId(null)
  }

  if (isAllParties) {
    const summary: Record<string, { received: number; paid: number; pending: number }> = {}
    
    // Initialize with all parties
    parties.forEach(p => {
      summary[p.name] = { received: 0, paid: 0, pending: 0 }
    })

    entries.forEach(e => {
      const party = e.party_name || 'Unknown'
      if (!summary[party]) summary[party] = { received: 0, paid: 0, pending: 0 }
      const com = (e.received * e.commission_rate) / 100
      const net = e.received - com
      summary[party].received += e.received
      summary[party].paid += e.paid
      summary[party].pending += (net - e.paid)
    })

    return (
      <div className="card animate-in-delay-3">
        <div className="flex-between mb-3">
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Party-wise Summary</h3>
            <p className="text-sm text-muted">{Object.keys(summary).length} parties</p>
          </div>
          <ExportMenu onExport={onExport} />
        </div>
        <div id="ledger-content" style={{ background: 'var(--surface)' }}>
          <div className="report-only" style={{ display: 'none', borderBottom: '2px solid black', paddingBottom: '20px', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '24px', margin: 0 }}>{businessName || 'Business Ledger'}</h1>
            <p style={{ margin: '5px 0', fontSize: '14px' }}>Party Wise Financial Summary — {new Date().toLocaleDateString()}</p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Party Name</th>
                  <th>Total Received</th>
                  <th>Total Paid</th>
                  <th>Pending</th>
                  <th>Recovery</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(summary).map(([name, data], idx) => {
                  const recovery = data.received > 0 ? (data.paid / data.received) * 100 : 0
                  return (
                    <tr key={name}>
                      <td className="text-muted text-sm">{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{name}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>{fmt(data.received)}</td>
                      <td style={{ color: 'var(--warning)' }}>{fmt(data.paid)}</td>
                      <td>
                        <span className={`badge ${data.pending > 0 ? 'badge-error' : 'badge-success'}`}>
                          {fmt(data.pending)}
                        </span>
                      </td>
                      <td style={{ minWidth: 120 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="progress-bar" style={{ flex: 1 }}>
                            <div className="progress-fill" style={{ width: `${Math.min(recovery, 100)}%`, background: recovery >= 90 ? 'var(--success)' : recovery >= 50 ? 'var(--warning)' : 'var(--error)' }} />
                          </div>
                          <span className="text-xs text-muted">{recovery.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {Object.keys(summary).length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="report-only" style={{ display: 'none', marginTop: 30, borderTop: '1px solid #ddd', paddingTop: 10, fontSize: 10, color: '#666', textAlign: 'center' }}>
            <p>Computer-generated document. No signature required. | Ledger Pro</p>
          </div>
        </div>
      </div>
    )
  }

  const entriesWithBalance = [...entries].map(e => ({ ...e }))
  const chronological = [...entriesWithBalance].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  let currentBalance = 0
  for (const e of chronological) {
    const com = (e.received * e.commission_rate) / 100
    const net = e.received - com
    currentBalance += (net - e.paid)
    ;(e as any).runningPending = currentBalance
  }

  const filtered = entriesWithBalance.filter(e => {
    const q = search.toLowerCase()
    return !q || e.utr?.toLowerCase().includes(q) || e.mode?.toLowerCase().includes(q) || e.source?.toLowerCase().includes(q) || e.remark?.toLowerCase().includes(q)
  })

  return (
    <div className="card animate-in-delay-3">
      <div className="flex-between mb-3" style={{ flexWrap: 'wrap', gap: '0.75rem' }} data-html2canvas-ignore>
        <div>
          <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Ledger Entries</h3>
          <p className="text-sm text-muted">{filtered.length} of {entries.length} entries</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div className="input-wrap has-icon" style={{ width: 200 }}>
            <Search size={14} className="input-icon" />
            <input type="text" placeholder="Search UTR, mode…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2rem', fontSize: '0.82rem' }} />
          </div>
          {search && <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSearch('')}><X size={13} /></button>}
          <ExportMenu onExport={onExport} />
        </div>
      </div>

      <div id="ledger-content" style={{ background: 'var(--surface)' }}>
        <div className="report-only" style={{ display: 'none', borderBottom: '2px solid black', paddingBottom: '20px', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', margin: 0 }}>{businessName || 'Business Ledger'}</h1>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>Detailed Transaction Ledger — Generated: {new Date().toLocaleString()}</p>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Received</th>
                <th>Date</th>
                <th>Mode / Source</th>
                <th>UTR / Ref</th>
                <th>Remark</th>
                <th>Commission</th>
                <th>Net</th>
                <th>Paid</th>
                <th>Pending</th>
                {!readOnly && <th style={{ width: 80 }}></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const com = (e.received * e.commission_rate) / 100
                const net = e.received - com
                const pending = (e as any).runningPending
                return (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>{fmt(e.received)}</td>
                    <td className="text-sm mono" style={{ whiteSpace: 'nowrap' }}>{e.date}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{e.mode}</div>
                      <div className="text-xs text-muted">{e.source}</div>
                    </td>
                    <td className="mono text-sm" style={{ color: 'var(--muted)' }}>{e.utr || '—'}</td>
                    <td className="text-xs" style={{ color: 'var(--muted)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.remark}>
                      {e.remark || '—'}
                    </td>
                    <td>
                      <div className="text-sm">{fmt(com)}</div>
                      <div className="text-xs text-muted">{e.commission_rate}%</div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{fmt(net)}</td>
                    <td style={{ color: 'var(--warning)' }}>{fmt(e.paid)}</td>
                    <td>
                      <span className={`badge ${pending > 0 ? 'badge-error' : 'badge-success'}`}>
                        {fmt(pending)}
                      </span>
                    </td>
                    {!readOnly && (
                      <td>
                        <div className="table-actions">
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onEdit(e)} title="Edit">
                            <Edit size={13} />
                          </button>
                          <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(e.id)} disabled={deletingId === e.id} title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
                  {search ? 'No entries match your search' : 'No entries yet'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="report-only" style={{ display: 'none', marginTop: 30, borderTop: '1px solid #ddd', paddingTop: 10, fontSize: 10, color: '#666', textAlign: 'center' }}>
          <p>Computer-generated document. No signature required. | Ledger Pro</p>
        </div>
      </div>
    </div>
  )
}
