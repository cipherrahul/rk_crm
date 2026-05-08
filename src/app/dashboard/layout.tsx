import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import DashboardHeaderClient from './HeaderClient'
import { Wallet } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role || 'admin'

  return (
    <div className="app-shell">
      <Sidebar userEmail={user.email} role={role} />
      <main className="main-content" id="main-content">
        {/* Top Header */}
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)' }}>Live</span>
            </div>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Wallet size={16} style={{ color: 'var(--primary)' }} /> Ledger Pro
            </span>
          </div>
          <DashboardHeaderClient />
        </header>

        {/* Page Content */}
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  )
}
