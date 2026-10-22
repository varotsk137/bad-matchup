import { describe, expect, it } from 'vitest'
import { exactShare, formatBaht, splitBill, toSatang } from './split'

const bill = (extra) =>
  splitBill({
    courts: [
      { price: '300', hours: '2' },
      { price: '180', hours: '2' },
    ],
    shuttlePrice: '85',
    shuttles: 9,
    people: 9,
    ...extra,
  })

describe('toSatang', () => {
  it('reads baht with decimals and commas', () => {
    expect(toSatang('85')).toBe(8500)
    expect(toSatang('85.5')).toBe(8550)
    expect(toSatang('1,200')).toBe(120000)
    expect(toSatang('0.1')).toBe(10)
  })

  it('treats blank and nonsense as nothing', () => {
    expect(toSatang('')).toBe(0)
    expect(toSatang('abc')).toBe(0)
    expect(toSatang('-5')).toBe(0)
  })
})

describe('splitBill', () => {
  it('adds courts and shuttles', () => {
    const r = bill()
    expect(r.courtCosts).toEqual([60000, 36000])
    expect(r.courtTotal).toBe(96000)
    expect(r.shuttleCost).toBe(76500)
    expect(r.total).toBe(172500)
  })

  it('rounds up to the satang by default: 191.666… → 191.67', () => {
    const r = bill()
    expect(r.each).toBe(19167)
    expect(r.surplus).toBe(3)
    expect(r.collected).toBe(172503)
  })

  it('rounds 0.666… up to 0.67, never down', () => {
    const r = splitBill({ courts: [{ price: '2', hours: '1' }], shuttles: 0, people: 3 })
    expect(r.each).toBe(67)
    expect(r.surplus).toBe(1)
  })

  it('rounds up to whole baht', () => {
    const r = bill({ rounding: 'baht' })
    expect(r.each).toBe(19200)
    expect(r.surplus).toBe(300)
  })

  it('rounds up to 5 baht', () => {
    const r = bill({ rounding: 'five' })
    expect(r.each).toBe(19500)
    expect(r.surplus).toBe(3000)
  })

  it('adds nothing when the bill divides evenly', () => {
    const r = splitBill({ courts: [{ price: '300', hours: '2' }], shuttles: 0, people: 6 })
    expect(r.each).toBe(10000)
    expect(r.surplus).toBe(0)
    expect(
      splitBill({ courts: [{ price: '300', hours: '2' }], people: 6, rounding: 'five' }).each
    ).toBe(10000)
  })

  it('never collects less than was spent', () => {
    for (let total = 1; total < 3000; total += 7) {
      for (const people of [1, 2, 3, 6, 7, 9, 11, 12]) {
        for (const rounding of ['cents', 'baht', 'five']) {
          const r = splitBill({
            courts: [{ price: String(total / 100), hours: '1' }],
            people,
            rounding,
          })
          expect(r.collected).toBeGreaterThanOrEqual(r.total)
          expect(r.surplus).toBeLessThan(people * { cents: 1, baht: 100, five: 500 }[rounding])
        }
      }
    }
  })

  it('handles half hours and blank courts', () => {
    const r = splitBill({
      courts: [
        { price: '250', hours: '1.5' },
        { price: '', hours: '2' },
      ],
      shuttles: 0,
      people: 4,
    })
    expect(r.courtCosts).toEqual([37500, 0])
    expect(r.each).toBe(9375)
  })

  it('splits nothing when nobody is playing or nothing was spent', () => {
    expect(bill({ people: 0 }).each).toBe(0)
    expect(splitBill({ courts: [], people: 8 }).each).toBe(0)
  })
})

describe('formatBaht', () => {
  it('shows decimals only when there are some, unless told otherwise', () => {
    expect(formatBaht(172500)).toBe('1,725')
    expect(formatBaht(19167)).toBe('191.67')
    expect(formatBaht(19200, 2)).toBe('192.00')
    expect(formatBaht(3)).toBe('0.03')
  })
})

describe('exactShare', () => {
  it('shows the unrounded share with an ellipsis when it goes on', () => {
    expect(exactShare(172500, 9)).toBe('191.666…')
    expect(exactShare(60000, 6)).toBe('100')
    expect(exactShare(1000, 8)).toBe('1.25')
    expect(exactShare(1001, 8)).toBe('1.251…')
  })
})
