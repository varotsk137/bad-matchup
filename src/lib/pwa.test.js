import { describe, expect, it } from 'vitest'
import { checkOnline, inLine, installKind, isIos, readFlag, setFlag } from './pwa'

const answer =
  (body, ok = true) =>
  async () => ({ ok, text: async () => body })

describe('checkOnline', () => {
  it('is online when the server answers ok, asked past every cache', async () => {
    let asked
    const fetchImpl = async (url, init) => {
      asked = { url, init }
      return { ok: true, text: async () => 'ok\n' }
    }
    expect(await checkOnline({ fetchImpl, url: './ping.txt' })).toBe(true)
    expect(asked.url).toMatch(/^\.\/ping\.txt\?t=\d+$/)
    expect(asked.init.cache).toBe('no-store')
  })

  it('is offline when the request fails or the answer is someone else’s page', async () => {
    const fail = async () => {
      throw new TypeError('Failed to fetch')
    }
    expect(await checkOnline({ fetchImpl: fail })).toBe(false)
    expect(await checkOnline({ fetchImpl: answer('', false) })).toBe(false)
    // a captive portal answers 200 with its own login page
    expect(await checkOnline({ fetchImpl: answer('<html>Wi-Fi login</html>') })).toBe(false)
  })

  it('gives up after the timeout', async () => {
    const hang = (_url, { signal }) =>
      new Promise((_, reject) =>
        signal.addEventListener('abort', () => reject(new Error('aborted')))
      )
    const started = Date.now()
    expect(await checkOnline({ fetchImpl: hang, timeout: 50 })).toBe(false)
    expect(Date.now() - started).toBeLessThan(1000)
  })
})

describe('where the app is open', () => {
  const LINE_IOS =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/14.16.0'
  const LINE_ANDROID =
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36 Line/14.16.0/IAB'
  const CHROME =
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
  const SAFARI_IOS =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

  it('spots LINE’s in-app browser', () => {
    expect(inLine(LINE_IOS)).toBe(true)
    expect(inLine(LINE_ANDROID)).toBe(true)
    expect(inLine(CHROME)).toBe(false)
    expect(inLine(SAFARI_IOS)).toBe(false)
  })

  it('spots iOS, including an iPad that says it is a Mac', () => {
    expect(isIos({ userAgent: SAFARI_IOS })).toBe(true)
    expect(isIos({ userAgent: 'Macintosh', platform: 'MacIntel', maxTouchPoints: 5 })).toBe(
      true
    )
    expect(isIos({ userAgent: 'Macintosh', platform: 'MacIntel', maxTouchPoints: 0 })).toBe(
      false
    )
    expect(isIos({ userAgent: CHROME })).toBe(false)
  })

  const win = (userAgent, { standalone = false, platform = '' } = {}) => ({
    navigator: { userAgent, platform, maxTouchPoints: 0 },
    matchMedia: () => ({ matches: standalone }),
  })
  const idle = { installPrompt: null, installed: false }

  it('picks how installing works', () => {
    expect(installKind(idle, win(CHROME, { standalone: true }))).toBe('installed')
    expect(installKind({ ...idle, installed: true }, win(CHROME))).toBe('installed')
    expect(installKind(idle, win(LINE_ANDROID))).toBe('line')
    expect(installKind({ ...idle, installPrompt: {} }, win(CHROME))).toBe('prompt')
    expect(installKind(idle, win(SAFARI_IOS))).toBe('ios')
    expect(installKind(idle, win(CHROME))).toBe('manual')
  })
})

describe('once-per-device flags', () => {
  const memory = () => {
    const data = new Map()
    return {
      getItem: (k) => data.get(k) ?? null,
      setItem: (k, v) => data.set(k, String(v)),
    }
  }

  it('remembers each flag on its own', () => {
    const storage = memory()
    expect(readFlag('invited', storage)).toBe(false)
    setFlag('invited', storage)
    setFlag('lineDismissed', storage)
    expect(readFlag('invited', storage)).toBe(true)
    expect(readFlag('lineDismissed', storage)).toBe(true)
    expect(readFlag('other', storage)).toBe(false)
  })

  it('treats unreadable storage as never set', () => {
    const broken = {
      getItem: () => {
        throw new Error('denied')
      },
      setItem: () => {
        throw new Error('denied')
      },
    }
    expect(readFlag('invited', broken)).toBe(false)
    expect(() => setFlag('invited', broken)).not.toThrow()
  })
})
