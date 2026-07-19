import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Spinner } from './Spinner'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'amber' | 'ghost'
type ButtonSize = 'md' | 'sm' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: ReactNode
  fullWidth?: boolean
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-sage text-white hover:bg-sage-dark',
  secondary: 'bg-paper text-slate border border-border-dark hover:bg-cream',
  danger: 'bg-rose text-white hover:opacity-90',
  amber: 'bg-amber text-white hover:opacity-90',
  ghost: 'bg-transparent text-slate hover:bg-cream',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-[18px] py-[9px] text-[13px]',
  lg: 'px-6 py-3.5 text-[16px] font-semibold',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', isLoading, leftIcon, fullWidth, disabled, className, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center gap-2 rounded-sm font-medium font-sans cursor-pointer transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? 'w-full' : ''} ${className ?? ''}`}
        {...props}
      >
        {isLoading ? <Spinner size={16} /> : leftIcon}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
