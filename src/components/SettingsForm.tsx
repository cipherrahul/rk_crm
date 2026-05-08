'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Save, Building2, Coins, Loader2, Shield } from 'lucide-react'
import { useToast } from '@/components/Toast'

export default function SettingsForm() {
  const { toast } = useToast()
  const [profile, setProfile] = useState({ business_name: '', currency: 'INR' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) setProfile(data)
      }
      setLoading(false)
    }
    getProfile()
  }, [supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error } = await supabase.from('profiles').upsert({ id: user.id, ...profile })
      if (error) toast(error.message, 'error')
      else toast('Settings saved successfully', 'success')
    }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', gap: '0.75rem', color: 'var(--muted)' }}>
      <Loader2 size={22} className="animate-spin" style={{ color: 'var(--primary)' }} />
      <span style={{ fontSize: '0.9rem' }}>Loading settings…</span>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 640 }}>
      <div className="card animate-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <Building2 size={20} />
          </div>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Business Profile</h3>
            <p className="text-sm text-muted">Appears on exported reports and PDFs</p>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-field">
            <label className="form-label" htmlFor="biz-name">Business Name</label>
            <div className="input-wrap has-icon">
              <Building2 size={15} className="input-icon" />
              <input
                id="biz-name"
                type="text"
                value={profile.business_name || ''}
                onChange={e => setProfile(p => ({ ...p, business_name: e.target.value }))}
                placeholder="e.g. Acme Ledger Solutions"
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="currency">Preferred Currency</label>
            <div className="input-wrap has-icon">
              <Coins size={15} className="input-icon" />
              <select
                id="currency"
                value={profile.currency}
                onChange={e => setProfile(p => ({ ...p, currency: e.target.value }))}
              >
                <option value="INR">₹ Indian Rupee (INR)</option>
                <option value="USD">$ US Dollar (USD)</option>
                <option value="EUR">€ Euro (EUR)</option>
                <option value="GBP">£ British Pound (GBP)</option>
              </select>
            </div>
          </div>

          <div style={{ paddingTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: 140 }}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save Settings</>}
            </button>
          </div>
        </form>
      </div>

      {/* Info card */}
      <div className="card animate-in-delay-1" style={{ borderLeft: '3px solid var(--primary)' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <Shield size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.3rem' }}>Data Security</p>
            <p className="text-sm text-muted" style={{ lineHeight: 1.6 }}>Your data is stored securely on Supabase with row-level security. Only you can access your ledger entries and party records.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
