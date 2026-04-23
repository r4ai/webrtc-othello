import { clsx } from 'clsx'
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
} from 'react-aria-components'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

export interface ButtonProps extends Omit<AriaButtonProps, 'className'> {
  className?: string
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-400 text-emerald-950 hover:bg-emerald-300 pressed:bg-emerald-500',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-white pressed:bg-slate-200',
  ghost:
    'border border-white/30 bg-transparent text-white hover:bg-white/10 pressed:bg-white/20',
}

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <AriaButton
      {...props}
      className={clsx(
        'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-bold tracking-wide transition disabled:cursor-not-allowed disabled:opacity-40',
        variantClasses[variant],
        className,
      )}
    />
  )
}
