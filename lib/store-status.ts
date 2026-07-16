'use client'

export interface DaySchedule {
  open: string  // "HH:MM"
  close: string // "HH:MM"
  enabled: boolean
}

export interface StoreSchedule {
  0: DaySchedule // Sunday
  1: DaySchedule // Monday
  2: DaySchedule // Tuesday
  3: DaySchedule // Wednesday
  4: DaySchedule // Thursday
  5: DaySchedule // Friday
  6: DaySchedule // Saturday
}

export interface StoreStatus {
  isOpen: boolean
  manualOverride: boolean | null // null = follow schedule, true/false = forced
  pickupOnly?: boolean // quando true, o site aceita apenas retirada na loja
  schedule: StoreSchedule
  updatedAt: string
}

export const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const DEFAULT_SCHEDULE: StoreSchedule = {
  0: { open: '18:00', close: '23:00', enabled: false }, // Sunday
  1: { open: '18:00', close: '23:00', enabled: true },
  2: { open: '18:00', close: '23:00', enabled: true },
  3: { open: '18:00', close: '23:00', enabled: true },
  4: { open: '18:00', close: '23:00', enabled: true },
  5: { open: '18:00', close: '23:00', enabled: true },
  6: { open: '18:00', close: '23:00', enabled: true },
}

const STORAGE_KEY = 'mais_sub_store_status'

export function getStoreStatus(): StoreStatus {
  if (typeof window === 'undefined') return buildDefault()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as StoreStatus
      const isOpen = computeIsOpen(saved)
      return { ...saved, isOpen }
    }
  } catch {}
  return buildDefault()
}

function buildDefault(): StoreStatus {
  const schedule = DEFAULT_SCHEDULE
  return {
    isOpen: true,
    manualOverride: true, // open by default until admin explicitly closes
    pickupOnly: false,
    schedule,
    updatedAt: new Date().toISOString(),
  }
}

export function computeIsOpen(status: StoreStatus): boolean {
  if (status.manualOverride !== null) return status.manualOverride
  return isWithinSchedule(status.schedule)
}

export function isWithinSchedule(schedule: StoreSchedule): boolean {
  const now = new Date()
  const day = now.getDay() as keyof StoreSchedule
  const daySchedule = schedule[day]
  if (!daySchedule.enabled) return false

  const [openH, openM] = daySchedule.open.split(':').map(Number)
  const [closeH, closeM] = daySchedule.close.split(':').map(Number)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const openMinutes = openH * 60 + openM
  const closeMinutes = closeH * 60 + closeM

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes
}

export function saveStoreStatus(status: Partial<StoreStatus>): StoreStatus {
  const current = getStoreStatus()
  const next: StoreStatus = {
    ...current,
    ...status,
    updatedAt: new Date().toISOString(),
  }
  next.isOpen = computeIsOpen(next)
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }
  return next
}

export function setManualOverride(open: boolean | null): StoreStatus {
  return saveStoreStatus({ manualOverride: open })
}

// ─── Server-synced API functions ──────────────────────────────────────────────
export async function fetchStoreStatus(): Promise<StoreStatus> {
  try {
    const res = await fetch('/api/store-status', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      return { ...data, isOpen: computeIsOpen(data) }
    }
  } catch {}
  return getStoreStatus()
}

export async function patchStoreStatus(patch: Partial<StoreStatus>): Promise<StoreStatus> {
  try {
    const res = await fetch('/api/store-status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      const data = await res.json()
      return { ...data, isOpen: computeIsOpen(data) }
    }
  } catch {}
  return saveStoreStatus(patch)
}

export function getNextEvent(schedule: StoreSchedule): { type: 'open' | 'close'; time: string; day: string } | null {
  const now = new Date()
  for (let i = 0; i < 8; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    const day = d.getDay() as keyof StoreSchedule
    const daySchedule = schedule[day]
    if (!daySchedule.enabled) continue

    const [openH, openM] = daySchedule.open.split(':').map(Number)
    const [closeH, closeM] = daySchedule.close.split(':').map(Number)

    if (i === 0) {
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      const openMinutes = openH * 60 + openM
      const closeMinutes = closeH * 60 + closeM
      if (currentMinutes < openMinutes) {
        return { type: 'open', time: daySchedule.open, day: i === 0 ? 'hoje' : DAY_NAMES[day] }
      }
      if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
        return { type: 'close', time: daySchedule.close, day: 'hoje' }
      }
    } else {
      return { type: 'open', time: daySchedule.open, day: i === 1 ? 'amanhã' : DAY_NAMES[day] }
    }
  }
  return null
}
