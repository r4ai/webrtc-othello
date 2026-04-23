import { clsx } from 'clsx'
import { Switch, type SwitchProps } from 'react-aria-components'

export interface ToggleProps extends Omit<SwitchProps, 'children' | 'className'> {
  className?: string
  label: string
}

export function Toggle({ className, label, ...props }: ToggleProps) {
  return (
    <Switch
      {...props}
      className={clsx(
        'group inline-flex items-center gap-3 rounded-xl border border-white/20 px-3 py-2 text-left text-sm text-white transition hover:bg-white/10',
        className,
      )}
    >
      {({ isSelected }) => (
        <>
          <span
            className={clsx(
              'relative h-6 w-10 rounded-full transition',
              isSelected ? 'bg-emerald-300' : 'bg-white/30',
            )}
          >
            <span
              className={clsx(
                'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-slate-900 transition',
                isSelected ? 'left-5' : 'left-1',
              )}
            />
          </span>
          <span className="font-semibold tracking-wide">{label}</span>
        </>
      )}
    </Switch>
  )
}
