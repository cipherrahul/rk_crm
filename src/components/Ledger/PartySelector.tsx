'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Users, Landmark, X, Check, Edit, Trash2, ChevronDown, Search } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface Party { id: string; name: string }

interface EntityManagerProps {
  parties: Party[]
  selectedPartyId: string | null
  onSelect: (id: string | null) => void
  onAddParty: (name: string, email?: string, password?: string, commissionRate?: number) => Promise<void>
  onUpdateParty: (id: string, name: string) => Promise<void>
  onDeleteParty: (id: string) => Promise<void>
  onAddSource: (name: string) => Promise<void>
}

export default function EntityManager({ parties, selectedPartyId, onSelect, onAddParty, onUpdateParty, onDeleteParty, onAddSource }: EntityManagerProps) {
  const { toast } = useToast()
  const [newPartyName, setNewPartyName] = useState('')
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [newPartyEmail, setNewPartyEmail] = useState('')
  const [newPartyPassword, setNewPartyPassword] = useState('')
  const [newPartyCommission, setNewPartyCommission] = useState('0.5')
  const [newSourceName, setNewSourceName] = useState('')
  const [showAddParty, setShowAddParty] = useState(false)
  const [showAddSource, setShowAddSource] = useState(false)
  const [isAddingParty, setIsAddingParty] = useState(false)
  const [isAddingSource, setIsAddingSource] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [partySearch, setPartySearch] = useState('')
  const partyInputRef = useRef<HTMLInputElement>(null)
  const sourceInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => { if (showAddParty) partyInputRef.current?.focus() }, [showAddParty])
  useEffect(() => { if (showAddSource) sourceInputRef.current?.focus() }, [showAddSource])

  const handleAddParty = async () => {
    if (!newPartyName.trim()) return
    setIsAddingParty(true)
    try {
      await onAddParty(newPartyName.trim(), newPartyEmail.trim() || undefined, newPartyPassword.trim() || undefined, parseFloat(newPartyCommission) || 0)
      setNewPartyName('')
      setNewPartyEmail('')
      setNewPartyPassword('')
      setNewPartyCommission('0.5')
      setShowAddParty(false)
      toast(`Party "${newPartyName.trim()}" added`, 'success')
    } catch (err: any) {
      toast(err.message || 'Failed to add party', 'error')
    } finally { setIsAddingParty(false) }
  }

  const handleUpdateParty = async () => {
    if (!editingPartyId || !editName.trim()) return
    try {
      await onUpdateParty(editingPartyId, editName.trim())
      setEditingPartyId(null)
      toast('Party updated', 'success')
    } catch {
      toast('Failed to update party', 'error')
    }
  }

  const handleDeleteParty = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete party "${name}"? This may affect ledger entries.`)) return
    try {
      await onDeleteParty(id)
      if (selectedPartyId === id) onSelect(null)
      toast('Party deleted', 'success')
    } catch {
      toast('Failed to delete party', 'error')
    }
  }

  const handleAddSource = async () => {
    if (!newSourceName.trim()) return
    setIsAddingSource(true)
    try {
      await onAddSource(newSourceName.trim())
      setNewSourceName('')
      setShowAddSource(false)
      toast(`Source "${newSourceName.trim()}" added`, 'success')
    } catch {
      toast('Failed to add source', 'error')
    } finally { setIsAddingSource(false) }
  }

  return (
    <div className="card mb-3 animate-in-delay-1" style={{ position: 'relative', overflow: 'visible', zIndex: dropdownOpen ? 50 : 1 }}>
      {/* Header */}
      <div className="flex-between mb-2">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Parties</span>
          <span className="badge badge-neutral">{parties.length}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { setShowAddSource(s => !s); setShowAddParty(false) }}>
            <Landmark size={14} /> Add Source
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => { setShowAddParty(s => !s); setShowAddSource(false) }}>
            <Plus size={14} /> Add Party
          </button>
        </div>
      </div>

      {/* Inline Add Party */}
      {showAddParty && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <div className="form-field">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Full Name / Party Name</label>
              <div className="input-wrap has-icon">
                <Users size={14} className="input-icon" />
                <input ref={partyInputRef} type="text" placeholder="e.g. John Doe" value={newPartyName} onChange={e => setNewPartyName(e.target.value)} />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Email (Optional - for Login)</label>
              <div className="input-wrap">
                <input type="email" placeholder="party@example.com" value={newPartyEmail} onChange={e => setNewPartyEmail(e.target.value)} />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Password (for Party)</label>
              <div className="input-wrap">
                <input type="password" placeholder="••••••••" value={newPartyPassword} onChange={e => setNewPartyPassword(e.target.value)} />
              </div>
            </div>
            <div className="form-field">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Commission %</label>
              <div className="input-wrap">
                <input type="number" step="0.01" value={newPartyCommission} onChange={e => setNewPartyCommission(e.target.value)} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.25rem', borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setShowAddParty(false); setNewPartyName('') }}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleAddParty} disabled={isAddingParty || !newPartyName.trim()}>
              {isAddingParty ? 'Adding…' : <><Check size={14} /> Create Party & Account</>}
            </button>
          </div>
        </div>
      )}

      {/* Inline Add Source */}
      {showAddSource && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          <div className="input-wrap has-icon" style={{ flex: 1 }}>
            <Landmark size={15} className="input-icon" />
            <input ref={sourceInputRef} type="text" placeholder="e.g. QuickNPay, SoulPay…" value={newSourceName}
              onChange={e => setNewSourceName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddSource(); if (e.key === 'Escape') setShowAddSource(false) }}
            />
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleAddSource} disabled={isAddingSource || !newSourceName.trim()} style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
            <Check size={14} /> Save
          </button>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setShowAddSource(false); setNewSourceName('') }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Party Dropdown Selection */}
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Select Active Party:</span>
          <button 
            className="btn btn-ghost" 
            style={{ 
              flex: 1, 
              justifyContent: 'space-between', 
              background: 'var(--surface-2)', 
              border: '1px solid var(--border)',
              padding: '0.5rem 1rem',
              height: 'auto',
              minHeight: '40px'
            }}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Users size={16} style={{ color: 'var(--primary)' }} />
              <span style={{ fontWeight: 600 }}>
                {selectedPartyId ? parties.find(p => p.id === selectedPartyId)?.name : 'All Parties'}
              </span>
            </div>
            <ChevronDown size={16} style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>

        {dropdownOpen && (
          <div style={{ 
            position: 'absolute', 
            top: 'calc(100% + 8px)', 
            left: 0, 
            right: 0, 
            background: 'var(--surface)', 
            border: '1px solid var(--border)', 
            borderRadius: 'var(--radius-md)', 
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)', 
            zIndex: 1000,
            overflow: 'hidden',
            maxHeight: '350px',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideUp 0.2s ease-out'
          }}>
            <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
              <div className="input-wrap has-icon">
                <Search size={14} className="input-icon" />
                <input 
                  type="text" 
                  placeholder="Search party…" 
                  value={partySearch} 
                  onChange={e => setPartySearch(e.target.value)} 
                  style={{ fontSize: '0.85rem', padding: '0.5rem 0.5rem 0.5rem 2.25rem' }}
                />
              </div>
            </div>
            
            <div style={{ overflowY: 'auto', padding: '0.5rem' }}>
              <button 
                className={`dropdown-item ${!selectedPartyId ? 'selected' : ''}`}
                style={{ 
                  width: '100%', 
                  textAlign: 'left', 
                  padding: '0.65rem 0.75rem', 
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: !selectedPartyId ? 'var(--surface-3)' : 'transparent',
                  border: 'none',
                  color: !selectedPartyId ? 'var(--primary)' : 'var(--foreground)',
                  cursor: 'pointer',
                  fontWeight: !selectedPartyId ? 700 : 500
                }}
                onClick={() => { onSelect(null); setDropdownOpen(false) }}
              >
                <Landmark size={14} /> All Parties (Summary View)
              </button>

              <div style={{ margin: '0.5rem 0', borderTop: '1px solid var(--border)' }} />

              {parties.filter(p => p.name.toLowerCase().includes(partySearch.toLowerCase())).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                  {editingPartyId === p.id ? (
                    <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '0.5rem', background: 'var(--surface-2)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--primary)' }}>
                      <input 
                        autoFocus
                        style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', fontSize: '0.85rem', flex: 1, outline: 'none' }}
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleUpdateParty(); if (e.key === 'Escape') setEditingPartyId(null) }}
                      />
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={handleUpdateParty} style={{ color: 'var(--success)' }}><Check size={14} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditingPartyId(null)}><X size={14} /></button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-between', padding: '0.25rem', borderRadius: 'var(--radius-sm)', background: selectedPartyId === p.id ? 'var(--surface-2)' : 'transparent' }}>
                      <button 
                        style={{ 
                          flex: 1, 
                          textAlign: 'left', 
                          padding: '0.5rem 0.75rem', 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer',
                          color: selectedPartyId === p.id ? 'var(--primary)' : 'var(--foreground)',
                          fontWeight: selectedPartyId === p.id ? 700 : 500,
                          fontSize: '0.9rem'
                        }}
                        onClick={() => { onSelect(p.id); setDropdownOpen(false) }}
                      >
                        {p.name}
                      </button>
                      <div style={{ display: 'flex', gap: '0.25rem', paddingRight: '0.5rem' }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); setEditingPartyId(p.id); setEditName(p.name) }} title="Edit"><Edit size={13} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); handleDeleteParty(p.id, p.name) }} style={{ color: 'var(--error)' }} title="Delete"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {parties.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                  No parties found. Add one above.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
