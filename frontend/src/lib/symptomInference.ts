import type { SymptomFeatures } from '@/types'

const boolPatterns: { key: 'fever' | 'breathlessness' | 'nausea' | 'chest_pain' | 'unconscious'; re: RegExp }[] = [
  { key: 'fever', re: /\b(fever|febrile|temperature|chills)\b/i },
  { key: 'breathlessness', re: /\b(short(ness)? of breath|breathless|difficulty breathing|can't breathe|cant breathe|dyspnea)\b/i },
  { key: 'nausea', re: /\b(nausea|vomit|throwing up)\b/i },
  { key: 'chest_pain', re: /\b(chest pain|pressure in chest)\b/i },
  { key: 'unconscious', re: /\b(unconscious|passed out|fainted|syncope)\b/i },
]

export function inferSymptomsFromText(text: string, base: SymptomFeatures): SymptomFeatures {
  const next: SymptomFeatures = { ...base }
  for (const { key, re } of boolPatterns) {
    if (re.test(text)) {
      next[key] = true
    }
  }
  const durationMatch = text.match(/(\d+)\s*(day|days|week|weeks)/i)
  if (durationMatch) {
    const n = Number(durationMatch[1])
    const unit = durationMatch[2].toLowerCase()
    next.duration_days = unit.startsWith('week') ? Math.min(30, n * 7) : Math.min(60, n)
  }
  const sevMatch = text.match(/\b(severity|pain)\b[^.\n]{0,40}\b(\d|10)\b/i) || text.match(/\b(\d|10)\s*\/\s*10\b/)
  if (sevMatch) {
    const val = Number(sevMatch[2] ?? sevMatch[1])
    if (!Number.isNaN(val)) next.severity = Math.min(10, Math.max(1, val))
  }
  return next
}

export function conversationPlain(messages: { role: string; content: string }[]) {
  return messages.map((m) => `${m.role}: ${m.content}`).join('\n')
}

export const EMERGENCY_REGEXES = [/chest pain/i, /difficulty breathing/i, /short(ness)? of breath/i, /unconscious/i, /can't breathe/i, /cant breathe/i]

export function detectLocalEmergency(text: string) {
  return EMERGENCY_REGEXES.some((r) => r.test(text))
}
