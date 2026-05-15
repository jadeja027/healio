import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-100',
        secondary: 'border-transparent bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100',
        outline: 'text-slate-700 dark:text-slate-200',
        success: 'border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100',
        warn: 'border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
        danger: 'border-transparent bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
