import { motion } from 'framer-motion'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { createSession } from '@/api/client'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Gender, PatientOnboarding } from '@/types'

const defaultPatient: PatientOnboarding = {
  name: '',
  age: 32,
  gender: 'prefer_not_say',
  conditions: '',
  medications: '',
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const [patient, setPatient] = useState<PatientOnboarding>(defaultPatient)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const session = await createSession(patient)
      navigate(`/session/${session.id}/chat`, { state: { patient } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/')}>
          Back
        </Button>
        <ThemeToggle />
      </div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <CardTitle>Patient onboarding</CardTitle>
            <CardDescription>We use this context to personalize questions. It is stored with your session in PostgreSQL.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    required
                    value={patient.name}
                    onChange={(e) => setPatient({ ...patient, name: e.target.value })}
                    placeholder="Alex Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min={0}
                    max={120}
                    required
                    value={patient.age}
                    onChange={(e) => setPatient({ ...patient, age: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                    value={patient.gender}
                    onChange={(e) => setPatient({ ...patient, gender: e.target.value as Gender })}
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_say">Prefer not to say</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="conditions">Known medical conditions</Label>
                <textarea
                  id="conditions"
                  className="min-h-[96px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:border-slate-700 dark:bg-slate-950"
                  value={patient.conditions}
                  onChange={(e) => setPatient({ ...patient, conditions: e.target.value })}
                  placeholder="Hypertension, asthma, diabetes..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medications">Current medications</Label>
                <textarea
                  id="medications"
                  className="min-h-[96px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:border-slate-700 dark:bg-slate-950"
                  value={patient.medications}
                  onChange={(e) => setPatient({ ...patient, medications: e.target.value })}
                  placeholder="Include dose if you know it"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
                {loading ? 'Creating session…' : 'Begin symptom interview'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
