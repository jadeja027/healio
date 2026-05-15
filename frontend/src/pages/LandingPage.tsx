import { motion } from 'framer-motion'
import { Activity, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'

const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
}

export function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.18),transparent_55%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.16),transparent_50%)] dark:bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.12),transparent_55%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),transparent_50%)]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-md">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Healio</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Clinical triage studio</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-20 pt-6 sm:px-6 lg:flex-row lg:items-center lg:gap-16 lg:pt-10">
        <motion.section {...fade} transition={{ duration: 0.45 }} className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/70 px-3 py-1 text-xs font-medium text-teal-800 shadow-sm backdrop-blur dark:border-teal-900 dark:bg-slate-900/70 dark:text-teal-100">
            <Sparkles className="h-3.5 w-3.5" />
            AI-guided symptom triage
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
            Premium digital triage for the first critical hour.
          </h1>
          <p className="max-w-xl text-lg text-slate-600 dark:text-slate-300">
            Healio blends conversational AI, structured onboarding, and an on-device friendly risk model to produce calm, explainable
            guidance — never a final diagnosis.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="shadow-lg shadow-teal-500/20">
              <Link to="/onboarding">
                Start triage
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <a href="#flow">See the flow</a>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3" id="flow">
            {[
              { title: 'Guided intake', body: 'Capture demographics, conditions, and medications before chat.' },
              { title: 'Claude-powered chat', body: 'Multi-turn symptom exploration with gentle clinical tone.' },
              { title: 'Risk + dashboard', body: 'RandomForest risk score, care band, charts, and PDF export.' },
            ].map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * idx }}
                className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-left shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70"
              >
                <ShieldCheck className="mb-2 h-5 w-5 text-teal-600 dark:text-teal-400" />
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-1"
        >
          <div className="relative mx-auto max-w-md rounded-[32px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-2xl dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-teal-400/30 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="relative space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">Live preview</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">“Walk me through what you are feeling.”</p>
              <div className="space-y-3 rounded-2xl bg-slate-900 p-4 text-sm text-slate-50 shadow-inner dark:bg-slate-950">
                <p className="text-slate-300">Assistant</p>
                <p>Let’s map location, duration, severity, and any fever, nausea, or breathing changes — at your pace.</p>
              </div>
              <div className="rounded-2xl border border-dashed border-teal-200 bg-teal-50/70 p-4 text-sm text-teal-900 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-50">
                Risk bands visualize as a circular gauge: green for home care, amber for clinic, red for emergency routing cues.
              </div>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  )
}
