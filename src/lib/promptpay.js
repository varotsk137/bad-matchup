/**
 * PromptPay QR payloads (Thai QR Payment, built on EMVCo merchant-presented
 * mode). Every Thai banking app reads these and fills in the amount, so a
 * player scans once and only has to press "confirm".
 *
 * Small enough to write out rather than pull in a library: a handful of
 * tag-length-value fields and a CRC16 checksum at the end.
 */

const AID_PROMPTPAY = 'A000000677010111'

/** One EMVCo field: two-digit id, two-digit length, value. */
const field = (id, value) => `${id}${String(value.length).padStart(2, '0')}${value}`

/** CRC16-CCITT (poly 0x1021, start 0xFFFF), as four upper-case hex digits. */
export function crc16(text) {
  let crc = 0xffff
  for (let i = 0; i < text.length; i++) {
    crc ^= text.charCodeAt(i) << 8
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/**
 * What kind of PromptPay ID someone typed, ignoring dashes and spaces:
 * a mobile number (10 digits, starting with 0) or a 13-digit national ID.
 * @returns {{ type: 'phone' | 'id', digits: string } | null}
 */
export function parsePromptPayId(input) {
  const digits = String(input ?? '').replace(/\D/g, '')
  if (/^0\d{9}$/.test(digits)) return { type: 'phone', digits }
  if (/^\d{13}$/.test(digits)) return { type: 'id', digits }
  return null
}

/** 081-234-5678, or a national ID with only its last four digits showing. */
export function formatPromptPayId(input) {
  const id = parsePromptPayId(input)
  if (!id) return String(input ?? '')
  const d = id.digits
  if (id.type === 'phone') return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  return `x-xxxx-xxxx${d[9]}-${d.slice(10, 12)}-${d[12]}`
}

/**
 * The string to put in the QR code.
 * @param {string} target mobile number or national ID
 * @param {number} [satang] amount in satang; leave out for "type your own"
 */
export function promptPayPayload(target, satang) {
  const id = parsePromptPayId(target)
  if (!id) throw new Error('not a PromptPay ID')
  // a mobile number goes in as 0066 + the number without its leading 0
  const account =
    id.type === 'phone' ? field('01', `0066${id.digits.slice(1)}`) : field('02', id.digits)
  const withAmount = Number.isInteger(satang) && satang > 0
  const body = [
    field('00', '01'),
    // 11 = the same code can be paid any number of times; 12 = carries an amount
    field('01', withAmount ? '12' : '11'),
    field('29', field('00', AID_PROMPTPAY) + account),
    field('58', 'TH'),
    field('53', '764'),
    withAmount ? field('54', (satang / 100).toFixed(2)) : '',
  ].join('')
  const signed = `${body}6304`
  return signed + crc16(signed)
}
