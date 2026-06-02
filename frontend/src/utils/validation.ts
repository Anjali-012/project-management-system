import type { ValidationRules } from '../types'

export const validateField = (label: string, value: string, rules: ValidationRules): string => {
  const trimmed = value.trim()

  if (rules.required && !trimmed) {
    return `${label} is required.`
  }

  if (!trimmed) return ''

  if (rules.min && trimmed.length < rules.min) {
    return `${label} must be at least ${rules.min} characters.`
  }

  if (rules.max && trimmed.length > rules.max) {
    return `${label} must be ${rules.max} characters or less.`
  }

  if (rules.pattern && !rules.pattern.test(trimmed)) {
    return rules.patternMessage || `${label} contains invalid characters.`
  }

  return ''
}