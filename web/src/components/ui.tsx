import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'border-accent bg-accent text-white hover:bg-accent-hover hover:border-accent-hover disabled:hover:bg-accent',
  secondary: 'border-line-strong bg-surface text-ink hover:bg-paper',
  ghost: 'border-transparent bg-transparent text-ink-soft hover:bg-paper hover:text-ink',
  danger: 'border-critical bg-surface text-critical hover:bg-critical-soft',
}

const buttonSizes = {
  sm: 'h-8 px-3',
  md: 'h-10 px-4',
  lg: 'h-11 px-5 text-[0.9375rem]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ComponentProps<'button'> & { variant?: ButtonVariant; size?: keyof typeof buttonSizes }) {
  return (
    <button
      className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    />
  )
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: keyof typeof buttonSizes }) {
  return (
    <Link
      className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cx('rounded-lg border border-line bg-surface', className)} {...props} />
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function Section({
  title,
  description,
  children,
  id,
}: {
  title: string
  description?: string
  children: ReactNode
  id?: string
}) {
  return (
    <section id={id} className="border-t border-line py-14">
      <h2 className="text-xl font-semibold tracking-tight text-ink">{title}</h2>
      {description ? <p className="mt-2 max-w-2xl text-sm text-ink-soft">{description}</p> : null}
      <div className="mt-8">{children}</div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

type BadgeTone = 'neutral' | 'accent' | 'positive' | 'caution' | 'critical'

const badgeTones: Record<BadgeTone, string> = {
  neutral: 'border-line bg-paper text-ink-soft',
  accent: 'border-accent/25 bg-accent-soft text-accent',
  positive: 'border-positive/25 bg-positive-soft text-positive',
  caution: 'border-caution/25 bg-caution-soft text-caution',
  critical: 'border-critical/25 bg-critical-soft text-critical',
}

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: ComponentProps<'span'> & { tone?: BadgeTone }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium',
        badgeTones[tone],
        className,
      )}
      {...props}
    />
  )
}

export function statusTone(status: number): BadgeTone {
  if (status === 0) return 'accent'
  if (status === 1) return 'positive'
  if (status === 2) return 'neutral'
  return 'critical'
}

// ---------------------------------------------------------------------------
// Data display
// ---------------------------------------------------------------------------

export function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: 'positive' | 'default'
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd
        className={cx(
          'tnum mt-1.5 text-xl font-semibold',
          tone === 'positive' ? 'text-positive' : 'text-ink',
        )}
      >
        {value}
      </dd>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  )
}

export function TermRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="tnum text-sm font-medium text-ink">{value}</dd>
    </div>
  )
}

export function Progress({ value, label }: { value: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Funding progress'}
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  )
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const text = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full border border-line bg-paper font-medium text-ink-soft"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {text}
    </span>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  )
}

export function Callout({
  tone = 'neutral',
  title,
  children,
}: {
  tone?: BadgeTone
  title?: string
  children: ReactNode
}) {
  const tones: Record<BadgeTone, string> = {
    neutral: 'border-line bg-paper text-ink-soft',
    accent: 'border-accent/20 bg-accent-soft text-ink-soft',
    positive: 'border-positive/20 bg-positive-soft text-ink-soft',
    caution: 'border-caution/25 bg-caution-soft text-ink-soft',
    critical: 'border-critical/25 bg-critical-soft text-ink-soft',
  }
  return (
    <div className={cx('rounded-md border px-4 py-3 text-sm', tones[tone])}>
      {title ? <p className="mb-1 font-medium text-ink">{title}</p> : null}
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Form controls
// ---------------------------------------------------------------------------

export function Field({
  label,
  hint,
  error,
  suffix,
  children,
  htmlFor,
}: {
  label: string
  hint?: ReactNode
  error?: string
  suffix?: string
  children: ReactNode
  htmlFor?: string
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative mt-1.5">
        {children}
        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted">
            {suffix}
          </span>
        ) : null}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-critical">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  )
}

const controlClass =
  'block w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:bg-paper disabled:text-ink-muted'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cx(controlClass, 'tnum h-10', className)} {...props} />
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cx(controlClass, 'min-h-24 resize-y', className)} {...props} />
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return <select className={cx(controlClass, 'h-10', className)} {...props} />
}
