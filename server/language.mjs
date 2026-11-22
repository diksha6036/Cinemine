import { AsyncLocalStorage } from 'node:async_hooks'
import { getLanguage } from '../shared/languages.mjs'

const context = new AsyncLocalStorage()
export const currentLanguage = () => getLanguage(context.getStore())
export const withLanguage = (code, task) => context.run(getLanguage(code).code, task)
// Preserve existing English cache keys while keeping translated records separate.
export const localizedKey = key => currentLanguage().code === 'en' ? key : `${currentLanguage().code}:${key}`
