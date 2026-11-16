import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseEnv } from 'node:util'

export function readServerConfig() {
  let local = {}
  try { local = parseEnv(readFileSync(resolve(process.cwd(), '.env'), 'utf8')) }
  catch (error) { if (error.code !== 'ENOENT') throw new Error('The local .env file could not be read.') }
  return {
    token: (process.env.TMDB_READ_ACCESS_TOKEN || process.env.TMDB_ACCESS_TOKEN || local.TMDB_READ_ACCESS_TOKEN || local.TMDB_ACCESS_TOKEN || '').trim(),
    apiKey: (process.env.TMDB_API_KEY || local.TMDB_API_KEY || '').trim(),
  }
}
export function isConfigured() { const config = readServerConfig(); return Boolean(config.token || config.apiKey) }
