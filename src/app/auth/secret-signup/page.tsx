import AuthForm from '@/components/Auth/AuthForm'
import { Wallet, ShieldCheck, Zap, BarChart3, FileDown, Lock } from 'lucide-react'

const features = [
  { icon: <Zap size={18} />, text: 'Real-time ledger tracking' },
  { icon: <ShieldCheck size={18} />, text: 'Secure Supabase backend' },
  { icon: <BarChart3 size={18} />, text: 'Party-wise financial summaries' },
  { icon: <FileDown size={18} />, text: 'PDF, CSV & image export' },
]

export default function SecretSignUpPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left — Brand Hero */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem',
        background: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
            <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}>
              <Wallet size={22} color="white" />
            </div>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white', letterSpacing: '-0.03em' }}>Ledger Pro</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: 'white', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '1.25rem' }}>
            Administrator<br />
            <span style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Registration Portal
            </span>
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 380, marginBottom: '2.5rem' }}>
            This is a private registration page for authorized administrators only.
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)', marginBottom: '0.5rem' }}>
            <Lock size={16} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Private Portal</span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.4rem' }}>Create Admin</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Set up your administrator credentials.</p>
        </div>
        
        <AuthForm allowSignUp={true} initialIsSignUp={true} />
        
        <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <p>© RK Institution 2026. All rights reserved.</p>
          <p style={{ fontWeight: 600 }}>Developed by RK Institution</p>
          <a href="https://wa.me/919818490248" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>
            +91 98184 90248
          </a>
        </div>
      </div>
    </main>
  )
}
