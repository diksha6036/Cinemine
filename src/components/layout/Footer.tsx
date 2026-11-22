import { useI18n } from '../../i18n/LanguageProvider'
import { Link } from 'react-router-dom'

export function Footer() {
  const { t } = useI18n()
  return <footer className="site-footer page-container"><span>{t("cinemine · For the love of a good story.")}</span><nav className="footer-links" aria-label={t("Footer")}><Link to="/where-to-watch">{t("Where to watch")}</Link><Link to="/sitemap">{t("Sitemap")}</Link><Link className="footer-credits" to="/credits">{t("Credits")}</Link><a href="https://www.instagram.com/dr.cinemine/" target="_blank" rel="noopener noreferrer">@dr.cinemine</a></nav></footer>
}
