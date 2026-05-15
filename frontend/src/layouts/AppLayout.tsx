import { Outlet } from 'react-router-dom'

import { DisclaimerBar } from '@/components/DisclaimerBar'

export function AppLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <div className="flex-1">
        <Outlet />
      </div>
      <DisclaimerBar />
    </div>
  )
}
