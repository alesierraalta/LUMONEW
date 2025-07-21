'use client'

import * as React from 'react'
import { useState, useCallback, forwardRef } from 'react'
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FloatingInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string
  error?: string
  success?: string
  helperText?: string
  onChange?: (value: string) => void
  onValidation?: (isValid: boolean) => void
  validation?: {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    custom?: (value: string) => string | null
  }
  showValidation?: boolean
}

export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({
    label,
    error,
    success,
    helperText,
    onChange,
    onValidation,
    validation,
    showValidation = true,
    type = 'text',
    className,
    disabled,
    value: controlledValue,
    ...props
  }, ref) => {
    const [value, setValue] = useState(controlledValue || '')
    const [isFocused, setIsFocused] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [validationError, setValidationError] = useState<string | null>(null)
    const [isValid, setIsValid] = useState(false)

    const currentValue = controlledValue !== undefined ? controlledValue : value

    const validateValue = useCallback((val: string) => {
      if (!validation) return null

      if (validation.required && !val.trim()) {
        return 'Este campo es requerido'
      }

      if (val && validation.minLength && val.length < validation.minLength) {
        return `Mínimo ${validation.minLength} caracteres`
      }

      if (val && validation.maxLength && val.length > validation.maxLength) {
        return `Máximo ${validation.maxLength} caracteres`
      }

      if (val && validation.pattern && !validation.pattern.test(val)) {
        return 'Formato inválido'
      }

      if (val && validation.custom) {
        return validation.custom(val)
      }

      return null
    }, [validation])

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      
      if (controlledValue === undefined) {
        setValue(newValue)
      }
      
      onChange?.(newValue)

      // Real-time validation
      if (showValidation) {
        const error = validateValue(newValue)
        setValidationError(error)
        const valid = !error
        setIsValid(valid)
        onValidation?.(valid)
      }
    }, [controlledValue, onChange, validateValue, showValidation, onValidation])

    const handleFocus = useCallback(() => {
      setIsFocused(true)
    }, [])

    const handleBlur = useCallback(() => {
      setIsFocused(false)
      
      // Validate on blur if not already validating in real-time
      if (!showValidation && validation) {
        const error = validateValue(currentValue as string)
        setValidationError(error)
        const valid = !error
        setIsValid(valid)
        onValidation?.(valid)
      }
    }, [showValidation, validation, validateValue, currentValue, onValidation])

    const togglePasswordVisibility = useCallback(() => {
      setShowPassword(prev => !prev)
    }, [])

    const hasValue = Boolean(currentValue)
    const isFloating = isFocused || hasValue
    const displayError = error || validationError
    const displaySuccess = success || (showValidation && isValid && hasValue && !displayError)

    const inputType = type === 'password' && showPassword ? 'text' : type

    return (
      <div className={cn('relative', className)}>
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            value={currentValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            className={cn(
              'peer w-full px-4 pt-6 pb-2 text-sm bg-white border rounded-lg transition-all duration-200 outline-none',
              'placeholder-transparent',
              'focus:ring-2 focus:ring-offset-0',
              displayError
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : displaySuccess
                ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200',
              disabled && 'bg-gray-50 cursor-not-allowed opacity-60'
            )}
            {...props}
          />
          
          <label
            className={cn(
              'absolute left-4 transition-all duration-200 pointer-events-none',
              'text-gray-500 peer-placeholder-shown:text-gray-400',
              isFloating
                ? 'top-2 text-xs font-medium'
                : 'top-1/2 -translate-y-1/2 text-sm',
              displayError && isFloating && 'text-red-600',
              displaySuccess && isFloating && 'text-green-600',
              disabled && 'text-gray-400'
            )}
          >
            {label}
          </label>

          {type === 'password' && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={disabled}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}

          {showValidation && hasValue && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {displayError ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : displaySuccess ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : null}
            </div>
          )}
        </div>

        {(displayError || displaySuccess || helperText) && (
          <div className="mt-1 min-h-[1.25rem]">
            {displayError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                {displayError}
              </p>
            )}
            {!displayError && displaySuccess && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3 flex-shrink-0" />
                {displaySuccess}
              </p>
            )}
            {!displayError && !displaySuccess && helperText && (
              <p className="text-xs text-gray-500">{helperText}</p>
            )}
          </div>
        )}
      </div>
    )
  }
)

