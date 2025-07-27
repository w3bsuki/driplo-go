import { describe, it, expect } from 'vitest';
import { formatNumber, formatRelativeTime, getInitials } from './format';

describe('formatNumber', () => {
	it('should format numbers with commas', () => {
		expect(formatNumber(1000)).toBe('1,000');
		expect(formatNumber(1000000)).toBe('1,000,000');
		expect(formatNumber(123456789)).toBe('123,456,789');
	});

	it('should handle decimals', () => {
		expect(formatNumber(1234.56)).toBe('1,234.56');
		expect(formatNumber(0.123)).toBe('0.123');
	});

	it('should handle zero and negative numbers', () => {
		expect(formatNumber(0)).toBe('0');
		expect(formatNumber(-1000)).toBe('-1,000');
	});
});

describe('formatRelativeTime', () => {
	const now = new Date();

	it('should format recent times', () => {
		const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
		expect(formatRelativeTime(oneMinuteAgo.toISOString())).toBe('1 minute ago');

		const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
		expect(formatRelativeTime(fiveMinutesAgo.toISOString())).toBe('5 minutes ago');
	});

	it('should format hours', () => {
		const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
		expect(formatRelativeTime(oneHourAgo.toISOString())).toBe('about 1 hour ago');

		const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
		expect(formatRelativeTime(twelveHoursAgo.toISOString())).toBe('about 12 hours ago');
	});

	it('should format days', () => {
		const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
		expect(formatRelativeTime(oneDayAgo.toISOString())).toBe('1 day ago');

		const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
		expect(formatRelativeTime(fiveDaysAgo.toISOString())).toBe('5 days ago');
	});

	it('should format future dates', () => {
		const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
		expect(formatRelativeTime(oneHourFromNow.toISOString())).toBe('in about 1 hour');
	});

	it('should handle invalid dates', () => {
		expect(formatRelativeTime('invalid')).toBe('Invalid date');
		expect(formatRelativeTime('')).toBe('Invalid date');
	});
});

describe('getInitials', () => {
	it('should get initials from names', () => {
		expect(getInitials('John Doe')).toBe('JD');
		expect(getInitials('Jane Smith')).toBe('JS');
		expect(getInitials('Mary Jane Watson')).toBe('MW');
	});

	it('should handle single names', () => {
		expect(getInitials('John')).toBe('J');
		expect(getInitials('X')).toBe('X');
	});

	it('should handle empty or invalid input', () => {
		expect(getInitials('')).toBe('');
		expect(getInitials('   ')).toBe('');
	});

	it('should handle special characters', () => {
		expect(getInitials('John-Paul Smith')).toBe('JS');
		expect(getInitials('O\'Brien')).toBe('O');
	});
});