import type { AssessResult, ChatMessage, PatientOnboarding, Session, SymptomFeatures } from '@/types'

const jsonHeaders = { 'Content-Type': 'application/json' }

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  return res.json() as Promise<T>
}

export async function createSession(patient: PatientOnboarding): Promise<Session> {
  const res = await fetch('/api/sessions', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ patient }),
  })
  return handle<Session>(res)
}

export async function getSession(sessionId: string): Promise<Session> {
  const res = await fetch(`/api/sessions/${sessionId}`)
  return handle<Session>(res)
}

export async function fetchMessages(sessionId: string): Promise<ChatMessage[]> {
  const res = await fetch(`/api/sessions/${sessionId}/messages`)
  return handle<ChatMessage[]>(res)
}

export async function sendMessage(sessionId: string, content: string): Promise<ChatMessage[]> {
  const res = await fetch(`/api/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ content }),
  })
  return handle<ChatMessage[]>(res)
}

export async function assessSession(sessionId: string, symptoms: SymptomFeatures, conversationText: string): Promise<AssessResult> {
  const res = await fetch(`/api/sessions/${sessionId}/assess`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ symptoms, conversation_text: conversationText }),
  })
  return handle<AssessResult>(res)
}
