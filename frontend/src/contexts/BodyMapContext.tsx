import { createContext, useContext, useMemo, useState } from 'react'

import type { BodyMapPayload } from '@/types'
import { BODY_AREA_LABELS } from '@/lib/bodyMapConfig'

type BodyMapState = {
  selectedAreas: string[]
  painLevel: number
  toggleArea: (area: string) => void
  removeArea: (area: string) => void
  clearAreas: () => void
  setPainLevel: (level: number) => void
  summary: string
  payload: BodyMapPayload
}

const BodyMapContext = createContext<BodyMapState | null>(null)

function buildSummary(selectedAreas: string[], painLevel: number) {
  if (selectedAreas.length === 0) return ''
  const labels = selectedAreas.map((area) => BODY_AREA_LABELS[area] ?? area)
  return `Patient reports pain in ${labels.join(', ')} with severity ${painLevel}/10.`
}

export function BodyMapProvider({ children }: { children: React.ReactNode }) {
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [painLevel, setPainLevel] = useState(6)

  function toggleArea(area: string) {
    setSelectedAreas((prev) => (prev.includes(area) ? prev.filter((item) => item !== area) : [...prev, area]))
  }

  function removeArea(area: string) {
    setSelectedAreas((prev) => prev.filter((item) => item !== area))
  }

  function clearAreas() {
    setSelectedAreas([])
  }

  const summary = useMemo(() => buildSummary(selectedAreas, painLevel), [selectedAreas, painLevel])

  const payload = useMemo<BodyMapPayload>(
    () => ({
      body_areas: selectedAreas,
      pain_level: painLevel,
      summary,
    }),
    [selectedAreas, painLevel, summary],
  )

  const value = useMemo(
    () => ({
      selectedAreas,
      painLevel,
      toggleArea,
      removeArea,
      clearAreas,
      setPainLevel,
      summary,
      payload,
    }),
    [selectedAreas, painLevel, summary, payload],
  )

  return <BodyMapContext.Provider value={value}>{children}</BodyMapContext.Provider>
}

export function useBodyMap() {
  const ctx = useContext(BodyMapContext)
  if (!ctx) {
    throw new Error('useBodyMap must be used inside BodyMapProvider')
  }
  return ctx
}
