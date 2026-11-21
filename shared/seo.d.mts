import type { SearchMovie } from '../src/features/search/types/search'
export const SITE_NAME: string
export const HOME_DESCRIPTION: string
export function escapeHtml(value: unknown): string
export function scriptJson(value: unknown): string
export function cleanOrigin(value: string): string
export interface MetadataInput { pathname?: string; origin: string; movie?: SearchMovie | null; movies?: SearchMovie[]; status?: number; noIndex?: boolean }
export interface Metadata { title: string; description: string; canonical: string; image: string; imageAlt: string; type: string; robots: string; jsonLd: Record<string, unknown> }
export function createMetadata(input: MetadataInput): Metadata
export function renderHead(metadata: Metadata): string
