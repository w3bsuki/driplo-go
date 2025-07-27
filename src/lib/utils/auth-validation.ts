export const passwordRequirements = {
	minLength: 8,
	requireUppercase: true,
	requireLowercase: true,
	requireNumbers: true,
	requireSpecialChars: true
}

export interface PasswordValidationResult {
	valid: boolean
	errors: string[]
	strength: 'weak' | 'medium' | 'strong'
}

export function validatePassword(password: string): PasswordValidationResult {
	const errors: string[] = []
	let strength: 'weak' | 'medium' | 'strong' = 'weak'
	let strengthScore = 0

	if (password.length < passwordRequirements.minLength) {
		errors.push(`Password must be at least ${passwordRequirements.minLength} characters`)
	} else {
		strengthScore++
		if (password.length >= 12) strengthScore++
		if (password.length >= 16) strengthScore++
	}

	if (passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
		errors.push('Password must contain at least one uppercase letter')
	} else if (/[A-Z]/.test(password)) {
		strengthScore++
	}

	if (passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
		errors.push('Password must contain at least one lowercase letter')
	} else if (/[a-z]/.test(password)) {
		strengthScore++
	}

	if (passwordRequirements.requireNumbers && !/\d/.test(password)) {
		errors.push('Password must contain at least one number')
	} else if (/\d/.test(password)) {
		strengthScore++
	}

	if (passwordRequirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
		errors.push('Password must contain at least one special character')
	} else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
		strengthScore++
	}

	// Calculate strength
	if (strengthScore >= 6) strength = 'strong'
	else if (strengthScore >= 4) strength = 'medium'

	return { valid: errors.length === 0, errors, strength }
}

export function getPasswordStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
	switch (strength) {
		case 'weak':
			return 'text-red-500'
		case 'medium':
			return 'text-yellow-500'
		case 'strong':
			return 'text-green-500'
		default:
			return 'text-gray-500'
	}
}

export function getPasswordStrengthText(strength: 'weak' | 'medium' | 'strong'): string {
	switch (strength) {
		case 'weak':
			return 'Weak password'
		case 'medium':
			return 'Medium strength'
		case 'strong':
			return 'Strong password'
		default:
			return ''
	}
}

// Email validation
export function validateEmail(email: string): { valid: boolean; error?: string } {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	
	if (!email) {
		return { valid: false, error: 'Email is required' }
	}
	
	if (!emailRegex.test(email)) {
		return { valid: false, error: 'Please enter a valid email address' }
	}
	
	return { valid: true }
}

// Username validation
export function validateUsername(username: string): { valid: boolean; errors: string[] } {
	const errors: string[] = []
	
	if (username.length < 3) {
		errors.push('Username must be at least 3 characters')
	}
	
	if (username.length > 30) {
		errors.push('Username must be 30 characters or less')
	}
	
	if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
		errors.push('Username can only contain letters, numbers, hyphens, and underscores')
	}
	
	if (/^[_-]|[_-]$/.test(username)) {
		errors.push('Username cannot start or end with hyphens or underscores')
	}
	
	return { valid: errors.length === 0, errors }
}