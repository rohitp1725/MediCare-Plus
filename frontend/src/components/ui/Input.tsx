import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  variant?: 'default' | 'auth'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, variant = 'default', className, id, name, ...props }, ref) => {
    const inputId = id ?? name
    const base =
      variant === 'auth'
        ? 'px-4 py-3 text-[15px] rounded-md bg-cream focus:bg-paper focus:ring-4 focus:ring-sage/10'
        : 'px-3.5 py-2.5 text-sm rounded-sm bg-paper'

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-slate">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          name={name}
          className={`w-full outline-none border-[1.5px] transition-colors font-sans text-ink placeholder:text-slate-lighter ${base} ${
            error ? 'border-rose' : 'border-border focus:border-sage'
          } ${className ?? ''}`}
          {...props}
        />
        {error && <span className="text-xs text-rose">{error}</span>}
      </div>
    )
  }
)
Input.displayName = 'Input'
