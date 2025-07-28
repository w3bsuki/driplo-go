// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Username validation regex (alphanumeric, underscore, 3-20 chars)
const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;

// Password validation regex (min 8 chars, uppercase, lowercase, number)
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
	return EMAIL_REGEX.test(email);
}

/**
 * Validates username format
 */
export function isValidUsername(username: string): boolean {
	return USERNAME_REGEX.test(username);
}

/**
 * Validates password strength
 */
export function isValidPassword(password: string): boolean {
	return PASSWORD_REGEX.test(password);
}

/**
 * Sanitizes input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
	// First escape special characters, then remove script tags
	let sanitized = input
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#x27;');
	
	// Then remove script and other dangerous tags
	sanitized = sanitized
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
		.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
	
	// Finally remove any remaining HTML tags
	sanitized = sanitized.replace(/<[^>]+>/g, '');
	
	return sanitized;
}

/**
 * Validates file size in MB
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
	const maxSizeBytes = maxSizeMB * 1024 * 1024;
	return file.size <= maxSizeBytes;
}

/**
 * Validates image file type and size
 */
export function validateImageFile(file: File, maxSizeMB = 10): boolean {
	const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
	
	if (!validTypes.includes(file.type)) {
		return false;
	}
	
	return validateFileSize(file, maxSizeMB);
}

/**
 * Validates phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
	// Basic international phone validation
	const cleaned = phone.replace(/\D/g, '');
	return cleaned.length >= 10 && cleaned.length <= 15;
}

/**
 * Validates URL format
 */
export function isValidURL(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

/**
 * Validates credit card number using Luhn algorithm
 */
export function isValidCreditCard(cardNumber: string): boolean {
	const cleaned = cardNumber.replace(/\D/g, '');
	
	if (cleaned.length < 13 || cleaned.length > 19) {
		return false;
	}
	
	let sum = 0;
	let isEven = false;
	
	for (let i = cleaned.length - 1; i >= 0; i--) {
		let digit = parseInt(cleaned[i]);
		
		if (isEven) {
			digit *= 2;
			if (digit > 9) {
				digit -= 9;
			}
		}
		
		sum += digit;
		isEven = !isEven;
	}
	
	return sum % 10 === 0;
}

/**
 * Validates date is not in the past
 */
export function isFutureDate(date: Date | string): boolean {
	const inputDate = typeof date === 'string' ? new Date(date) : date;
	const now = new Date();
	now.setHours(0, 0, 0, 0);
	inputDate.setHours(0, 0, 0, 0);
	return inputDate > now;
}

/**
 * Validates age is within range
 */
export function isValidAge(birthDate: Date | string, minAge = 18, maxAge = 120): boolean {
	const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
	const today = new Date();
	
	let age = today.getFullYear() - birth.getFullYear();
	const monthDiff = today.getMonth() - birth.getMonth();
	
	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
		age--;
	}
	
	return age >= minAge && age <= maxAge;
}