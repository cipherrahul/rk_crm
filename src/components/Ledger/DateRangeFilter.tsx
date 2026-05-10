import { Calendar, FileDown, Users } from 'lucide-react'

interface DateRangeFilterProps {
  startDate: string
  endDate: string
  onStartChange: (date: string) => void
  onEndChange: (date: string) => void
  onDownload: () => void
  parties?: { id: string; name: string }[]
  selectedPartyId?: string | null
  onPartyChange?: (id: string | null) => void
}

export default function DateRangeFilter({ 
  startDate, endDate, onStartChange, onEndChange, onDownload, 
  parties, selectedPartyId, onPartyChange 
}: DateRangeFilterProps) {
  return (
    <div className="card mb-3 animate-in-delay-1" style={{ padding: '0.75rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        {/* Date Range Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', flexShrink: 0 }}>
            <Calendar size={16} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Range:</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
            <div className="input-wrap" style={{ flex: 1 }}>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => onStartChange(e.target.value)} 
                style={{ fontSize: '0.85rem', padding: '0.35rem 0.5rem' }} 
              />
            </div>
            <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>to</span>
            <div className="input-wrap" style={{ flex: 1 }}>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => onEndChange(e.target.value)} 
                style={{ fontSize: '0.85rem', padding: '0.35rem 0.5rem' }} 
              />
            </div>
          </div>
        </div>

        {/* Party Selection Section */}
        {parties && onPartyChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '220px', borderLeft: '1px solid var(--border)', paddingLeft: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', flexShrink: 0 }}>
              <Users size={16} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Party:</span>
            </div>
            <div className="input-wrap" style={{ 
              flex: 1, 
              position: 'relative',
              transition: 'all 0.2s ease',
              border: '1px solid transparent'
            }}>
              <input 
                type="text"
                list="party-list"
                placeholder="Type name to search..."
                defaultValue={parties.find(p => p.id === selectedPartyId)?.name || ''}
                key={selectedPartyId || 'none'}
                onChange={e => {
                  const val = e.target.value
                  const found = parties.find(p => p.name.toLowerCase() === val.toLowerCase())
                  if (found) {
                    onPartyChange(found.id)
                  } else if (val === '') {
                    onPartyChange(null)
                  }
                }}
                style={{ 
                  fontSize: '0.85rem', 
                  padding: '0.35rem 0.5rem', 
                  background: 'transparent', 
                  border: 'none', 
                  width: '100%',
                  fontWeight: 600,
                  outline: 'none',
                  color: 'var(--primary)'
                }}
              />
              <datalist id="party-list">
                <option value="All Parties (Summary)" />
                {parties.map(p => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
            </div>
          </div>
        )}

        <button 
          onClick={onDownload} 
          className="btn btn-primary btn-sm" 
          style={{ 
            height: '36px', 
            padding: '0 1.25rem',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          title="Download PDF for this selection"
        >
          <FileDown size={14} /> Download PDF
        </button>
      </div>
    </div>
  )
}
