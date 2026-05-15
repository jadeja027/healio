import { AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'

import type { EmergencyPrecautions } from '@/types'

type Props = {
  precautions: EmergencyPrecautions | null
  loading: boolean
}

export function EmergencyPrecautionsPanel({ precautions, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3 rounded-2xl border border-white/30 bg-white/40 p-4 shadow-lg backdrop-blur dark:bg-slate-900/40">
        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200/80 dark:bg-slate-700/80" />
        <div className="h-3 w-full animate-pulse rounded bg-slate-200/80 dark:bg-slate-700/80" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-slate-200/80 dark:bg-slate-700/80" />
      </div>
    )
  }

  if (!precautions) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/30 bg-white/50 p-4 shadow-lg backdrop-blur dark:bg-slate-900/40"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-red-500/10 p-2 text-red-500">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{precautions.title}</p>
          <p className="text-xs text-slate-600 dark:text-slate-300">Severity: {precautions.severity}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-200">
        {precautions.precautions.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-red-600 dark:text-red-300">
        Disclaimer: This guidance is not a substitute for professional care. Call emergency services immediately.
      </p>
    </motion.div>
  )
}
