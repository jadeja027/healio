import { motion } from 'framer-motion'

type Props = {
  score: number
}

function bandColor(score: number) {
  if (score < 40) return { stroke: '#10b981', label: 'Home care' }
  if (score < 70) return { stroke: '#f59e0b', label: 'Clinic visit' }
  return { stroke: '#ef4444', label: 'Emergency care' }
}

export function RiskGauge({ score }: Props) {
  const clamped = Math.min(100, Math.max(0, score))
  const { stroke, label } = bandColor(clamped)
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-40 w-40">
        <svg className="-rotate-90" width="160" height="160" viewBox="0 0 120 120" aria-label={`Risk score ${Math.round(clamped)}`}>
          <circle cx="60" cy="60" r={radius} stroke="currentColor" strokeWidth="10" fill="none" className="text-slate-200 dark:text-slate-800" />
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            stroke={stroke}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={clamped}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
          >
            {Math.round(clamped)}
          </motion.span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Risk score</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>
    </div>
  )
}
