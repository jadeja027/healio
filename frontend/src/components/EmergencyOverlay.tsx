import { Phone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Props = {
  open: boolean
  reasons: string[]
  onAcknowledge: () => void
}

export function EmergencyOverlay({ open, reasons, onAcknowledge }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-red-700/95 p-6 text-center text-white backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div initial={{ scale: 0.92, y: 12 }} animate={{ scale: 1, y: 0 }} className="max-w-lg space-y-4">
            <p className="text-3xl font-bold tracking-tight">Possible emergency</p>
            <p className="text-sm text-red-100">
              If this is a medical emergency, call your local emergency number immediately. Do not use this app as your only source of
              help.
            </p>
            <div className="rounded-2xl bg-white/10 p-4 text-left text-sm">
              <p className="font-semibold">India — National Emergency: 112</p>
              <p className="mt-1 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Ambulance: 102 · Mental health: Tele-MANAS 14416
              </p>
              <p className="mt-2 text-xs text-red-100">Adjust numbers for your region if you are outside India.</p>
            </div>
            {reasons.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-left text-sm text-red-50">
                {reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={onAcknowledge}
              className="mt-4 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-red-700 shadow-lg transition hover:bg-red-50"
            >
              I understand — return to triage
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
