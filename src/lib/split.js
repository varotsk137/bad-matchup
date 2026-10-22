/**
 * Splitting the court and shuttle bill equally. Everything is counted in
 * satang (whole numbers) so no 0.1 + 0.2 surprises creep in, and every share
 * is rounded *up*: what comes in is never less than what was spent. The few
 * satang over are shown, so nobody wonders where they went.
 */

/** Rounding steps, in satang. */
export const ROUNDING = { cents: 1, baht: 100, five: 500 }

/** A positive number as typed — "85.5", "1,200", "1.5" hours; blank or nonsense → 0. */
export function toAmount(text) {
  const n = Number(String(text ?? '').replaceAll(',', ''))
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** Baht as typed → satang. */
export const toSatang = (text) => Math.round(toAmount(text) * 100)

/** a ÷ b rounded up, for whole numbers only. */
const ceilDiv = (a, b) => (a - (a % b)) / b + (a % b ? 1 : 0)

/**
 * @param {{ courts: { price: string, hours: string }[], shuttlePrice: string,
 *   shuttles: number, people: number, rounding: keyof ROUNDING }} input
 */
export function splitBill({ courts, shuttlePrice, shuttles, people, rounding = 'cents' }) {
  const courtCosts = courts.map((c) => Math.round(toSatang(c.price) * toAmount(c.hours)))
  const courtTotal = courtCosts.reduce((s, x) => s + x, 0)
  const shuttleCost = toSatang(shuttlePrice) * Math.max(0, Math.floor(shuttles || 0))
  const total = courtTotal + shuttleCost
  const step = ROUNDING[rounding] ?? ROUNDING.cents
  const each = people > 0 && total > 0 ? ceilDiv(total, people * step) * step : 0
  return {
    courtCosts,
    courtTotal,
    shuttleCost,
    total,
    each,
    collected: each * people,
    surplus: each * people - total,
  }
}

/**
 * Satang as baht for people to read: "1,725", "191.67". `decimals` forces a
 * fixed number of places; by default they show only when there are some.
 */
export function formatBaht(satang, decimals) {
  const places = decimals ?? (satang % 100 ? 2 : 0)
  return (satang / 100).toLocaleString('en-US', {
    minimumFractionDigits: places,
    maximumFractionDigits: places,
  })
}

/** The exact share before rounding, "191.666…", for the working-out line. */
export function exactShare(total, people) {
  if (people <= 0) return '0'
  if (total % people === 0) return formatBaht(total / people)
  const thousandths = Math.floor((total * 10) / people)
  const text = (thousandths / 1000).toLocaleString('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })
  return (total * 10) % people ? `${text}…` : text
}
