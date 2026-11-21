import type { IncomingMessage, ServerResponse } from 'node:http'
import type { PageData } from '../src/app/PageData'
export function handlePage(request: IncomingMessage, response: ServerResponse, options?: { template?: string; render?: (page: PageData) => Promise<string> }): Promise<void>
