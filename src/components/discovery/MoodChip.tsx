import type { Mood } from '../../types/discovery'

interface MoodChipProps { mood: Mood; selected: boolean; onSelect: (mood: Mood) => void }
export function MoodChip({ mood, selected, onSelect }: MoodChipProps) {
  return <button type="button" aria-pressed={selected} className={`mood-chip ${selected ? 'is-selected' : ''}`} onClick={() => onSelect(mood)}>{mood}</button>
}
