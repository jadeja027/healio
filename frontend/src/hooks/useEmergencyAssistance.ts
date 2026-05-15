import { useEffect, useMemo, useState } from 'react'

import { fetchEmergencyPrecautions, fetchNearbyHospitals } from '@/api/client'
import type { EmergencyHospital, EmergencyPrecautions } from '@/types'

type UserLocation = {
  latitude: number
  longitude: number
}

type UseEmergencyAssistanceParams = {
  open: boolean
  reasons: string[]
  transcript?: string
}

const SYMPTOM_KEYS: { key: string; re: RegExp }[] = [
  { key: 'chest_pain', re: /chest pain|pressure in chest/i },
  { key: 'breathlessness', re: /difficulty breathing|short(ness)? of breath|cant breathe|can't breathe/i },
  { key: 'severe_bleeding', re: /severe bleeding|bleeding heavily/i },
  { key: 'stroke', re: /stroke|slurred speech|face droop/i },
  { key: 'unconscious', re: /unconscious|passed out|fainted/i },
]

function inferSymptomKey(reasons: string[], transcript?: string) {
  const combined = `${reasons.join(' ')} ${transcript ?? ''}`
  const match = SYMPTOM_KEYS.find((item) => item.re.test(combined))
  return match?.key
}

export function useEmergencyAssistance({ open, reasons, transcript }: UseEmergencyAssistanceParams) {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [hospitals, setHospitals] = useState<EmergencyHospital[]>([])
  const [precautions, setPrecautions] = useState<EmergencyPrecautions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)

  const symptomKey = useMemo(() => inferSymptomKey(reasons, transcript), [reasons, transcript])
  const bestHospital = hospitals[0] ?? null

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setLoading(true)
    setError(null)
    setGeoError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return
        const nextLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }
        setLocation(nextLocation)

        Promise.all([
          fetchNearbyHospitals(nextLocation.latitude, nextLocation.longitude),
          fetchEmergencyPrecautions(symptomKey),
        ])
          .then(([nearby, precautionData]) => {
            if (cancelled) return
            setHospitals(nearby)
            setPrecautions(precautionData)
          })
          .catch((err) => {
            if (cancelled) return
            setError(err instanceof Error ? err.message : 'Unable to load emergency assistance data')
          })
          .finally(() => {
            if (cancelled) return
            setLoading(false)
          })
      },
      (geoErr) => {
        if (cancelled) return
        setGeoError(geoErr.message || 'Location permission was denied')
        fetchEmergencyPrecautions(symptomKey)
          .then((data) => {
            if (cancelled) return
            setPrecautions(data)
          })
          .catch((err) => {
            if (cancelled) return
            setError(err instanceof Error ? err.message : 'Unable to load precautions')
          })
          .finally(() => {
            if (cancelled) return
            setLoading(false)
          })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )

    return () => {
      cancelled = true
    }
  }, [open, symptomKey])

  return {
    location,
    hospitals,
    precautions,
    bestHospital,
    loading,
    error,
    geoError,
  }
}
