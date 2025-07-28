import { describe, it, expect } from 'vitest';
import { 
	isValidEmail, 
	isValidUsername, 
	isValidPassword, 
	sanitizeInput,
	validateFileSize,
	validateImageFile 
} from './validation';

describe('isValidEmail', () => {
	it('should validate correct emails', () => {
		expect(isValidEmail('user@example.com')).toBe(true);
		expect(isValidEmail('test.user@domain.co.uk')).toBe(true);
		expect(isValidEmail('user+tag@example.com')).toBe(true);
		expect(isValidEmail('user_123@example-domain.com')).toBe(true);
	});

	it('should reject invalid emails', () => {
		expect(isValidEmail('invalid')).toBe(false);
		expect(isValidEmail('@example.com')).toBe(false);
		expect(isValidEmail('user@')).toBe(false);
		expect(isValidEmail('user @example.com')).toBe(false);
		expect(isValidEmail('')).toBe(false);
	});
});

describe('isValidUsername', () => {
	it('should validate correct usernames', () => {
		expect(isValidUsername('john_doe')).toBe(true);
		expect(isValidUsername('user123')).toBe(true);
		expect(isValidUsername('test_user_123')).toBe(true);
	});

	it('should reject invalid usernames', () => {
		expect(isValidUsername('ab')).toBe(false); // too short
		expect(isValidUsername('a'.repeat(21))).toBe(false); // too long
		expect(isValidUsername('user name')).toBe(false); // contains space
		expect(isValidUsername('user@name')).toBe(false); // contains @
		expect(isValidUsername('123user')).toBe(false); // starts with number
		expect(isValidUsername('')).toBe(false);
	});
});

describe('isValidPassword', () => {
	it('should validate strong passwords', () => {
		expect(isValidPassword('Password123!')).toBe(true);
		expect(isValidPassword('StrongP@ss1')).toBe(true);
		expect(isValidPassword('MyP@ssw0rd')).toBe(true);
	});

	it('should reject weak passwords', () => {
		expect(isValidPassword('short')).toBe(false); // too short
		expect(isValidPassword('password123')).toBe(false); // no uppercase
		expect(isValidPassword('PASSWORD123')).toBe(false); // no lowercase
		expect(isValidPassword('Password')).toBe(false); // no number
		expect(isValidPassword('')).toBe(false);
	});
});

describe('sanitizeInput', () => {
	it('should escape and remove HTML tags', () => {
		// The function escapes first, so <script> becomes &lt;script&gt;
		expect(sanitizeInput('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
		expect(sanitizeInput('Hello <b>World</b>')).toBe('Hello &lt;b&gt;World&lt;/b&gt;');
		expect(sanitizeInput('<p>Test</p>')).toBe('&lt;p&gt;Test&lt;/p&gt;');
	});

	it('should escape special characters', () => {
		expect(sanitizeInput('Test & Co')).toBe('Test &amp; Co');
		expect(sanitizeInput('"Quote"')).toBe('&quot;Quote&quot;');
		expect(sanitizeInput('<Test>')).toBe('&lt;Test&gt;');
	});

	it('should handle normal text', () => {
		expect(sanitizeInput('Normal text')).toBe('Normal text');
		expect(sanitizeInput('123')).toBe('123');
	});

	it('should handle empty input', () => {
		expect(sanitizeInput('')).toBe('');
	});
});

describe('validateFileSize', () => {
	it('should validate file sizes within limits', () => {
		const smallFile = new File(['content'], 'test.txt', { type: 'text/plain' });
		Object.defineProperty(smallFile, 'size', { value: 1024 * 1024 }); // 1MB
		expect(validateFileSize(smallFile, 5)).toBe(true);
	});

	it('should reject files exceeding size limit', () => {
		const largeFile = new File(['content'], 'test.txt', { type: 'text/plain' });
		Object.defineProperty(largeFile, 'size', { value: 10 * 1024 * 1024 }); // 10MB
		expect(validateFileSize(largeFile, 5)).toBe(false);
	});
});

describe('validateImageFile', () => {
	it('should validate image files with correct types', () => {
		const jpegFile = new File([''], 'image.jpg', { type: 'image/jpeg' });
		const pngFile = new File([''], 'image.png', { type: 'image/png' });
		const webpFile = new File([''], 'image.webp', { type: 'image/webp' });

		expect(validateImageFile(jpegFile)).toBe(true);
		expect(validateImageFile(pngFile)).toBe(true);
		expect(validateImageFile(webpFile)).toBe(true);
	});

	it('should reject non-image files', () => {
		const textFile = new File([''], 'file.txt', { type: 'text/plain' });
		const pdfFile = new File([''], 'file.pdf', { type: 'application/pdf' });

		expect(validateImageFile(textFile)).toBe(false);
		expect(validateImageFile(pdfFile)).toBe(false);
	});

	it('should reject oversized images', () => {
		const largeImage = new File([''], 'large.jpg', { type: 'image/jpeg' });
		Object.defineProperty(largeImage, 'size', { value: 20 * 1024 * 1024 }); // 20MB
		expect(validateImageFile(largeImage)).toBe(false);
	});
});