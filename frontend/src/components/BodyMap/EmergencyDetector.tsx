import { useEffect, useMemo, useRef } from 'react'

import { useBodyMap } from '@/contexts/BodyMapContext'

function detectBodyMapEmergency(areas: string[], painLevel: number, transcript?: string) {
  const normalized = new Set(areas.map((area) => area.toLowerCase()))
  const reasons: string[] = []
  if (normalized.has('chest') && normalized.has('left_arm') && painLevel >= 7) {
    reasons.push('Severe chest and left arm pain reported')
  }
  if (normalized.has('abdomen') && painLevel >= 8) {
    reasons.push('Severe abdominal pain reported')
  }
  if (normalized.has('head') && painLevel >= 7) {
    const text = (transcript ?? '').toLowerCase()
    if (text.includes('dizz') || text.includes('faint') || text.includes('blurred')) {
      reasons.push('Head pain with dizziness or faintness reported')
    }
  }
  return reasons
}

type Props = {
  transcript?: string
  onTrigger: (reasons: string[]) => void
}

export function EmergencyDetector({ transcript, onTrigger }: Props) {
  const { selectedAreas, painLevel } = useBodyMap()
  const lastKey = useRef('')

  const reasons = useMemo(
    () => detectBodyMapEmergency(selectedAreas, painLevel, transcript),
    [selectedAreas, painLevel, transcript],
  )

  useEffect(() => {
    const key = reasons.join('|')
    if (key && key !== lastKey.current) {
      lastKey.current = key
      onTrigger(reasons)
    }
  }, [reasons, onTrigger])

  return null
}
