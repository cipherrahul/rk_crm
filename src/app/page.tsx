import AuthForm from '@/components/Auth/AuthForm'
import { Wallet, ShieldCheck, Zap, BarChart3, FileDown } from 'lucide-react'

const features = [
  { icon: <Zap size={18} />, text: 'Real-time ledger tracking' },
  { icon: <ShieldCheck size={18} />, text: 'Secure Supabase backend' },
  { icon: <BarChart3 size={18} />, text: 'Party-wise financial summaries' },
  { icon: <FileDown size={18} />, text: 'PDF, CSV & image export' },
]

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left — Brand Hero */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem',
        background: 'linear-gradient(145deg, #09090b 0%, #1a0a2e 50%, #0d1a2e 100%)',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
            <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}>
              <Wallet size={22} color="white" />
            </div>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white', letterSpacing: '-0.03em' }}>Ledger Pro</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: 'white', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '1.25rem' }}>
            The smarter way to<br />
            <span style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              manage your ledger.
            </span>
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 380, marginBottom: '2.5rem' }}>
            Track payments, commissions, and party accounts in real time. Built for financial professionals.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                <div style={{ color: '#818cf8', flexShrink: 0 }}>{f.icon}</div>
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Auth Panel */}
      <div style={{
        width: 'min(480px, 100%)', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '3rem 2.5rem',
        background: 'var(--background)', borderLeft: '1px solid var(--border)'
      }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.4rem' }}>Welcome back</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Sign in to your Ledger Pro account</p>
        </div>
        <AuthForm />
        <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <p>© RK Institution 2026. All rights reserved.</p>
          <p style={{ fontWeight: 600 }}>Developed by RK Institution</p>
          <p>For more software related query contact us on WhatsApp:</p>
          <a href="https://wa.me/919818490248" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>
            +91 98184 90248
          </a>
        </div>
      </div>
    </main>
  )
}
