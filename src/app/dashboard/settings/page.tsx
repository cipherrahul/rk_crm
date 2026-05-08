import SettingsForm from '@/components/SettingsForm'
import { Settings as SettingsIcon } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="animate-in">
      <div className="mb-4">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
          <SettingsIcon size={22} style={{ color: 'var(--primary)' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Settings</h1>
        </div>
        <p className="text-muted text-sm">Manage your business profile and preferences</p>
      </div>
      <SettingsForm />
    </div>
  )
}
