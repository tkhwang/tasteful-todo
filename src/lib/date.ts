function localISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayISO(): string {
  return localISO(new Date())
}

export function shiftDate(date: string, days: number): string {
  const shifted = new Date(`${date}T00:00:00`)
  shifted.setDate(shifted.getDate() + days)
  return localISO(shifted)
}
