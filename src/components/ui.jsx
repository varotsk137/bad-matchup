import { useEffect, useId, useRef, useState } from 'react'
import Icon from './Icon'

export const cx = (...parts) => parts.filter(Boolean).join(' ')

/**
 * Every court gets a colour of its own from the skin — in League court 1 is
 * blue, court 2 orange and so on; Classic keeps them all the same dark pill.
 */
const COURT_TONES = [
  'bg-court-1 text-white',
  'bg-court-2 text-white',
  'bg-court-3 text-white',
  'bg-court-4 text-white',
  'bg-court-5 text-white',
]
export const courtTone = (index) => COURT_TONES[Math.max(0, index) % COURT_TONES.length]

/* ---------------------------------------------------------------- Card */

export function Card({ className = '', tone, children, ...rest }) {
  return (
    <div
      className={cx(
        'rounded-2xl border-(length:--line-w) shadow-[var(--shadow-card)]',
        // ink: an inverted scoreboard block for the one thing a screen is about
        tone === 'ink'
          ? 'border-transparent bg-slate-900 text-slate-50 dark:bg-slate-800'
          : 'border-edge bg-slate-50 dark:bg-slate-900',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

/** The large title a screen opens with, a line of context under it, an action on the right. */
export function ScreenTitle({ title, meta, action }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3 px-1 pt-1">
      <div className="min-w-0">
        <h2 className="screen-title truncate text-slate-900 dark:text-slate-50">{title}</h2>
        {meta && (
          <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{meta}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/** A big scoreboard number with its label; `ink` for use inside an ink Card. */
export function StatTile({ value, label, hint, ink = false, className = '' }) {
  return (
    <div className={cx('min-w-0', className)}>
      <div className="num text-[2rem]">{value}</div>
      <div
        className={cx(
          'mt-1.5 text-xs font-medium',
          ink ? 'text-slate-300 dark:text-slate-300' : 'text-slate-600 dark:text-slate-400'
        )}
      >
        {label}
      </div>
      {hint && (
        <div className={cx('mt-0.5 text-xs', ink ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400')}>
          {hint}
        </div>
      )}
    </div>
  )
}

/** A round initial for a person; pass a tone class (bg + text) to colour it. */
export function Avatar({ name = '', className = '', tone = 'bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-100' }) {
  // skip Thai leading vowels (เ แ โ ใ ไ), which are written before the consonant they follow
  const parts = [...new Intl.Segmenter().segment(name.trim())].map((p) => p.segment)
  const first = parts.find((g) => !/^[เแโใไ]$/.test(g)) || parts[0] || '?'
  return (
    <span
      aria-hidden
      className={cx(
        'font-display grid h-10 w-10 shrink-0 place-items-center rounded-full text-base',
        tone,
        className
      )}
    >
      {first}
    </span>
  )
}

export function SectionTitle({ children, hint, action }) {
  return (
    <div className="mb-2 flex items-end justify-between gap-3 px-1">
      <div className="min-w-0">
        <h2 className="section-title">{children}</h2>
        {hint && <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

/* -------------------------------------------------------------- Button */

// solid buttons wear the skin's button outline and shadow (ink and a hard
// shadow they sink into in League; none and a soft one in Classic)
const SOLID = 'press border-(length:--line-w) border-btn-edge'
const VARIANTS = {
  primary: `${SOLID} bg-brand-600 text-white hover:bg-brand-700 disabled:bg-slate-300 dark:disabled:bg-slate-700`,
  secondary: `${SOLID} bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200`,
  outline: `press border-(length:--line-w) border-edge-strong bg-slate-50 text-slate-900 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700`,
  ghost: 'active:scale-[0.97] text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800',
  accent: `${SOLID} bg-accent-500 text-on-accent hover:bg-accent-600`,
  danger: `${SOLID} bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:hover:bg-rose-900`,
  destroy: `${SOLID} bg-rose-600 text-white hover:bg-rose-700`,
}

const SIZES = {
  sm: 'h-10 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-11 px-4 text-sm rounded-xl gap-2',
  lg: 'h-14 px-5 text-base rounded-2xl gap-2',
  icon: 'h-10 w-10 rounded-xl justify-center',
}

export function Button({
  variant = 'outline',
  size = 'md',
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition',
        'focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 focus-visible:outline-none dark:focus-visible:ring-brand-300',
        'dark:focus-visible:ring-offset-slate-950',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ----------------------------------------------------------- Segmented */

export function Segmented({ options, value, onChange, className = '', size = 'md', label }) {
  const at = options.findIndex((o) => o.value === value)
  return (
    <div
      className={cx(
        'relative inline-flex w-full gap-1 rounded-xl border-(length:--line-w) border-edge bg-track p-1',
        className
      )}
      role="radiogroup"
      aria-label={label}
    >
      {/* one pick that slides to the chosen segment (all segments are equal width) */}
      {at >= 0 && (
        <span
          aria-hidden
          className="seg-pick absolute inset-y-1 left-1 rounded-lg bg-pick shadow-[var(--shadow-pick)]"
          style={{
            width: `calc((100% - 0.5rem - ${options.length - 1} * 0.25rem) / ${options.length})`,
            transform: `translateX(calc(${at} * (100% + 0.25rem)))`,
          }}
        />
      )}
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cx(
              'relative min-w-0 flex-1 basis-0 rounded-lg font-medium transition-colors duration-200',
              size === 'sm' ? 'h-10 px-2 text-xs' : 'h-11 px-3 text-sm',
              active
                ? 'text-pick-ink'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------- Toggle */

export function Toggle({ checked, onChange, label, hint, disabled }) {
  return (
    <label
      className={cx(
        'flex cursor-pointer items-start justify-between gap-4 py-2.5',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {hint && (
          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
            {hint}
          </span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-brand-600' : 'bg-slate-400 dark:bg-slate-600'
        )}
      >
        <span
          className={cx(
            'ease-snap absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-slate-50 shadow transition-transform duration-200',
            checked && 'translate-x-5'
          )}
        />
      </button>
    </label>
  )
}

/* -------------------------------------------------------------- Slider */

export function Slider({ label, value, onChange, min = 0, max = 100, step = 5, hint }) {
  return (
    <div className="py-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
          {value}
        </span>
      </div>
      {hint && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={typeof label === 'string' ? label : undefined}
        className="mt-2 h-6 w-full cursor-pointer accent-brand-600"
      />
    </div>
  )
}

/* ---------------------------------------------------------------- Input */

export function Input({ className = '', ...rest }) {
  return (
    <input
      className={cx(
        'h-11 w-full rounded-xl border border-slate-400 bg-slate-50 px-3 text-base',
        'placeholder:text-slate-500 focus:border-brand-700 focus:ring-2 focus:ring-brand-700/40 focus:outline-none',
        'dark:border-slate-600 dark:bg-slate-950 dark:placeholder:text-slate-400 dark:focus:border-brand-300',
        className
      )}
      {...rest}
    />
  )
}

/* ---------------------------------------------------------- Bottom sheet */

export function Sheet({ open, onClose, title, children, footer, above = false }) {
  // stay mounted while the exit plays, showing what was there when it closed
  const [shown, setShown] = useState(open)
  if (open && !shown) setShown(true)
  const closing = shown && !open
  const last = useRef(null)
  if (open) last.current = { title, children, footer }
  const view = last.current || { title, children, footer }

  // unmount even if the exit's animationend never comes (hidden tab, no motion)
  useEffect(() => {
    if (!closing) return
    const id = setTimeout(() => setShown(false), 400)
    return () => clearTimeout(id)
  }, [closing])

  // drag the header down to dismiss: far enough, or a quick flick
  const panel = useRef(null)
  const drag = useRef(null)
  const onDown = (e) => {
    if (drag.current || e.target.closest('button')) return
    drag.current = { y: e.clientY, t: performance.now(), dy: 0 }
    e.currentTarget.setPointerCapture(e.pointerId)
    panel.current.style.transition = 'none'
  }
  const onMove = (e) => {
    const d = drag.current
    if (!d) return
    d.dy = e.clientY - d.y
    // past the top it resists instead of hitting a wall
    const y = d.dy > 0 ? d.dy : -Math.sqrt(-d.dy) * 2
    panel.current.style.transform = `translateY(${y}px)`
  }
  const onUp = () => {
    const d = drag.current
    if (!d) return
    drag.current = null
    const el = panel.current
    const fast = d.dy / (performance.now() - d.t) > 0.11
    el.style.transition = ''
    if (d.dy > 120 || (d.dy > 10 && fast)) {
      el.style.setProperty('--drag', `${Math.max(0, d.dy)}px`)
      el.style.transform = ''
      onClose()
    } else el.style.transform = ''
  }

  const titleId = useId()
  useEffect(() => {
    if (!open) return
    const back = document.activeElement
    panel.current?.focus({ preventScroll: true })
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
      if (back?.isConnected) back.focus({ preventScroll: true })
    }
  }, [open])
  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
    } else if (e.key === 'Tab') {
      // keep Tab inside the sheet
      const f = panel.current.querySelectorAll(
        'button:not([disabled]),input:not([disabled]),select,textarea,a[href],[tabindex]:not([tabindex="-1"])'
      )
      if (!f.length) return
      const first = f[0]
      const last = f[f.length - 1]
      const at = document.activeElement
      if (e.shiftKey && (at === first || at === panel.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && at === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  if (!shown) return null

  return (
    <div
      data-closing={closing || undefined}
      className={cx(
        'sheet fixed inset-0 flex items-end justify-center sm:items-center',
        closing && 'pointer-events-none',
        above ? 'z-[60]' : 'z-50'
      )}
    >
      <div
        className="sheet-backdrop absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onAnimationEnd={(e) => {
          if (e.target !== e.currentTarget) return
          if (closing) setShown(false)
          else e.currentTarget.style.removeProperty('--drag')
        }}
        className={cx(
          'sheet-panel safe-b relative flex outline-none max-h-[85vh] w-full flex-col',
          'rounded-t-3xl border-(length:--line-w) border-edge border-b-0 bg-slate-50 shadow-[var(--shadow-sheet)]',
          'sm:max-w-lg sm:rounded-3xl sm:border-b-(length:--line-w)',
          'dark:bg-slate-900'
        )}
      >
        <div
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className="relative flex touch-none items-center justify-between gap-3 border-b-(length:--line-w) border-edge px-5 pt-5 pb-4 select-none sm:touch-auto sm:pt-4"
        >
          {/* grab handle: the header drags the sheet down on phones */}
          <span
            aria-hidden
            className="absolute top-2 left-1/2 h-1 w-9 -translate-x-1/2 rounded-full bg-slate-300 sm:hidden dark:bg-slate-700"
          />
          <h3 id={titleId} className="text-lg">
            {view.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={document.documentElement.lang === 'en' ? 'Close' : 'ปิด'}
            className="-mr-1.5 grid h-11 w-11 place-items-center rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <svg
              viewBox="0 0 20 20"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {view.children}
        </div>
        {view.footer && (
          <div className="border-t border-slate-200 px-5 py-3 dark:border-slate-800">
            {view.footer}
          </div>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- Confirm */

// One confirm sheet for the whole app, dressed in the skin, instead of the
// browser's own dialog (which names the site, answers OK/Cancel in the phone's
// language and never says what is about to happen). Ask from anywhere; it
// resolves true when the person picks the action.
let showConfirm = null

/** `{ message, confirmLabel, title? }` → Promise<boolean> */
export function askConfirm(opts) {
  return showConfirm ? showConfirm(opts) : Promise.resolve(window.confirm(opts.message))
}

export function ConfirmHost({ t }) {
  const [ask, setAsk] = useState(null)
  useEffect(() => {
    showConfirm = (opts) => new Promise((resolve) => setAsk({ ...opts, resolve }))
    return () => {
      showConfirm = null
    }
  }, [])
  const answer = (ok) => {
    ask?.resolve(ok)
    setAsk(null)
  }
  return (
    <Sheet
      open={!!ask}
      above
      onClose={() => answer(false)}
      title={ask?.title || t('confirmTitle')}
      footer={
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => answer(false)}>{t('cancel')}</Button>
          <Button variant="destroy" onClick={() => answer(true)}>
            {ask?.confirmLabel || t('confirm')}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-slate-700 dark:text-slate-200">{ask?.message}</p>
    </Sheet>
  )
}

/* ---------------------------------------------------------------- Empty */

/**
 * A small court seen from the stands, a shuttle on its way over the net and
 * the screen's own icon in a badge. Drawn in the skin's tokens, so every skin
 * gets its own version; decorative, the title says what the screen needs.
 */
function EmptyArt({ icon }) {
  return (
    <div className="relative mb-4 w-48" aria-hidden>
      <svg viewBox="0 0 200 116" className="w-full">
        <ellipse cx="100" cy="104" rx="88" ry="8" className="fill-slate-200 dark:fill-slate-800" />
        <path
          d="M36 98 L64 46 H136 L164 98 Z"
          className="fill-brand-50 stroke-brand-600 dark:fill-brand-950 dark:stroke-brand-400"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M100 46 V98 M50 72 H150"
          className="stroke-brand-600 dark:stroke-brand-400"
          strokeWidth="1.5"
          opacity="0.55"
        />
        {/* the net stands across the middle of the court, where its sides are x 50 and 150 */}
        <path d="M50 74 V46 M150 74 V46" className="stroke-slate-900 dark:stroke-slate-100" strokeWidth="3" strokeLinecap="round" />
        <path d="M50 49 H150 V62 H50 Z" className="fill-slate-50/70 stroke-slate-900 dark:fill-slate-900/60 dark:stroke-slate-100" strokeWidth="1.5" />
        <path
          d="M44 88 Q96 -6 160 30"
          fill="none"
          className="stroke-accent-500"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="1 8"
        />
        <g transform="translate(164 32) rotate(58)">
          <path d="M-9 -16 H9 L4 3 H-4 Z" className="fill-slate-50 stroke-slate-900 dark:fill-slate-100" strokeWidth="2" strokeLinejoin="round" />
          <path d="M-3 -16 L-1.5 3 M3 -16 L1.5 3" className="stroke-slate-900" strokeWidth="1" />
          <circle cy="8" r="5.5" className="fill-accent-500 stroke-slate-900" strokeWidth="2" />
        </g>
      </svg>
      <span className="absolute right-2 bottom-0 grid h-11 w-11 place-items-center rounded-full border-(length:--line-w) border-btn-edge bg-brand-600 text-white shadow-[var(--shadow-card)]">
        <Icon name={icon} className="h-5 w-5" />
      </span>
    </div>
  )
}

export function Empty({ icon = 'shuttle', title, hint, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <EmptyArt icon={icon} />
      <p className="font-display text-lg text-slate-900 dark:text-slate-50">{title}</p>
      {hint && (
        <p className="mt-1 max-w-xs text-sm text-slate-600 dark:text-slate-400">{hint}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ----------------------------------------------------------------- Chip */

export function Chip({ children, tone = 'slate', className = '' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    brand: 'bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-200',
    sky: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  }
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

/* ---------------------------------------------------------------- Toast */

export function Toast({ message, tone = 'slate', action, onAction }) {
  // the live region stays mounted so screen readers announce each message
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      className="pointer-events-none fixed inset-x-0 bottom-28 z-60 flex justify-center px-4 md:bottom-8"
    >
      {message && (
        <div
          className={cx(
            'animate-pop flex max-w-sm items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium text-white shadow-lg',
            tone === 'error' ? 'bg-rose-700' : 'bg-slate-900 dark:bg-slate-700',
            action && 'pointer-events-auto py-1.5 pr-1.5'
          )}
        >
          <span className="min-w-0 flex-1">{message}</span>
          {action && (
            <button
              onClick={onAction}
              className="h-10 shrink-0 rounded-xl px-3 font-bold text-accent-300 transition hover:bg-white/10 active:scale-95"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
