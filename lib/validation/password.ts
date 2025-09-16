/**
 * Standardized password validation utility
 * Ensures consistent password requirements across the application
 */

export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  allowedSpecialChars: '@$!%*?&',
  forbiddenPatterns: [
    /password/i,
    /123456/i,
    /qwerty/i,
    /admin/i,
    /user/i
  ]
} as const

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong' | 'very-strong'
  score: number
}

/**
 * Validate password against security requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []
  let score = 0
  
  // Length validation
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`)
  } else {
    score += 1
  }
  
  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`)
  }
  
  // Character type validation
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  } else if (/[A-Z]/.test(password)) {
    score += 1
  }
  
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  } else if (/[a-z]/.test(password)) {
    score += 1
  }
  
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  } else if (/\d/.test(password)) {
    score += 1
  }
  
  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[@$!%*?&]/.test(password)) {
    errors.push(`Password must contain at least one special character (${PASSWORD_REQUIREMENTS.allowedSpecialChars})`)
  } else if (/[@$!%*?&]/.test(password)) {
    score += 1
  }
  
  // Forbidden patterns check
  for (const pattern of PASSWORD_REQUIREMENTS.forbiddenPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains forbidden patterns')
      break
    }
  }
  
  // Additional security checks
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1
  if (/[^a-zA-Z0-9@$!%*?&]/.test(password)) {
    errors.push(`Password contains invalid characters. Only letters, numbers, and ${PASSWORD_REQUIREMENTS.allowedSpecialChars} are allowed`)
  }
  
  // Determine strength based on score
  let strength: 'weak' | 'medium' | 'strong' | 'very-strong'
  if (score <= 2) strength = 'weak'
  else if (score <= 4) strength = 'medium'
  else if (score <= 6) strength = 'strong'
  else strength = 'very-strong'
  
  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score
  }
}

/**
 * Get password strength requirements as a user-friendly message
 */
export function getPasswordRequirementsMessage(): string {
  return `Password must be ${PASSWORD_REQUIREMENTS.minLength}-${PASSWORD_REQUIREMENTS.maxLength} characters long and contain:
- At least one uppercase letter
- At least one lowercase letter  
- At least one number
- At least one special character (${PASSWORD_REQUIREMENTS.allowedSpecialChars})
- No common words or patterns`
}

/**
 * Check if password meets minimum requirements for user creation
 */
export function isPasswordValidForUserCreation(password: string): boolean {
  const result = validatePassword(password)
  return result.isValid && result.strength !== 'weak'
}

/**
 * Get password strength indicator color
 */
export function getPasswordStrengthColor(strength: string): string {
  switch (strength) {
    case 'weak': return 'text-red-500'
    case 'medium': return 'text-yellow-500'
    case 'strong': return 'text-blue-500'
    case 'very-strong': return 'text-green-500'
    default: return 'text-gray-500'
  }
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = PASSWORD_REQUIREMENTS.allowedSpecialChars
  
  const allChars = uppercase + lowercase + numbers + special
  
  let password = ''
  
  // Ensure at least one character from each required type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]
  
  // Fill the rest with random characters
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}