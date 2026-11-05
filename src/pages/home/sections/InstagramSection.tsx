import { Instagram } from 'lucide-react'

export function InstagramSection() {
  return <section id="instagram" className="instagram-section page-container" aria-labelledby="instagram-heading">
    <div className="instagram-heading"><Instagram size={29} strokeWidth={1.8} aria-hidden="true" /><h2 id="instagram-heading">From our Instagram</h2></div>
    <span className="social-divider" aria-hidden="true" />
    <p>Stories worth sharing. Films worth saving.</p>
    <span className="coming-soon">Coming soon</span>
  </section>
}
