import { Link } from 'react-router-dom'

export function Footer() {
  return <footer className="site-footer page-container"><span>cinemine · For the love of a good story.</span><nav className="footer-links" aria-label="Footer"><Link to="/where-to-watch">Where to watch</Link><Link to="/sitemap">Sitemap</Link><Link className="footer-credits" to="/credits">Credits</Link><a href="https://www.instagram.com/dr.cinemine/" target="_blank" rel="noopener noreferrer">@dr.cinemine</a></nav></footer>
}
