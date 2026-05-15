import { ClipboardCopy } from 'lucide-react'
import { motion } from 'framer-motion'

import { useBodyMap } from '@/contexts/BodyMapContext'

export function BodySummaryGenerator() {
  const { summary } = useBodyMap()

  if (!summary) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/30 bg-white/40 p-3 text-sm text-slate-600 shadow-sm backdrop-blur dark:bg-slate-900/40 dark:text-slate-300"
    >
      <div className="flex items-start gap-2">
        <ClipboardCopy className="mt-0.5 h-4 w-4 text-teal-500" />
        <span>{summary}</span>
      </div>
    </motion.div>
  )
}
