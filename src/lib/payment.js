/**
 * Where the organiser gets paid, plus the bits of the cost split worth
 * keeping between visits. All of it lives under its own keys on this device:
 * it is never part of the app state, so a live room or a backup file can
 * never carry someone's PromptPay number or bank QR.
 *
 * The prices themselves are deliberately not kept — they change from night
 * to night, and a stale price is worse than an empty box.
 */

const PAYMENT_KEY = 'bad-matchup:payment'
const VIEW_KEY = 'bad-matchup:split-view'
const PAID_KEY = 'bad-matchup:split-paid'

const read = (key) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    // quota full (a big bank QR) or private mode
    return false
  }
}

/**
 * @returns {{ promptpay: string, name: string, bankQr: string,
 *   method: 'promptpay' | 'image' }}
 */
export function loadPayment() {
  const saved = read(PAYMENT_KEY) || {}
  return {
    promptpay: typeof saved.promptpay === 'string' ? saved.promptpay : '',
    name: typeof saved.name === 'string' ? saved.name : '',
    bankQr: typeof saved.bankQr === 'string' ? saved.bankQr : '',
    method: saved.method === 'image' ? 'image' : 'promptpay',
  }
}

export const savePayment = (payment) => write(PAYMENT_KEY, payment)

/** The result sheet opens on "everyone pays the same" until someone picks the list. */
export const loadSplitView = () => (read(VIEW_KEY) === 'each' ? 'each' : 'equal')
export const saveSplitView = (view) => write(VIEW_KEY, view)

/**
 * Who has paid, for one session only: the ticks belong to the schedule they
 * were made against, so next week's session starts with nobody paid.
 */
export function loadPaid(session) {
  const saved = read(PAID_KEY)
  return saved?.session === session && Array.isArray(saved.ids) ? new Set(saved.ids) : new Set()
}

export const savePaid = (session, ids) => write(PAID_KEY, { session, ids: [...ids] })

/**
 * Shrinks a picked QR image so it fits comfortably in localStorage. PNG keeps
 * the squares sharp; 720px is plenty for a phone to scan off another screen.
 * @returns {Promise<string>} a data: URL
 */
export function shrinkImage(file, max = 720) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingEnabled = scale < 1
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('not an image'))
    }
    img.src = url
  })
}
