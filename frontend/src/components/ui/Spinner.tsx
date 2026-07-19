interface SpinnerProps {
  size?: number
  className?: string
}

export function Spinner({ size = 18, className }: SpinnerProps) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full border-2 border-current/25 border-t-current animate-spin ${className ?? ''}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  )
}
