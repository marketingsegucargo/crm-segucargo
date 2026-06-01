import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  trend?: { value: number; label: string }
}

const colors = {
  blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600' },
  green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600' },
  red:    { bg: 'bg-red-50',    icon: 'bg-red-100 text-red-600' },
  yellow: { bg: 'bg-yellow-50', icon: 'bg-yellow-100 text-yellow-600' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600' },
}

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }: Props) {
  const c = colors[color]
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', trend.value >= 0 ? 'text-green-600' : 'text-red-600')}>
              <span>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className="text-gray-400 font-normal">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', c.icon)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}
