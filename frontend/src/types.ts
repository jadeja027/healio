export type Gender = 'female' | 'male' | 'other' | 'prefer_not_say'

export type PatientOnboarding = {
  name: string
  age: number
  gender: Gender
  conditions: string
  medications: string
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export type SymptomFeatures = {
  fever: boolean
  breathlessness: boolean
  nausea: boolean
  chest_pain: boolean
  unconscious: boolean
  duration_days: number
  severity: number
}

export type AssessResult = {
  risk_score: number
  triage_band: 'home' | 'clinic' | 'er'
  possible_conditions: string[]
  first_aid_tips: string[]
  next_steps: string[]
  emergency: boolean
  emergency_reasons: string[]
  severity_breakdown: Record<string, number>
}

export type Session = {
  id: string
  patient: PatientOnboarding
  created_at: string
  risk_score: number | null
  triage_band: string | null
  assessment_json: AssessResult | null
  symptom_snapshot: SymptomFeatures | null
}
