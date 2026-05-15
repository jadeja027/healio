import { Phone, ShieldAlert } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

import { EmergencyMap } from '@/components/EmergencyMap'
import { EmergencyPrecautionsPanel } from '@/components/EmergencyPrecautions'
import { HospitalCard } from '@/components/HospitalCard'
import { useEmergencyAssistance } from '@/hooks/useEmergencyAssistance'

type Props = {
  open: boolean
  reasons: string[]
  transcript?: string
  onAcknowledge: () => void
}

export function EmergencyOverlay({ open, reasons, transcript, onAcknowledge }: Props) {
  const { location, hospitals, precautions, bestHospital, loading, error, geoError } = useEmergencyAssistance({
    open,
    reasons,
    transcript,
  })

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/70 p-4 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-6 max-w-6xl space-y-6 rounded-3xl border border-white/20 bg-white/70 p-6 shadow-2xl backdrop-blur-lg dark:bg-slate-950/70"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Emergency assistance</p>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Immediate care guidance and nearby hospitals</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Call your local emergency number if symptoms are severe or worsening.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-2xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-600">
                  India: 112
                </div>
                <button
                  type="button"
                  onClick={onAcknowledge}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  Return to triage
                </button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-4">
                <EmergencyMap userLocation={location} hospitals={hospitals} bestHospital={bestHospital} loading={loading} />

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                    {error}
                  </div>
                )}
                {geoError && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                    Location error: {geoError}. Enable location for nearby hospitals.
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  {loading && (
                    <div className="col-span-full h-24 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800/70" />
                  )}
                  {!loading && hospitals.length === 0 && (
                    <div className="col-span-full rounded-2xl border border-slate-200 bg-white/60 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
                      No hospitals were found nearby. Try again in a few minutes or move closer to a main area.
                    </div>
                  )}
                  {hospitals.slice(0, 4).map((hospital) => (
                    <HospitalCard key={hospital.id} hospital={hospital} highlight={hospital.id === bestHospital?.id} />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/30 bg-white/40 p-4 shadow-lg backdrop-blur dark:bg-slate-900/40">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-red-500/10 p-2 text-red-500">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Emergency advisory</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        If this is life-threatening, call emergency services immediately.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                    Ambulance: 102 · Mental health: Tele-MANAS 14416
                  </div>
                </div>

                {reasons.length > 0 && (
                  <div className="rounded-2xl border border-white/30 bg-white/40 p-4 text-sm text-slate-700 shadow-lg backdrop-blur dark:bg-slate-900/40 dark:text-slate-200">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Triggers</p>
                    <ul className="mt-2 space-y-1">
                      {reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <EmergencyPrecautionsPanel precautions={precautions} loading={loading && !precautions} />

                {bestHospital && (
                  <div className="rounded-2xl border border-white/30 bg-white/50 p-4 shadow-lg backdrop-blur dark:bg-slate-900/40">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nearest emergency hospital</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{bestHospital.name}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">Estimated distance: {bestHospital.distance_km} km</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <Phone className="h-3.5 w-3.5" />
                      {bestHospital.phone || 'Phone unavailable'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
