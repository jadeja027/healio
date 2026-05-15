import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

type ProgressProps = HTMLAttributes<HTMLDivElement> & {
  value: number
}

export function Progress({ className, value, ...props }: ProgressProps) {
  const v = Math.min(100, Math.max(0, value))
  return (
    <div
      className={cn('relative h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800', className)}
      {...props}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500 ease-out"
        style={{ width: `${v}%` }}
      />
    </div>
  )
}
