import { motion } from 'framer-motion'

export function DisclaimerBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-t border-slate-200 bg-white/90 px-4 py-3 text-center text-xs text-slate-600 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 dark:text-slate-400"
    >
      This is not a replacement for professional medical diagnosis. Consult a licensed doctor for final decisions.
    </motion.div>
  )
}
