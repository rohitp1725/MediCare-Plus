import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  variant?: 'default' | 'auth'
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, variant = 'default', className, id, name, ...props }, ref) => {
    const [visible, setVisible] = useState(false)
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
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            name={name}
            type={visible ? 'text' : 'password'}
            className={`w-full outline-none border-[1.5px] transition-colors font-sans text-ink pr-11 placeholder:text-slate-lighter ${base} ${
              error ? 'border-rose' : 'border-border focus:border-sage'
            } ${className ?? ''}`}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-light hover:text-slate opacity-70 hover:opacity-100 transition-opacity"
            aria-label={visible ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {error && <span className="text-xs text-rose">{error}</span>}
      </div>
    )
  }
)
PasswordInput.displayName = 'PasswordInput'
