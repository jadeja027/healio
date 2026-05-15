import { MapPin, Phone } from 'lucide-react'

import type { EmergencyHospital } from '@/types'

type Props = {
  hospital: EmergencyHospital
  highlight?: boolean
}

export function HospitalCard({ hospital, highlight }: Props) {
  const label = hospital.emergency === 'yes' ? 'Emergency-ready' : hospital.emergency === 'no' ? 'Clinic' : 'Hospital'

  return (
    <div
      className={`rounded-2xl border border-white/30 bg-white/50 p-4 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:bg-slate-900/40 ${
        highlight ? 'ring-2 ring-red-500/70' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{hospital.name}</p>
          <p className="text-xs text-slate-600 dark:text-slate-300">{label}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${highlight ? 'bg-red-500/90 text-white' : 'bg-slate-900/70 text-white'}`}>
          {hospital.distance_km} km
        </span>
      </div>
      <div className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5" />
          Emergency score: {hospital.emergency_score}
        </div>
        {hospital.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5" />
            {hospital.phone}
          </div>
        )}
      </div>
    </div>
  )
}
