import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useMemo } from 'react'

import type { EmergencyHospital } from '@/types'

type Props = {
  userLocation: { latitude: number; longitude: number } | null
  hospitals: EmergencyHospital[]
  bestHospital: EmergencyHospital | null
  loading: boolean
}

function makeMarkerIcon(color: string, label: string) {
  return L.divIcon({
    html: `<div style="background:${color};color:white;width:28px;height:28px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;box-shadow:0 6px 20px rgba(0,0,0,0.25);border:2px solid rgba(255,255,255,0.9)">${label}</div>`,
    className: 'healio-emergency-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  })
}

const userIcon = makeMarkerIcon('#0ea5a4', 'You')
const bestIcon = makeMarkerIcon('#dc2626', 'ER')
const hospitalIcon = makeMarkerIcon('#2563eb', 'H')

function FitBounds({ userLocation, hospitals }: { userLocation: Props['userLocation']; hospitals: EmergencyHospital[] }) {
  const map = useMap()

  useEffect(() => {
    const points: [number, number][] = []
    if (userLocation) {
      points.push([userLocation.latitude, userLocation.longitude])
    }
    for (const h of hospitals) {
      points.push([h.latitude, h.longitude])
    }
    if (points.length === 0) return
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14, animate: true })
  }, [map, userLocation, hospitals])

  return null
}

export function EmergencyMap({ userLocation, hospitals, bestHospital, loading }: Props) {
  const center = useMemo(() => {
    if (bestHospital) return [bestHospital.latitude, bestHospital.longitude] as [number, number]
    if (userLocation) return [userLocation.latitude, userLocation.longitude] as [number, number]
    return [20.5937, 78.9629] as [number, number]
  }, [bestHospital, userLocation])

  if (loading) {
    return <div className="h-[320px] w-full animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-800/60" />
  }

  return (
    <div className="h-[320px] w-full overflow-hidden rounded-2xl border border-white/30 bg-white/40 shadow-lg backdrop-blur">
      <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <FitBounds userLocation={userLocation} hospitals={hospitals} />

        {userLocation && (
          <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {hospitals.map((hospital) => {
          const isBest = bestHospital?.id === hospital.id
          const icon = isBest ? bestIcon : hospitalIcon
          const label = hospital.emergency === 'yes' ? 'Emergency' : hospital.emergency === 'no' ? 'Clinic' : 'Hospital'
          return (
            <Marker key={hospital.id} position={[hospital.latitude, hospital.longitude]} icon={icon}>
              <Popup>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-slate-900">{hospital.name}</p>
                  <p className="text-slate-600">Distance: {hospital.distance_km} km</p>
                  <p className="text-slate-600">{label}</p>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
