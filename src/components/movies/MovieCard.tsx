import { useI18n } from '../../i18n/LanguageProvider'
import { MovieArtwork } from './MovieArtwork'
import type { Movie } from '../../types/movie'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { mediaLabel } from '../../../shared/media.mjs'

interface MovieCardProps { movie: Movie; onSelect?: () => void; href?: string }
export function MovieCard({ movie, onSelect, href }: MovieCardProps) {
  const { t } = useI18n()
  const content = <>
    <div className="movie-card-art"><MovieArtwork movie={movie} />{(href || onSelect) && <span className="movie-card-discover" aria-hidden="true"><span>{href ? t('Explore this title') : t('Quick preview')} <ArrowUpRight size={14} /></span></span>}</div>
    <h3>{movie.title}</h3>
    <p className="movie-meta"><span className="media-kind">{t(mediaLabel(movie))}</span><span>{movie.releaseYear}</span><span aria-hidden="true">·</span><span>{t(movie.genres[0] ?? "")}</span></p>
  </>
  return <article className="movie-card">{href ? <Link className="movie-card-select" to={href} aria-label={t('Explore {title}', { title: movie.title })}>{content}</Link> : onSelect ? <button type="button" className="movie-card-select" onClick={onSelect} aria-label={t('Preview {title}', { title: movie.title })}>{content}</button> : content}</article>
}
