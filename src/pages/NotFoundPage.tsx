import { useI18n } from '../i18n/LanguageProvider'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Footer } from '../components/layout/Footer'
export function NotFoundPage() {
  const { t } = useI18n()
  return <><main id="main-content" className="movie-detail-page page-container"><p className="eyebrow">{t("404 · Page not found")}</p><h1>{t("This scene is missing.")}</h1><p>{t("The page you’re looking for could not be found.")}</p><Link className="feature-button primary" to="/"><ArrowLeft size={17} />  {t("Explore films")}</Link></main><Footer /></>
}
