type ValidationRules = {
  min?: number
  max?: number
  pattern?: RegExp
  patternMessage?: string
  required?: boolean
}

const alphaSpacePattern = /^[A-Za-z ]+$/
const alphaNumericTextPattern = /^[A-Za-z0-9][A-Za-z0-9 .,'()/_-]*$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).+$/

export const validateField = (
  label: string,
  value: string,
  rules: ValidationRules,
) => {
  const trimmed = value.trim()

  if (rules.required && !trimmed) return `${label} is required.`
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

export const validateAuth = (
  mode: 'login' | 'register',
  form: { name: string; email: string; password: string },
) => {
  if (mode === 'register') {
    const nameError = validateField('Name', form.name, {
      required: true,
      min: 2,
      max: 50,
      pattern: alphaSpacePattern,
      patternMessage: 'Name can contain alphabets and spaces only.',
    })
    if (nameError) return nameError
  }

  return (
    validateField('Email', form.email, {
      required: true,
      max: 120,
      pattern: emailPattern,
      patternMessage: 'Enter a valid email address.',
    }) ||
    validateField('Password', form.password, {
      required: true,
      min: 6,
      max: 64,
      pattern: passwordPattern,
      patternMessage: 'Password must include at least one letter and one number.',
    })
  )
}

export const validateProject = (form: { title: string; description: string }) =>
  validateField('Project title', form.title, {
    required: true,
    min: 3,
    max: 80,
    pattern: alphaNumericTextPattern,
    patternMessage: 'Project title must start with a letter or number.',
  }) || validateField('Project description', form.description, { max: 300 })

export const validateTask = (form: { title: string; description: string }) =>
  validateField('Task title', form.title, {
    required: true,
    min: 3,
    max: 100,
    pattern: alphaNumericTextPattern,
    patternMessage: 'Task title must start with a letter or number.',
  }) || validateField('Task description', form.description, { max: 500 })

export const validateEmail = (email: string) =>
  validateField('Member email', email, {
    required: true,
    max: 120,
    pattern: emailPattern,
    patternMessage: 'Enter a valid member email address.',
  })
