/* ---------------------------------------------------------------------------
   Site gate — Vercel Routing Middleware. Every request to the deployed site
   needs the password (HTTP Basic auth; any username). Only a SHA-256 hash of
   the password lives here, so the repo can go public without leaking it.

   Change the password: set SITE_PASSWORD_SHA256 in the Vercel project's
   environment variables (hex SHA-256 of the new password), or replace the
   default below. Remove the gate: delete this file.
   Local dev (`npm run dev`) is never gated — Vite doesn't run this file.
--------------------------------------------------------------------------- */
import { next } from '@vercel/functions'

const DEFAULT_SHA256 = 'fc7df2f89b65a610df3f7c8191dd5a32f8ee7f2f8d4cfb5981589b9ec11f3975'

export const config = { runtime: 'nodejs' }

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** constant-time compare of two equal-length hex strings */
function same(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function passwordOk(authorization: string | null, expected: string) {
  const m = authorization?.match(/^Basic\s+(.+)$/i)
  if (!m) return false
  let decoded = ''
  try { decoded = atob(m[1]) } catch { return false }
  const password = decoded.slice(decoded.indexOf(':') + 1)
  return same(await sha256(password), expected.toLowerCase())
}

export default async function middleware(request: Request) {
  const expected = process.env.SITE_PASSWORD_SHA256 || DEFAULT_SHA256
  if (await passwordOk(request.headers.get('authorization'), expected)) return next()
  return new Response('This site is private for now.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Rueca", charset="UTF-8"', 'Cache-Control': 'no-store' },
  })
}
