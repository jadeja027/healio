import { motion } from 'framer-motion'

import { BACK_REGIONS } from '@/lib/bodyMapConfig'

type Props = {
  selectedAreas: string[]
  onToggle: (area: string) => void
}

const baseStyle = {
  stroke: '#0f172a',
  strokeWidth: 1.2,
}

export function BackBodySVG({ selectedAreas, onToggle }: Props) {
  return (
    <svg viewBox="0 0 200 280" className="h-full w-full" role="img" aria-label="Back body map">
      <rect x="54" y="64" width="92" height="112" rx="40" fill="#e2e8f0" opacity="0.35" />
      {BACK_REGIONS.map((region) => {
        const isActive = selectedAreas.includes(region.id)
        return (
          <motion.path
            key={region.id}
            d={region.path}
            fill={isActive ? '#0ea5a4' : '#cbd5f5'}
            opacity={isActive ? 0.9 : 0.5}
            {...baseStyle}
            className="cursor-pointer transition"
            whileHover={{ scale: 1.03, filter: 'drop-shadow(0 0 10px rgba(14,165,164,0.45))' }}
            onClick={() => onToggle(region.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onToggle(region.id)
              }
            }}
            tabIndex={0}
          />
        )
      })}
    </svg>
  )
}
