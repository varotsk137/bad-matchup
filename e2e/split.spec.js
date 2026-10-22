import { expect, test } from '@playwright/test'
import { STORAGE_KEY, players, seed } from './helpers'

const NINE = ['Ann', 'Bee', 'Cat', 'Dan', 'Eve', 'Fon', 'Gus', 'Hon', 'Ice']

test('splits the bill, ticks who paid and keeps PromptPay off the shared state', async ({
  page,
}) => {
  await seed(page, { players: players(NINE) })
  await page.addInitScript(() =>
    localStorage.setItem(
      'bad-matchup:payment',
      JSON.stringify({ promptpay: '0812345678', name: 'Org', bankQr: '', method: 'promptpay' })
    )
  )
  await page.goto('/')
  await page.getByRole('button', { name: /^Start \d+ rounds$/ }).click()
  await expect(page.getByRole('button', { name: 'Finish', exact: true }).first()).toBeVisible()

  await page.getByRole('button', { name: '💰 Split' }).click()
  await page.getByRole('textbox', { name: 'Court 1 Price' }).fill('300')
  await page.getByRole('textbox', { name: 'Court 1 hrs' }).fill('2')
  await page.getByRole('textbox', { name: 'Court 2 Price' }).fill('180')
  await page.getByRole('textbox', { name: 'Court 2 hrs' }).fill('2')
  await page.getByRole('textbox', { name: 'Shuttles Price' }).fill('85')
  await page.getByRole('textbox', { name: 'Shuttles', exact: true }).fill('9')
  await expect(page.getByText('1,725 ÷ 9 people = 191.666… → 191.67 baht each')).toBeVisible()

  // opens on "same for all" with one QR carrying the amount
  await page.getByRole('button', { name: 'See who owes what' }).click()
  await expect(page.getByText('191.67 baht each')).toBeVisible()
  await expect(page.getByText('Rounded up +0.03')).toBeVisible()
  await expect(page.getByRole('img', { name: 'PromptPay' })).toBeVisible()

  await page.getByRole('tab', { name: 'Per person' }).click()
  await page.getByRole('button', { name: 'Not yet' }).first().click()
  await expect(page.getByText('Collected 191.67 of 1,725.03')).toBeVisible()
  await expect(page.getByText('1/9 people')).toBeVisible()

  const stored = await page.evaluate(
    (key) => ({
      app: localStorage.getItem(key),
      paid: JSON.parse(localStorage.getItem('bad-matchup:split-paid')),
      view: JSON.parse(localStorage.getItem('bad-matchup:split-view')),
    }),
    STORAGE_KEY
  )
  expect(stored.app).not.toContain('0812345678')
  expect(stored.paid.ids).toHaveLength(1)
  expect(stored.view).toBe('each')

  // prices are never remembered; the paid tick and the chosen view are
  await page.getByRole('button', { name: 'close' }).click()
  await page.getByRole('button', { name: '💰 Split' }).click()
  await expect(page.getByRole('textbox', { name: 'Court 1 Price' })).toHaveValue('')
  await page.getByRole('textbox', { name: 'Court 1 Price' }).fill('900')
  await page.getByRole('textbox', { name: 'Court 1 hrs' }).fill('1')
  await page.getByRole('button', { name: 'See who owes what' }).click()
  await expect(page.getByRole('tab', { name: 'Per person' })).toHaveAttribute(
    'aria-selected',
    'true'
  )
  await expect(page.getByText('1/9 people')).toBeVisible()
})
