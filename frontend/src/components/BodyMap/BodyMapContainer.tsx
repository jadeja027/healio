import { motion } from 'framer-motion'
import { useState } from 'react'

import { BackBodySVG } from '@/components/BodyMap/BackBodySVG'
import { BodySummaryGenerator } from '@/components/BodyMap/BodySummaryGenerator'
import { FrontBodySVG } from '@/components/BodyMap/FrontBodySVG'
import { PainSelector } from '@/components/BodyMap/PainSelector'
import { SelectedAreas } from '@/components/BodyMap/SelectedAreas'
import { useBodyMap } from '@/contexts/BodyMapContext'

export function BodyMapContainer() {
  const { selectedAreas, toggleArea } = useBodyMap()
  const [view, setView] = useState<'front' | 'back'>('front')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">Body pain map</p>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Tap areas where it hurts</h2>
        </div>
        <div className="flex rounded-2xl border border-white/30 bg-white/40 p-1 shadow-sm backdrop-blur dark:bg-slate-900/40">
          {(['front', 'back'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setView(tab)}
              className={`rounded-xl px-3 py-1 text-xs font-semibold transition ${
                view === tab ? 'bg-teal-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {tab === 'front' ? 'Front view' : 'Back view'}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={view}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/30 bg-gradient-to-br from-white/70 via-white/30 to-teal-100/30 p-4 shadow-xl backdrop-blur dark:from-slate-900/60 dark:via-slate-900/30 dark:to-teal-900/30"
      >
        <div className="mx-auto h-[320px] w-full max-w-[320px]">
          {view === 'front' ? (
            <FrontBodySVG selectedAreas={selectedAreas} onToggle={toggleArea} />
          ) : (
            <BackBodySVG selectedAreas={selectedAreas} onToggle={toggleArea} />
          )}
        </div>
      </motion.div>

      <PainSelector />
      <SelectedAreas />
      <BodySummaryGenerator />
    </div>
  )
}
