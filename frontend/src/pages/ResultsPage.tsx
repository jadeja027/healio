import { jsPDF } from 'jspdf'
import { AnimatePresence, motion } from 'framer-motion'
import { Activity, Download, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { assessSession, fetchMessages, getSession } from '@/api/client'
import { EmergencyOverlay } from '@/components/EmergencyOverlay'
import { RiskGauge } from '@/components/RiskGauge'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { conversationPlain } from '@/lib/symptomInference'
import type { AssessResult, ChatMessage, PatientOnboarding, SymptomFeatures } from '@/types'

const defaultSymptoms: SymptomFeatures = {
  fever: false,
  breathlessness: false,
  nausea: false,
  chest_pain: false,
  unconscious: false,
  duration_days: 2,
  severity: 5,
}

function triageIcon(band: AssessResult['triage_band']) {
  if (band === 'home') return '🟢'
  if (band === 'clinic') return '🟡'
  return '🔴'
}

function triageLabel(band: AssessResult['triage_band']) {
  if (band === 'home') return 'Home care (0–39)'
  if (band === 'clinic') return 'Clinic visit (40–69)'
  return 'Emergency routing (70–100)'
}

export function ResultsPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { result?: AssessResult; messages?: ChatMessage[]; patient?: PatientOnboarding } | null

  const [result, setResult] = useState<AssessResult | null>(state?.result ?? null)
  const [messages, setMessages] = useState<ChatMessage[]>(state?.messages ?? [])
  const [patient, setPatient] = useState<PatientOnboarding | undefined>(state?.patient)
  const [symptoms, setSymptoms] = useState<SymptomFeatures>(defaultSymptoms)
  const [loading, setLoading] = useState(!state?.result)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emergencyOpen, setEmergencyOpen] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    void (async () => {
      try {
        const session = await getSession(sessionId)
        setPatient((prev) => (session.patient as PatientOnboarding) ?? prev)
        setResult((prev) => (session.assessment_json as AssessResult | null) ?? prev)
        const msgs = await fetchMessages(sessionId)
        setMessages(msgs)
        if (session.symptom_snapshot) {
          setSymptoms({ ...defaultSymptoms, ...(session.symptom_snapshot as SymptomFeatures) })
        }
      } catch {
        setError('Unable to load session data.')
      } finally {
        setLoading(false)
      }
    })()
  }, [sessionId])

  useEffect(() => {
    if (result?.emergency) {
      setEmergencyOpen(true)
    }
  }, [result])

  const chartData = useMemo(
    () =>
      result
        ? Object.entries(result.severity_breakdown).map(([name, value]) => ({
            name,
            value: Math.round(value),
          }))
        : [],
    [result],
  )

  async function rerun() {
    if (!sessionId) return
    setBusy(true)
    setError(null)
    try {
      const msgs = await fetchMessages(sessionId)
      const convo = conversationPlain(msgs)
      const next = await assessSession(sessionId, symptoms, convo)
      setResult(next)
      setMessages(msgs)
      if (next.emergency) setEmergencyOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reassess')
    } finally {
      setBusy(false)
    }
  }

  function downloadPdf() {
    if (!result || !patient) return
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const margin = 48
    let y = margin
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('Healio — Health report (demo)', margin, y)
    y += 28
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(`Patient: ${patient.name} (${patient.age}y, ${patient.gender})`, margin, y)
    y += 18
    doc.text(`Risk score: ${result.risk_score} — ${triageLabel(result.triage_band)}`, margin, y)
    y += 18
    doc.text('Disclaimer: not a medical diagnosis.', margin, y)
    y += 28
    doc.setFont('helvetica', 'bold')
    doc.text('Possible conditions (differential hints)', margin, y)
    y += 16
    doc.setFont('helvetica', 'normal')
    for (const line of result.possible_conditions) {
      doc.text(`- ${line}`, margin, y)
      y += 14
      if (y > 760) {
        doc.addPage()
        y = margin
      }
    }
    y += 10
    doc.setFont('helvetica', 'bold')
    doc.text('First aid / self-care tips', margin, y)
    y += 16
    doc.setFont('helvetica', 'normal')
    for (const line of result.first_aid_tips) {
      doc.text(`- ${line}`, margin, y)
      y += 14
      if (y > 760) {
        doc.addPage()
        y = margin
      }
    }
    y += 10
    doc.setFont('helvetica', 'bold')
    doc.text('Next steps', margin, y)
    y += 16
    doc.setFont('helvetica', 'normal')
    for (const line of result.next_steps) {
      doc.text(`- ${line}`, margin, y)
      y += 14
    }
    doc.save(`healio-report-${patient.name.replace(/\s+/g, '-').toLowerCase()}.pdf`)
  }

  if (!sessionId) {
    return <p className="p-6 text-sm text-red-600">Missing session.</p>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <EmergencyOverlay
        open={emergencyOpen}
        reasons={result?.emergency_reasons ?? []}
        onAcknowledge={() => setEmergencyOpen(false)}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">Triage dashboard</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Care guidance</h1>
          {patient && <p className="text-sm text-slate-600 dark:text-slate-400">{patient.name}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => navigate(`/session/${sessionId}/chat`)}>
            Back to chat
          </Button>
          <Button variant="outline" onClick={rerun} disabled={busy}>
            <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
            Re-run model
          </Button>
          <Button onClick={downloadPdf} disabled={!result || !patient}>
            <Download className="h-4 w-4" />
            Download health report
          </Button>
          <ThemeToggle />
        </div>
      </div>

      {loading && !result && <p className="text-sm text-slate-600">Loading assessment…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <div className="grid gap-4 lg:grid-cols-3">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Risk visualization</CardTitle>
                <CardDescription>RandomForest triage probabilities mapped to a 0–100 scale.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <RiskGauge score={result.risk_score} />
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <span>{triageIcon(result.triage_band)}</span>
                  <span>{triageLabel(result.triage_band)}</span>
                </div>
                <Progress value={result.risk_score} />
                <div className="flex flex-wrap gap-2">
                  <Badge variant="success">Home 0–39</Badge>
                  <Badge variant="warn">Clinic 40–69</Badge>
                  <Badge variant="danger">ER 70–100</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Clinical narrative</CardTitle>
                <CardDescription>Possible conditions, immediate tips, and escalation guidance.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Possible conditions</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-600 dark:text-slate-300">
                    {result.possible_conditions.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">First aid tips</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-600 dark:text-slate-300">
                    {result.first_aid_tips.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Next steps</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-slate-600 dark:text-slate-300">
                    {result.next_steps.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Symptom severity breakdown</CardTitle>
                  <CardDescription>Recharts view of modeled symptom axes for this visit.</CardDescription>
                </div>
                <Activity className="h-5 w-5 text-teal-600" />
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={70} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0d9488" radius={[8, 8, 0, 0]} animationDuration={900} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Session history</CardTitle>
                <CardDescription>Messages stored for this PostgreSQL session.</CardDescription>
              </CardHeader>
              <CardContent className="max-h-80 space-y-2 overflow-y-auto text-sm">
                <AnimatePresence>
                  {messages.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, x: m.role === 'user' ? 12 : -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`rounded-xl border px-3 py-2 ${
                        m.role === 'user'
                          ? 'border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-50'
                          : 'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
                      }`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{m.role}</p>
                      <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {!result && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>No assessment yet</CardTitle>
            <CardDescription>Run the model from chat, or reassess here with manual symptom sliders.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Adjust symptoms and press re-run (loads latest chat automatically).</p>
            <SymptomControls symptoms={symptoms} onChange={setSymptoms} />
            <Button onClick={rerun} disabled={busy}>
              Run assessment
            </Button>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Manual symptom overrides</CardTitle>
            <CardDescription>Useful for demos — tweak inputs and re-run the RandomForest.</CardDescription>
          </CardHeader>
          <CardContent>
            <SymptomControls symptoms={symptoms} onChange={setSymptoms} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SymptomControls({
  symptoms,
  onChange,
}: {
  symptoms: SymptomFeatures
  onChange: (s: SymptomFeatures) => void
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {(
        [
          ['fever', 'Fever'],
          ['breathlessness', 'Breathlessness'],
          ['nausea', 'Nausea'],
          ['chest_pain', 'Chest pain'],
          ['unconscious', 'Unconscious / syncope'],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
          <span className="text-sm">{label}</span>
          <input
            type="checkbox"
            className="h-4 w-4 accent-teal-600"
            checked={symptoms[key]}
            onChange={(e) => onChange({ ...symptoms, [key]: e.target.checked })}
          />
        </label>
      ))}
      <div className="md:col-span-2">
        <p className="text-xs text-slate-500">Duration (days): {symptoms.duration_days}</p>
        <input
          type="range"
          min={0}
          max={21}
          value={symptoms.duration_days}
          onChange={(e) => onChange({ ...symptoms, duration_days: Number(e.target.value) })}
          className="w-full accent-teal-600"
        />
      </div>
      <div className="md:col-span-2">
        <p className="text-xs text-slate-500">Severity: {symptoms.severity}</p>
        <input
          type="range"
          min={1}
          max={10}
          value={symptoms.severity}
          onChange={(e) => onChange({ ...symptoms, severity: Number(e.target.value) })}
          className="w-full accent-teal-600"
        />
      </div>
    </div>
  )
}
