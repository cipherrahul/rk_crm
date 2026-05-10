'use client'

import { Calendar, FileDown } from 'lucide-react'

interface DateRangeFilterProps {
  startDate: string
  endDate: string
  onStartChange: (date: string) => void
  onEndChange: (date: string) => void
  onDownload: () => void
}

export default function DateRangeFilter({ startDate, endDate, onStartChange, onEndChange, onDownload }: DateRangeFilterProps) {
  return (
    <div className="card mb-3 animate-in-delay-1" style={{ padding: '0.75rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', flexShrink: 0 }}>
          <Calendar size={16} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Custom Range:</span>
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

        <button 
          onClick={onDownload} 
          className="btn btn-primary btn-sm" 
          title="Download PDF for this range"
        >
          <FileDown size={14} /> Download PDF
        </button>
      </div>
    </div>
  )
}
