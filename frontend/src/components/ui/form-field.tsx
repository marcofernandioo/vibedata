import type { InputHTMLAttributes } from 'react'
import type { FieldError } from 'react-hook-form'
import { cn } from '@/lib/utils'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: FieldError
}

export function FormField({ label, error, id, className, ...props }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={cn(
          'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
          error && 'border-destructive',
          className,
        )}
        {...props}
      />
      {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
    </div>
  )
}
