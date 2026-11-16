// ISO date strings stay calendar dates. Never parse a release date with new Date(iso).
export function dateKey(year: number, month: number, day: number) {
  return `${String(year).padStart(4, '0')}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
export function todayKey() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}
export function dateParts(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return { year, month: month - 1, day }
}
export function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0, 12).getDate()
}
export function shiftMonth(year: number, month: number, delta: number) {
  const index = year * 12 + month + delta
  return { year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 }
}
export function monthCells(year: number, month: number): (string | null)[] {
  const start = (new Date(year, month, 1, 12).getDay() + 6) % 7
  const length = Math.ceil((start + daysInMonth(year, month)) / 7) * 7
  return Array.from({ length }, (_, index) => index < start || index >= start + daysInMonth(year, month) ? null : dateKey(year, month, index - start + 1))
}
export function formatDate(value: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) {
  const { year, month, day } = dateParts(value)
  return new Intl.DateTimeFormat('en-IN', options).format(new Date(year, month, day, 12))
}
export function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(year, month, 1, 12))
}