FloatingInput.displayName = 'FloatingInput'

// Floating Textarea Component
interface FloatingTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label: string
  error?: string
  success?: string
  helperText?: string
  onChange?: (value: string) => void
  onValidation?: (isValid: boolean) => void
  validation?: {
    required?: boolean
    minLength?: number
    maxLength?: number
    custom?: (value: string) => string | null
  }
  showValidation?: boolean
  rows?: number
}

export const FloatingTextarea = forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
  ({
    label,
    error,
    success,
    helperText,
    onChange,
    onValidation,
    validation,
    showValidation = true,
    rows = 4,
    className,
    disabled,
    value: controlledValue,
    ...props
  }, ref) => {
    const [value, setValue] = useState(controlledValue || '')
    const [isFocused, setIsFocused] = useState(false)
    const [validationError, setValidationError] = useState<string | null>(null)
    const [isValid, setIsValid] = useState(false)

    const currentValue = controlledValue !== undefined ? controlledValue : value

    const validateValue = useCallback((val: string) => {
      if (!validation) return null

      if (validation.required && !val.trim()) {
        return 'Este campo es requerido'
      }

      if (val && validation.minLength && val.length < validation.minLength) {
        return `Mínimo ${validation.minLength} caracteres`
      }

      if (val && validation.maxLength && val.length > validation.maxLength) {
        return `Máximo ${validation.maxLength} caracteres`
      }

      if (val && validation.custom) {
        return validation.custom(val)
      }

      return null
    }, [validation])

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      
      if (controlledValue === undefined) {
        setValue(newValue)
      }
      
      onChange?.(newValue)

      if (showValidation) {
        const error = validateValue(newValue)
        setValidationError(error)
        const valid = !error
        setIsValid(valid)
        onValidation?.(valid)
      }
    }, [controlledValue, onChange, validateValue, showValidation, onValidation])

    const handleFocus = useCallback(() => {
      setIsFocused(true)
    }, [])

    const handleBlur = useCallback(() => {
      setIsFocused(false)
      
      if (!showValidation && validation) {
        const error = validateValue(currentValue as string)
        setValidationError(error)
        const valid = !error
        setIsValid(valid)
        onValidation?.(valid)
      }
    }, [showValidation, validation, validateValue, currentValue, onValidation])

    const hasValue = Boolean(currentValue)
    const isFloating = isFocused || hasValue
    const displayError = error || validationError
    const displaySuccess = success || (showValidation && isValid && hasValue && !displayError)

    return (
      <div className={cn('relative', className)}>
        <div className="relative">
          <textarea
            ref={ref}
            rows={rows}
            value={currentValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            className={cn(
              'peer w-full px-4 pt-6 pb-2 text-sm bg-white border rounded-lg transition-all duration-200 outline-none resize-none',
              'placeholder-transparent',
              'focus:ring-2 focus:ring-offset-0',
              displayError
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : displaySuccess
                ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200',
              disabled && 'bg-gray-50 cursor-not-allowed opacity-60'
            )}
            {...props}
          />
          
          <label
            className={cn(
              'absolute left-4 transition-all duration-200 pointer-events-none',
              'text-gray-500 peer-placeholder-shown:text-gray-400',
              isFloating
                ? 'top-2 text-xs font-medium'
                : 'top-6 text-sm',
              displayError && isFloating && 'text-red-600',
              displaySuccess && isFloating && 'text-green-600',
              disabled && 'text-gray-400'
            )}
          >
            {label}
          </label>

          {showValidation && hasValue && (
            <div className="absolute right-3 top-3">
              {displayError ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : displaySuccess ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : null}
            </div>
          )}
        </div>

        {(displayError || displaySuccess || helperText) && (
          <div className="mt-1 min-h-[1.25rem]">
            {displayError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                {displayError}
              </p>
            )}
            {!displayError && displaySuccess && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3 flex-shrink-0" />
                {displaySuccess}
              </p>
            )}
            {!displayError && !displaySuccess && helperText && (
              <p className="text-xs text-gray-500">{helperText}</p>
            )}
          </div>
        )}
      </div>
    )
  }
)

FloatingTextarea.displayName = 'FloatingTextarea'