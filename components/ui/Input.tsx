import { InputHTMLAttributes, forwardRef, useId } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-[var(--foreground)]">{label}</label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={`
            w-full px-4 py-3 rounded-xl border-2 bg-[var(--surface)] text-[var(--foreground)]
            placeholder:text-[var(--muted)] outline-none transition-colors duration-150
            border-[var(--border)] focus:border-tigf-magenta
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
