import { forwardRef, type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, name, children, ...props }, ref) => {
    const selectId = id ?? name
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-[13px] font-medium text-slate">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          name={name}
          className={`w-full outline-none border-[1.5px] transition-colors font-sans text-ink px-3.5 py-2.5 text-sm rounded-sm bg-paper ${
            error ? 'border-rose' : 'border-border focus:border-sage'
          } ${className ?? ''}`}
          {...props}
        >
          {children}
        </select>
        {error && <span className="text-xs text-rose">{error}</span>}
      </div>
    )
  }
)
Select.displayName = 'Select'
