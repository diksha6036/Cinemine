import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

// Exercise the actual TypeScript utilities using the project's existing compiler.
// No test framework, browser, or new dependency is needed.
async function importUtility(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
}
const dates = await importUtility('../src/features/calendar/utils/dates.ts')
const { deduplicateEvents } = await importUtility('../src/features/calendar/utils/events.ts')

test('month navigation crosses both year boundaries', () => {
  assert.deepEqual(dates.shiftMonth(2026, 11, 1), { year: 2027, month: 0 })
  assert.deepEqual(dates.shiftMonth(2026, 0, -1), { year: 2025, month: 11 })
  assert.deepEqual(dates.shiftMonth(2026, 10, 14), { year: 2028, month: 0 })
})
test('Gregorian leap years include 2000 and exclude 2100', () => {
  assert.equal(dates.daysInMonth(2024, 1), 29)
  assert.equal(dates.daysInMonth(2025, 1), 28)
  assert.equal(dates.daysInMonth(2000, 1), 29)
  assert.equal(dates.daysInMonth(2100, 1), 28)
  assert.ok(dates.monthCells(2024, 1).includes('2024-02-29'))
})
test('Monday-first cells handle Monday, Sunday, and variable month lengths', () => {
  assert.equal(dates.monthCells(2026, 5)[0], '2026-06-01')
  assert.equal(dates.monthCells(2026, 10)[6], '2026-11-01')
  assert.equal(dates.monthCells(2026, 7).length, 42)
  for (let month = 0; month < 12; month++) {
    const cells = dates.monthCells(2026, month)
    assert.equal(cells.length % 7, 0)
    assert.equal(cells.filter(Boolean).length, dates.daysInMonth(2026, month))
  }
})
test('calendar dates round-trip and format without shifting the day', () => {
  for (const date of ['2024-02-29', '2026-01-01', '2026-12-31']) {
    const { year, month, day } = dates.dateParts(date)
    assert.equal(dates.dateKey(year, month, day), date)
    assert.equal(dates.formatDate(date, { day: 'numeric' }), String(day))
  }
})
test('deduplication preserves different dates, formats, countries, and undated events', () => {
  const base = { movieId: 'film-a', countryCode: 'IN', releaseType: 'Theatrical', date: '2026-11-16', lastCheckedAt: '2026-11-01', eventId: 'old' }
  const events = [base, { ...base, eventId: 'new', lastCheckedAt: '2026-11-02' }, { ...base, eventId: 'digital', releaseType: 'Digital' }, { ...base, eventId: 'other-date', date: '2026-11-17' }, { ...base, eventId: 'us', countryCode: 'US' }, { ...base, eventId: 'tba', date: null }, { ...base, eventId: 'tba-copy', date: null }]
  const result = deduplicateEvents(events)
  assert.equal(result.length, 5)
  assert.equal(result[0].eventId, 'new')
  assert.equal(result.filter(event => event.date === null).length, 1)
})
