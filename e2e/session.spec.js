import { expect, test } from '@playwright/test'
import { players, savedState, seed, shareHash } from './helpers'

const EIGHT = ['Ann', 'Bee', 'Cat', 'Dan', 'Eve', 'Fon', 'Gus', 'Hon']

test('adds a player and keeps them after a reload', async ({ page }) => {
  await seed(page, {})
  await page.goto('/')

  await page.getByRole('button', { name: 'Players', exact: true }).click()
  await page.getByRole('textbox', { name: 'Add player' }).fill('Somchai')
  await page.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByText('Somchai')).toBeVisible()

  await page.reload()
  await page.getByRole('button', { name: 'Players', exact: true }).click()
  await expect(page.getByText('Somchai')).toBeVisible()
})

test('refuses a name already taken, and one past 12 characters', async ({ page }) => {
  await seed(page, { players: players(EIGHT) })
  await page.goto('/')
  await page.getByRole('button', { name: 'Players', exact: true }).click()

  const name = page.getByRole('textbox', { name: 'Add player' })
  const add = page.getByRole('button', { name: 'Add', exact: true })
  await name.fill('ann ')
  await expect(page.getByRole('alert')).toContainText('already here')
  await expect(add).toBeDisabled()

  await name.fill('Abcdefghijklmnop')
  await expect(name).toHaveValue('Abcdefghijkl')

  await name.fill('Ann B.')
  await add.click()
  expect((await savedState(page)).players.map((p) => p.name)).toContain('Ann B.')
})

test('lists rooms opened before from the header', async ({ page }) => {
  await seed(page, {})
  await page.addInitScript(() =>
    localStorage.setItem(
      'bad-matchup:room-history',
      JSON.stringify([
        {
          id: 'k7QmAbCdEfGh12345678',
          key: null,
          role: 'watch',
          lastAt: Date.now(),
          updatedAt: Date.now(),
          closedAt: null,
          names: ['Ann', 'Bee', 'Cat'],
          players: 8,
          rounds: 12,
        },
      ])
    )
  )
  await page.goto('/')
  await page.getByRole('button', { name: 'Rooms you have opened' }).click()
  await expect(page.getByRole('dialog')).toContainText('Ann, Bee, Cat +5')
  await page.getByRole('button', { name: 'Ann, Bee, Cat +5' }).click()
  await expect(page).toHaveURL(/#room=k7QmAbCdEfGh12345678/)
})

test('builds a schedule, ticks a match and keeps both after a reload', async ({ page }) => {
  await seed(page, { players: players(EIGHT) })
  await page.goto('/')

  await page.getByRole('button', { name: /^Start \d+ rounds$/ }).click()
  const finish = page.getByRole('button', { name: 'Finish', exact: true })
  await expect(finish.first()).toBeVisible()
  // two courts, five rounds
  await expect(finish).toHaveCount(10)

  await finish.first().click()
  await expect(page.locator('button[aria-pressed="true"]')).toHaveCount(1)

  const saved = await savedState(page)
  expect(saved.rounds).toHaveLength(5)
  expect(saved.rounds[0].matches.filter((m) => m.done)).toHaveLength(1)

  await page.reload()
  await expect(page.locator('button[aria-pressed="true"]')).toHaveCount(1)
  await expect(finish).toHaveCount(9)
})

test('opens a view-only share link without touching my own data', async ({ page }) => {
  await seed(page, { players: players(['Mine']) })
  const packed = {
    v: 1,
    t: Date.UTC(2026, 9, 18),
    p: EIGHT.slice(0, 4).map((name) => [name, 3, 0]),
    c: [['1', 2]],
    r: [[[0, [0, 1], [2, 3], 21, 15, 1]]],
    b: [[]],
  }
  await page.goto('/' + shareHash(packed))

  await expect(page.getByText('Shared schedule')).toBeVisible()
  await expect(page.getByText('Ann', { exact: true })).toBeVisible()
  // read only: nothing to tick
  await expect(page.getByRole('button', { name: 'Finish', exact: true })).toHaveCount(0)

  await page.getByRole('button', { name: 'Back to my data' }).click()
  await expect(page.getByText('Shared schedule')).toHaveCount(0)
  const saved = await savedState(page)
  expect(saved.players.map((p) => p.name)).toEqual(['Mine'])
})

test('switches language and theme, and remembers them', async ({ page }) => {
  await seed(page, {})
  await page.goto('/')

  await page.getByRole('button', { name: 'Language' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'th')
  await page.getByRole('button', { name: 'ธีม' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)

  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'th')
  await expect(page.locator('html')).toHaveClass(/dark/)
})
