import { useContext } from 'react'
import { CatalogueContext } from './CatalogueContext'

export function useCatalogue() {
  const value = useContext(CatalogueContext)
  if (!value) throw new Error('A catalogue provider is required.')
  return value
}
