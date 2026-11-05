import { useState } from 'react'
import { SearchBar } from '../../../components/discovery/SearchBar'
import { MoodChip } from '../../../components/discovery/MoodChip'
import { moods } from '../../../data/moods'
import type { Mood } from '../../../types/discovery'

export function HeroSection() {
  const [query, setQuery] = useState('')
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null)

  return <section className="hero" id="find-my-movie" aria-labelledby="hero-heading">
    <div className="hero-art" aria-hidden="true" />
    <div className="page-container hero-inner">
      <div className="hero-copy">
        <p className="eyebrow">A good movie changes your evening</p>
        <h2 id="hero-heading" className="discovery-heading">Every mood.<br /><span>A new story.</span></h2>
        <p className="hero-description">Find your next favourite film, however you feel.</p>
        <SearchBar query={query} onQueryChange={setQuery} />
        <div className="mood-section">
          <p>Or start with a feeling</p>
          <div className="mood-list" role="group" aria-label="Choose your movie mood">
            {moods.map((mood) => <MoodChip key={mood} mood={mood} selected={selectedMood === mood} onSelect={(value) => setSelectedMood(selectedMood === value ? null : value)} />)}
          </div>
          {selectedMood && <p className="mood-status" role="status">{selectedMood} selected · Mood-based discovery is coming soon.</p>}
        </div>
      </div>
      <p className="hero-caption"><span />Your next great watch starts here</p>
    </div>
  </section>
}
