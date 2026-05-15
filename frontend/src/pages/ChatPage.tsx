import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, SendHorizontal } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'

import { assessSession, fetchMessages, sendMessage } from '@/api/client'
import { BodyMapContainer } from '@/components/BodyMap/BodyMapContainer'
import { EmergencyDetector } from '@/components/BodyMap/EmergencyDetector'
import { EmergencyOverlay } from '@/components/EmergencyOverlay'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { BodyMapProvider, useBodyMap } from '@/contexts/BodyMapContext'
import { conversationPlain, detectLocalEmergency, inferSymptomsFromText } from '@/lib/symptomInference'
import type { ChatMessage, PatientOnboarding, SymptomFeatures } from '@/types'

const defaultSymptoms: SymptomFeatures = {
  fever: false,
  breathlessness: false,
  nausea: false,
  chest_pain: false,
  unconscious: false,
  duration_days: 2,
  severity: 5,
}

function ChatPageContent() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const patient = (location.state as { patient?: PatientOnboarding } | null)?.patient
  const { payload: bodyMapPayload } = useBodyMap()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [symptoms, setSymptoms] = useState<SymptomFeatures>(defaultSymptoms)
  const [assessing, setAssessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emergencyOpen, setEmergencyOpen] = useState(false)
  const [emergencyReasons, setEmergencyReasons] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!sessionId) return
    void (async () => {
      try {
        const initial = await fetchMessages(sessionId)
        setMessages(initial)
      } catch {
        setError('Unable to load conversation history.')
      }
    })()
  }, [sessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const transcript = useMemo(() => conversationPlain(messages), [messages])

  useEffect(() => {
    setSymptoms((prev) => inferSymptomsFromText(transcript, prev))
  }, [transcript])

  useEffect(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUser && detectLocalEmergency(lastUser.content)) {
      setEmergencyReasons((prev) => Array.from(new Set([...prev, 'Potential emergency language detected in your message'])))
      setEmergencyOpen(true)
    }
  }, [messages])

  async function onSend(e: FormEvent) {
    e.preventDefault()
    if (!sessionId || !input.trim() || sending) return
    setSending(true)
    setError(null)
    const content = input.trim()
    setInput('')
    try {
      const pair = await sendMessage(sessionId, content, bodyMapPayload)
      setMessages((prev) => {
        const map = new Map(prev.map((m) => [m.id, m]))
        for (const m of pair) map.set(m.id, m)
        return Array.from(map.values()).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setSending(false)
    }
  }

  async function onAssess() {
    if (!sessionId) return
    setAssessing(true)
    setError(null)
    try {
      const convo = [conversationPlain(messages), bodyMapPayload.summary].filter(Boolean).join('\n')
      const result = await assessSession(sessionId, symptoms, convo, bodyMapPayload)
      const latest = await fetchMessages(sessionId)
      if (result.emergency) {
        setEmergencyReasons(result.emergency_reasons)
        setEmergencyOpen(true)
      }
      navigate(`/session/${sessionId}/results`, { state: { result, messages: latest, patient } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assessment failed')
    } finally {
      setAssessing(false)
    }
  }

  if (!sessionId) {
    return <p className="p-6 text-sm text-red-600">Missing session.</p>
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row">
      <EmergencyDetector
        transcript={transcript}
        onTrigger={(reasons) => {
          setEmergencyReasons((prev) => Array.from(new Set([...prev, ...reasons])))
          setEmergencyOpen(true)
        }}
      />
      <EmergencyOverlay
        open={emergencyOpen}
        reasons={emergencyReasons}
        transcript={transcript}
        onAcknowledge={() => setEmergencyOpen(false)}
      />

      <div className="flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">Symptom interview</p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI triage chat</h1>
            {patient && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {patient.name}, {patient.age} yrs — context aware
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate('/')}>
              Home
            </Button>
            <ThemeToggle />
          </div>
        </div>

        <Card className="flex flex-1 flex-col overflow-hidden">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800">
            <CardTitle>Conversation</CardTitle>
            <CardDescription>Gemini asks concise follow-ups; history stays in your session database.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3 p-0">
            <div className="max-h-[520px] flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        m.role === 'user'
                          ? 'bg-teal-600 text-white dark:bg-teal-500'
                          : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50'
                      }`}
                    >
                      {m.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {sending && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <span className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.2s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500 [animation-delay:-0.1s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-teal-500" />
                    </span>
                    Assistant is typing…
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>
            {error && <p className="px-4 text-sm text-red-600 sm:px-6">{error}</p>}
            <form onSubmit={onSend} className="flex items-end gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-6">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe symptoms, timing, and severity…"
                disabled={sending}
              />
              <Button type="submit" disabled={sending || !input.trim()}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={onAssess} disabled={assessing || messages.length === 0}>
            {assessing ? 'Scoring risk…' : 'Run triage assessment'}
          </Button>
        </div>
      </div>

      <motion.aside
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full shrink-0 space-y-4 lg:w-80"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Body pain mapping</CardTitle>
            <CardDescription>Tap areas to help the triage model understand symptom location and severity.</CardDescription>
          </CardHeader>
          <CardContent>
            <BodyMapContainer />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Symptom signals</CardTitle>
            <CardDescription>Fine-tune what the risk model sees. Text inference updates toggles automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {(
              [
                ['fever', 'Fever / chills'],
                ['breathlessness', 'Breathlessness'],
                ['nausea', 'Nausea / vomiting'],
                ['chest_pain', 'Chest pain / pressure'],
                ['unconscious', 'Syncope / unconscious'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-800">
                <span>{label}</span>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-teal-600"
                  checked={symptoms[key]}
                  onChange={(e) => setSymptoms({ ...symptoms, [key]: e.target.checked })}
                />
              </label>
            ))}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Duration (days)</span>
                <span>{symptoms.duration_days}d</span>
              </div>
              <input
                type="range"
                min={0}
                max={21}
                value={symptoms.duration_days}
                onChange={(e) => setSymptoms({ ...symptoms, duration_days: Number(e.target.value) })}
                className="w-full accent-teal-600"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Severity (1-10)</span>
                <span>{symptoms.severity}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={symptoms.severity}
                onChange={(e) => setSymptoms({ ...symptoms, severity: Number(e.target.value) })}
                className="w-full accent-teal-600"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Model preview</Label>
              <Progress value={Math.min(100, symptoms.severity * 9 + symptoms.duration_days * 2)} />
            </div>
          </CardContent>
        </Card>
      </motion.aside>
    </div>
  )
}

export function ChatPage() {
  return (
    <BodyMapProvider>
      <ChatPageContent />
    </BodyMapProvider>
  )
}
