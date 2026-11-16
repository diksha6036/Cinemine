import type { IncomingMessage, ServerResponse } from 'node:http'
export function handleApi(request: IncomingMessage, response: ServerResponse): Promise<boolean>
export function validDate(value: string): boolean
