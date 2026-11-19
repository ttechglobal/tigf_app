'use client'

import { InputHTMLAttributes, forwardRef, useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, type, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId
    const [revealed, setRevealed] = useState(false)
    const isPassword = type === 'password'

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-[var(--foreground)]">{label}</label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={isPassword && revealed ? 'text' : type}
            aria-invalid={error ? true : undefined}
            className={`
              w-full px-4 py-3 rounded-xl border-2 bg-[var(--surface)] text-[var(--foreground)]
              placeholder:text-[var(--muted)] outline-none transition-colors duration-150
              border-[var(--border)] focus:border-tigf-magenta
              ${isPassword ? 'pr-12' : ''}
              ${error ? 'border-red-500' : ''}
              ${className}
            `}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setRevealed(r => !r)}
              aria-label={revealed ? 'Hide password' : 'Show password'}
              aria-pressed={revealed}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-[var(--muted)] hover:text-tigf-magenta"
            >
              {revealed ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
