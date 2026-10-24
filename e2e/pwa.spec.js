import { expect, test } from '@playwright/test'
import { PREVIEW_URL, players, seed } from './helpers'

const EIGHT = ['Ann', 'Bee', 'Cat', 'Dan', 'Eve', 'Fon', 'Gus', 'Hon']
const OFFLINE_BAR = 'No internet found · matchmaking only'

const start = (page) => page.getByRole('button', { name: /^Start \d+ rounds$/ })
const finish = (page) => page.getByRole('button', { name: 'Finish', exact: true })
const live = (page) => page.getByRole('button', { name: 'Share', exact: true })

test('opens with no internet in matchmaking-only mode, and comes back on "try again"', async ({
  page,
}) => {
  await seed(page, { players: players(EIGHT) })
  await page.route('**/ping.txt*', (route) => route.abort('internetdisconnected'))
  await page.goto('/')

  await expect(page.getByText(OFFLINE_BAR)).toBeVisible()
  await start(page).click()
  await expect(finish(page)).toHaveCount(10)
  // matchmaking works; the live room does not show
  await expect(live(page)).toHaveCount(0)

  // still no signal: the mode stays as it is
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByText('Still no internet')).toBeVisible()
  await expect(page.getByText(OFFLINE_BAR)).toBeVisible()

  await page.unroute('**/ping.txt*')
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByText('Connected · everything is back')).toBeVisible()
  await expect(page.getByText(OFFLINE_BAR)).toHaveCount(0)
  await expect(live(page)).toBeVisible()
})

test('online, the full app shows with no bar', async ({ page }) => {
  await seed(page, { players: players(EIGHT) })
  await page.goto('/')
  await start(page).click()
  await expect(live(page)).toBeVisible()
  await expect(page.getByText(OFFLINE_BAR)).toHaveCount(0)
})

test.describe('the built app', () => {
  test.use({ baseURL: PREVIEW_URL })

  test('opens from its service worker with no signal, for matchmaking only', async ({
    page,
    context,
  }) => {
    await seed(page, { players: players(EIGHT) })
    await page.goto('/')
    await expect(start(page)).toBeVisible()
    await expect(page.getByText(OFFLINE_BAR)).toHaveCount(0)
    // the app shell is cached once the service worker is active
    await page.evaluate(() => navigator.serviceWorker.ready)

    await context.setOffline(true)
    await page.reload()

    await expect(page.getByText(OFFLINE_BAR)).toBeVisible()
    await start(page).click()
    await expect(finish(page)).toHaveCount(10)
    await expect(live(page)).toHaveCount(0)
    // the page font comes from the cache too, rather than a fallback
    const faces = await page.evaluate(async () =>
      (await document.fonts.load('16px "Noto Sans Thai"', 'ก')).map((f) => f.status)
    )
    expect(faces.length).toBeGreaterThan(0)
    expect(faces.every((status) => status === 'loaded')).toBe(true)
  })
})

test.describe('opened inside LINE', () => {
  test.use({
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36 Line/14.16.0/IAB',
  })

  test('suggests the browser, and stays away once dismissed', async ({ page }) => {
    await seed(page, {})
    await page.goto('/')

    const bar = page.getByText('Opened in LINE · it runs smoother in your browser')
    await expect(bar).toBeVisible()
    await page.getByRole('button', { name: 'Open', exact: true }).click()
    await expect(page).toHaveURL(/[?&]openExternalBrowser=1/)

    await page.getByRole('button', { name: 'Close', exact: true }).click()
    await expect(bar).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole('button', { name: /^Start|Players/ }).first()).toBeVisible()
    await expect(bar).toHaveCount(0)
  })
})

test('invites to install once, for a few seconds', async ({ page }) => {
  await seed(page, { players: players(EIGHT) })
  // what Chrome hands over when the app can be installed
  const offerInstall = () =>
    page.evaluate(() => {
      const e = new Event('beforeinstallprompt', { cancelable: true })
      e.prompt = async () => {
        window.__prompted = true
      }
      e.userChoice = Promise.resolve({ outcome: 'dismissed' })
      window.dispatchEvent(e)
    })

  await page.goto('/')
  await offerInstall()
  const invite = page.getByRole('button', { name: /Add it to this device as an app/ })
  await expect(invite).toBeVisible()
  await expect(invite).toHaveCSS('opacity', '1')
  await expect(invite).toHaveCount(0, { timeout: 8000 })

  // once per device
  await page.reload()
  await offerInstall()
  await page.waitForTimeout(2500)
  await expect(invite).toHaveCount(0)

  // Settings keeps the way in
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByRole('button', { name: 'Install', exact: true }).click()
  expect(await page.evaluate(() => window.__prompted)).toBe(true)
})
