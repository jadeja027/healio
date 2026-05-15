import type {
  AssessResult,
  BodyMapPayload,
  ChatMessage,
  EmergencyHospital,
  EmergencyPrecautions,
  PatientOnboarding,
  Session,
  SymptomFeatures,
} from '@/types'

const jsonHeaders = { 'Content-Type': 'application/json' }

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

function apiUrl(path: string): string {
  if (!apiBaseUrl) {
    return path.startsWith('/') ? path : `/${path}`
  }

  const base = apiBaseUrl.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  return res.json() as Promise<T>
}

export async function createSession(patient: PatientOnboarding): Promise<Session> {
  const res = await fetch(apiUrl('/api/sessions'), {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ patient }),
  })
  return handle<Session>(res)
}

export async function getSession(sessionId: string): Promise<Session> {
  const res = await fetch(apiUrl(`/api/sessions/${sessionId}`))
  return handle<Session>(res)
}

export async function fetchMessages(sessionId: string): Promise<ChatMessage[]> {
  const res = await fetch(apiUrl(`/api/sessions/${sessionId}/messages`))
  return handle<ChatMessage[]>(res)
}

export async function sendMessage(sessionId: string, content: string, bodyMap?: BodyMapPayload): Promise<ChatMessage[]> {
  const res = await fetch(apiUrl(`/api/sessions/${sessionId}/messages`), {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ content, body_map: bodyMap }),
  })
  return handle<ChatMessage[]>(res)
}

export async function assessSession(
  sessionId: string,
  symptoms: SymptomFeatures,
  conversationText: string,
  bodyMap?: BodyMapPayload,
): Promise<AssessResult> {
  const res = await fetch(apiUrl(`/api/sessions/${sessionId}/assess`), {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ symptoms, conversation_text: conversationText, body_map: bodyMap }),
  })
  return handle<AssessResult>(res)
}

export async function fetchNearbyHospitals(latitude: number, longitude: number, radiusKm = 15): Promise<EmergencyHospital[]> {
  const res = await fetch(apiUrl('/api/emergency/nearby-hospitals'), {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ latitude, longitude, radius_km: radiusKm }),
  })
  const data = await handle<{ success: boolean; hospitals: EmergencyHospital[]; error?: string }>(res)
  if (!data.success) {
    throw new Error(data.error || 'Unable to fetch hospitals')
  }
  return data.hospitals
}

export async function fetchEmergencyPrecautions(symptom?: string): Promise<EmergencyPrecautions> {
  const query = symptom ? `?symptom=${encodeURIComponent(symptom)}` : ''
  const res = await fetch(apiUrl(`/api/emergency/precautions${query}`))
  const data = await handle<{ success: boolean; precautions: EmergencyPrecautions }>(res)
  return data.precautions
}
