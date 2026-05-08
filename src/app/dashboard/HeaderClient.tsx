'use client'

import { useState, useEffect } from 'react'
import { CalendarDays } from 'lucide-react'

function LiveDate() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{greeting}</span>
      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <CalendarDays size={13} style={{ color: 'var(--muted)' }} />
        {now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
      </span>
    </div>
  )
}

export default function DashboardHeaderClient() {
  return <LiveDate />
}
