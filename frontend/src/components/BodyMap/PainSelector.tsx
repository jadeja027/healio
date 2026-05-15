import { motion } from 'framer-motion'

import { useBodyMap } from '@/contexts/BodyMapContext'

const LEVELS = [
  { label: 'Mild', emoji: '😊', value: 2 },
  { label: 'Light', emoji: '🙂', value: 4 },
  { label: 'Moderate', emoji: '😐', value: 6 },
  { label: 'Severe', emoji: '😣', value: 8 },
  { label: 'Extreme', emoji: '😭', value: 10 },
]

export function PainSelector() {
  const { painLevel, setPainLevel } = useBodyMap()

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pain severity</p>
      <div className="grid grid-cols-5 gap-2">
        {LEVELS.map((level) => {
          const active = painLevel === level.value
          return (
            <motion.button
              key={level.label}
              type="button"
              onClick={() => setPainLevel(level.value)}
              className={`flex flex-col items-center justify-center rounded-2xl border px-2 py-3 text-sm transition ${
                active
                  ? 'border-teal-500 bg-teal-500/10 text-teal-700 shadow-lg dark:text-teal-200'
                  : 'border-white/20 bg-white/40 text-slate-600 hover:border-teal-300 dark:bg-slate-900/40 dark:text-slate-300'
              }`}
              whileTap={{ scale: 0.96 }}
              whileHover={{ y: -2 }}
            >
              <span className="text-xl">{level.emoji}</span>
              <span className="text-[11px] font-medium">{level.label}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
