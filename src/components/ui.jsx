import { useEffect } from 'react'

export const cx = (...parts) => parts.filter(Boolean).join(' ')

/* ---------------------------------------------------------------- Card */

export function Card({ className = '', children, ...rest }) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-slate-200 bg-slate-50 shadow-sm',
        'dark:border-slate-800 dark:bg-slate-900',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

export function SectionTitle({ children, hint, action }) {
  return (
    <div className="mb-2 flex items-end justify-between gap-3 px-1">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
          {children}
        </h2>
        {hint && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

/* -------------------------------------------------------------- Button */

const VARIANTS = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-700 shadow-sm disabled:bg-slate-300 dark:disabled:bg-slate-700',
  secondary:
    'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-50',
  outline:
    'border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
  ghost: 'text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800',
  accent:
    'bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-600 shadow-sm dark:bg-accent-600 dark:hover:bg-accent-500',
  danger:
    'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-950',
}

const SIZES = {
  sm: 'h-9 px-3 text-sm rounded-lg gap-1.5',
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
        'inline-flex shrink-0 items-center justify-center font-medium transition',
        'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none',
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

export function Segmented({ options, value, onChange, className = '', size = 'md' }) {
  return (
    <div
      className={cx(
        'inline-flex w-full rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800/80',
        className
      )}
      role="tablist"
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cx(
              'flex-1 rounded-lg font-medium transition',
              size === 'sm' ? 'h-8 px-2 text-xs' : 'h-9 px-3 text-sm',
              active
                ? 'bg-slate-50 text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
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
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition',
          checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
        )}
      >
        <span
          className={cx(
            'absolute top-0.5 h-5 w-5 rounded-full bg-slate-50 shadow transition-all',
            checked ? 'left-[22px]' : 'left-0.5'
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
        'h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-base',
        'placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 focus:outline-none',
        'dark:border-slate-700 dark:bg-slate-950 dark:placeholder:text-slate-600',
        className
      )}
      {...rest}
    />
  )
}

/* ---------------------------------------------------------- Bottom sheet */

export function Sheet({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          'animate-sheet safe-b relative flex max-h-[85vh] w-full flex-col',
          'rounded-t-3xl border-t border-slate-200 bg-slate-50 shadow-2xl',
          'sm:max-w-lg sm:rounded-3xl sm:border',
          'dark:border-slate-800 dark:bg-slate-900'
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="close"
            className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
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
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="border-t border-slate-200 px-5 py-3 dark:border-slate-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- Empty */

export function Empty({ emoji = '🏸', title, hint, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 text-4xl">{emoji}</div>
      <p className="font-medium text-slate-700 dark:text-slate-200">{title}</p>
      {hint && (
        <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">{hint}</p>
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
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

/* ---------------------------------------------------------------- Toast */

export function Toast({ message, tone = 'slate' }) {
  if (!message) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-60 flex justify-center px-4 sm:bottom-8">
      <div
        className={cx(
          'animate-pop max-w-sm rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg',
          tone === 'error' ? 'bg-rose-600' : 'bg-slate-900 dark:bg-slate-700'
        )}
      >
        {message}
      </div>
    </div>
  )
}
