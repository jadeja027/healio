import { motion } from 'framer-motion'
import { X } from 'lucide-react'

import { useBodyMap } from '@/contexts/BodyMapContext'
import { BODY_AREA_LABELS } from '@/lib/bodyMapConfig'

export function SelectedAreas() {
  const { selectedAreas, removeArea, clearAreas } = useBodyMap()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected areas</p>
        {selectedAreas.length > 0 && (
          <button
            type="button"
            onClick={clearAreas}
            className="text-xs font-semibold text-slate-500 transition hover:text-teal-600"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {selectedAreas.length === 0 && <span className="text-sm text-slate-500">No areas selected yet.</span>}
        {selectedAreas.map((area) => (
          <motion.span
            key={area}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/40 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm dark:bg-slate-900/40 dark:text-slate-200"
          >
            {BODY_AREA_LABELS[area] ?? area}
            <button type="button" onClick={() => removeArea(area)} className="text-slate-400 hover:text-red-500">
              <X className="h-3 w-3" />
            </button>
          </motion.span>
        ))}
      </div>
    </div>
  )
}
