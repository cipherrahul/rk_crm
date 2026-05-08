'use client'

import { TrendingUp, TrendingDown, Percent, AlertCircle } from 'lucide-react'

interface SummaryProps {
  totalReceived: number
  totalPaid: number
  totalCommission: number
  totalPending: number
}

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

export default function SummaryCards({ totalReceived, totalPaid, totalCommission, totalPending }: SummaryProps) {
  const cards = [
    {
      label: 'Total Received',
      value: fmt(totalReceived),
      icon: <TrendingUp size={20} />,
      iconColor: '#10b981',
      iconBg: 'rgba(16,185,129,0.12)',
      trend: 'up' as const,
      trendText: 'Inflow',
      delay: 'animate-in',
      glow: 'rgba(16,185,129,0.08)'
    },
    {
      label: 'Commission Earned',
      value: fmt(totalCommission),
      icon: <Percent size={20} />,
      iconColor: 'var(--primary)',
      iconBg: 'var(--primary-glow)',
      trend: 'neutral' as const,
      trendText: totalReceived > 0 ? ((totalCommission / totalReceived) * 100).toFixed(1) + '% rate' : '—',
      delay: 'animate-in-delay-1',
      glow: 'rgba(99,102,241,0.06)'
    },
    {
      label: 'Total Paid Out',
      value: fmt(totalPaid),
      icon: <TrendingDown size={20} />,
      iconColor: '#64748b',
      iconBg: 'rgba(100,116,139,0.12)',
      trend: 'neutral' as const,
      trendText: 'Outflow',
      delay: 'animate-in-delay-2',
      glow: 'rgba(100,116,139,0.06)'
    },
    {
      label: 'Pending Balance',
      value: fmt(totalPending),
      icon: <AlertCircle size={20} />,
      iconColor: '#f59e0b',
      iconBg: 'rgba(245,158,11,0.12)',
      trend: totalPending > 0 ? 'warn' as const : 'up' as const,
      trendText: totalPending > 0 ? 'Action needed' : 'All clear ✓',
      delay: 'animate-in-delay-3',
      glow: totalPending > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.06)'
    }
  ]

  return (
    <div className="grid-4 mb-4">
      {cards.map((c, i) => (
        <div key={i} className={`stat-card ${c.delay}`} style={{ '--card-glow': c.glow } as React.CSSProperties}>
          <div className="stat-icon" style={{ background: c.iconBg, color: c.iconColor }}>
            {c.icon}
          </div>
          <div className="stat-label">{c.label}</div>
          <div className="stat-value">{c.value}</div>
          <span className={`stat-trend ${c.trend}`}>{c.trendText}</span>
        </div>
      ))}
    </div>
  )
}
