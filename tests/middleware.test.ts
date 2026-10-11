// @vitest-environment node
import { describe, expect, it } from 'vitest'
import middleware, { passwordOk } from '../middleware'

const HASH = 'fc7df2f89b65a610df3f7c8191dd5a32f8ee7f2f8d4cfb5981589b9ec11f3975'
const basic = (user: string, pass: string) => 'Basic ' + btoa(`${user}:${pass}`)

describe('site gate', () => {
  it('accepts the password with any username', async () => {
    expect(await passwordOk(basic('anyone', 'goforth'), HASH)).toBe(true)
    expect(await passwordOk(basic('', 'goforth'), HASH)).toBe(true)
  })
  it('rejects a wrong, missing or malformed password', async () => {
    expect(await passwordOk(basic('x', 'GoForth'), HASH)).toBe(false)
    expect(await passwordOk(null, HASH)).toBe(false)
    expect(await passwordOk('Bearer abc', HASH)).toBe(false)
    expect(await passwordOk('Basic %%%', HASH)).toBe(false)
  })
  it('answers 401 with a sign-in prompt when locked', async () => {
    const r = await middleware(new Request('https://rueca.dev/'))
    expect(r.status).toBe(401)
    expect(r.headers.get('WWW-Authenticate')).toMatch(/^Basic /)
  })
  it('lets the request through with the password', async () => {
    const r = await middleware(new Request('https://rueca.dev/', { headers: { authorization: basic('u', 'goforth') } }))
    expect(r.status).not.toBe(401)
  })
})
