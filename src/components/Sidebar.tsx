'use client'

import { useState, useEffect } from 'react'
import { LayoutDashboard, Settings, LogOut, Wallet, ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

function ThemeToggleInline() {
  const [mounted, setMounted] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    // Avoid synchronous setState in effect body to satisfy strict lint rules
    const timeout = setTimeout(() => {
      setMounted(true)
      setDark(document.documentElement.getAttribute('data-theme') === 'dark')
    }, 0)
    return () => clearTimeout(timeout)
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button onClick={toggle} className="btn btn-ghost btn-icon" title="Toggle theme" style={{ flexShrink: 0 }}>
      {!mounted ? <div style={{ width: 16, height: 16 }} /> : dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}

function getInitials(email?: string | null) {
  if (!email) return 'U'
  return email.split('@')[0].slice(0, 2).toUpperCase()
}

export default function Sidebar({ userEmail, role = 'admin' }: { userEmail?: string | null, role?: string }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  // Sync with main content layout
  useEffect(() => {
    const main = document.getElementById('main-content')
    if (main) {
      if (collapsed) main.classList.add('sidebar-collapsed')
      else main.classList.remove('sidebar-collapsed')
    }
  }, [collapsed])

  // Auto-collapse on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setCollapsed(true)
      else setCollapsed(false)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const navItems = role === 'admin' 
    ? [
        { href: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        { href: '/dashboard/settings', icon: <Settings size={18} />, label: 'Settings' },
      ]
    : [
        { href: '/dashboard/party', icon: <LayoutDashboard size={18} />, label: 'My Ledger' },
        { href: '/dashboard/settings', icon: <Settings size={18} />, label: 'Settings' },
      ]

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo"><Wallet size={18} /></div>
        <span className="sidebar-title">Ledger Pro</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {!collapsed && <div className="section-title" style={{ marginTop: '0.5rem' }}>Menu</div>}
        {navItems.map(item => (
          <Link key={item.href} href={item.href} className={`sidebar-link ${pathname === item.href ? 'active' : ''}`} title={collapsed ? item.label : undefined}>
            <span style={{ flexShrink: 0 }}>{item.icon}</span>
            <span className="sidebar-link-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* User */}
        <div className="sidebar-user" title={collapsed ? (userEmail || '') : undefined}>
          <div className="sidebar-avatar">{getInitials(userEmail)}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-role">Account</div>
            <div className="sidebar-user-email">{userEmail}</div>
          </div>
        </div>

        {/* Actions row */}
        <div style={{ display: 'flex', gap: '0.4rem', padding: '0 0.25rem', marginBottom: '0.5rem' }}>
          <ThemeToggleInline />
          {!collapsed && (
            <form action="/auth/signout" method="post" style={{ flex: 1 }}>
              <button className="btn btn-ghost w-full" style={{ color: 'var(--error)', justifyContent: 'flex-start', fontSize: '0.82rem' }}>
                <LogOut size={15} /> Logout
              </button>
            </form>
          )}
          {collapsed && (
            <form action="/auth/signout" method="post">
              <button className="btn btn-ghost btn-icon" title="Logout" style={{ color: 'var(--error)' }}>
                <LogOut size={15} />
              </button>
            </form>
          )}
        </div>

        {/* Collapse toggle */}
        <button className="sidebar-collapse-btn" onClick={() => setCollapsed(c => !c)}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          <span className="sidebar-collapse-btn-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Collapse</span>
        </button>
      </div>
    </aside>
  )
}
