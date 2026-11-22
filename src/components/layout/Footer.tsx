import { Link } from 'react-router-dom'
import { useMobileLayout } from '../../lib/useMobileLayout'

export function Footer() {
  const mobile = useMobileLayout()
  return <footer className="site-footer page-container"><span>cinemine · For the love of a good story.</span><nav className="footer-links" aria-label="Footer"><Link to={mobile ? '/#where-to-watch' : '/where-to-watch'}>Where to watch</Link><Link to="/sitemap">Sitemap</Link><a href="https://www.instagram.com/dr.cinemine/" target="_blank" rel="noopener noreferrer">@dr.cinemine</a></nav></footer>
}
