'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { LogIn, UserPlus, Loader2, KeyRound, Mail } from 'lucide-react'
import { useToast } from '@/components/Toast'

export default function AuthForm({ allowSignUp = false, initialIsSignUp = false }: { allowSignUp?: boolean, initialIsSignUp?: boolean }) {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp)
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isSignUp && allowSignUp) {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } })
        if (error) throw error
        toast('Check your email for the confirmation link!', 'success')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        window.location.href = '/dashboard'
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed'
      toast(message, 'error')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="form-field">
        <label className="form-label" htmlFor="auth-email">Email Address</label>
        <div className="input-wrap has-icon">
          <Mail size={15} className="input-icon" />
          <input id="auth-email" type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="auth-password">Password</label>
        <div className="input-wrap has-icon">
          <KeyRound size={15} className="input-icon" />
          <input id="auth-password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
      </div>

      <button type="submit" className="btn btn-primary w-full" style={{ padding: '0.75rem', marginTop: '0.25rem' }} disabled={loading}>
        {loading ? <Loader2 size={18} className="animate-spin" /> : isSignUp ? <><UserPlus size={17} /> Create Account</> : <><LogIn size={17} /> Sign In</>}
      </button>

      {allowSignUp && (
        <button type="button" className="btn btn-ghost w-full" onClick={() => setIsSignUp(s => !s)}>
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      )}
    </form>
  )
}
