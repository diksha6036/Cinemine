import { Instagram, ArrowUpRight } from 'lucide-react'

export function InstagramSection() {
  return <section id="instagram" className="instagram-section page-container" aria-labelledby="instagram-heading"><div className="instagram-heading"><Instagram size={29} strokeWidth={1.8} /><h2 id="instagram-heading">From our Instagram</h2></div><span className="social-divider" aria-hidden="true" /><p>Stories worth sharing. Films worth saving.</p><a className="instagram-profile-link" href="https://www.instagram.com/dr.cinemine/" target="_blank" rel="noopener noreferrer">@dr.cinemine <ArrowUpRight size={17} /></a></section>
}
