import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { cn } from '../../lib/utils'

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      <main className={cn('flex-1 transition-all duration-300 min-w-0', collapsed ? 'ml-16' : 'ml-60')}>
        <div className="p-6 min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
