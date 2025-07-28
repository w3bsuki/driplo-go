import { formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Formats a number with commas
 */
export function formatNumber(num: number): string {
	return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Formats a date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
	try {
		const dateObj = typeof date === 'string' ? parseISO(date) : date;
		return formatDistanceToNow(dateObj, { addSuffix: true });
	} catch (error) {
		console.error('Invalid date:', date);
		return 'Invalid date';
	}
}

/**
 * Gets initials from a name
 */
export function getInitials(name: string): string {
	if (!name || !name.trim()) return '';
	
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) {
		return parts[0][0]?.toUpperCase() || '';
	}
	
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Truncates text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.slice(0, maxLength - 3) + '...';
}

/**
 * Formats file size in human readable format
 */
export function formatFileSize(bytes: number): string {
	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	let size = bytes;
	let unitIndex = 0;
	
	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024;
		unitIndex++;
	}
	
	return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Formats percentage
 */
export function formatPercentage(value: number, decimals = 0): string {
	return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Capitalizes first letter of each word
 */
export function titleCase(str: string): string {
	return str.replace(/\w\S*/g, (txt) => {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
}

/**
 * Formats phone number
 */
export function formatPhoneNumber(phone: string): string {
	const cleaned = phone.replace(/\D/g, '');
	
	if (cleaned.length === 10) {
		return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
	} else if (cleaned.length === 11 && cleaned[0] === '1') {
		return cleaned.replace(/1(\d{3})(\d{3})(\d{4})/, '+1 ($1) $2-$3');
	}
	
	return phone;
}

/**
 * Pluralizes a word based on count
 */
export function pluralize(count: number, singular: string, plural?: string): string {
	if (count === 1) return `${count} ${singular}`;
	return `${count} ${plural || singular + 's'}`;
}

/**
 * Formats duration in seconds to human readable format
 */
export function formatDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;
	
	const parts = [];
	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0) parts.push(`${minutes}m`);
	if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
	
	return parts.join(' ');
}

/**
 * Formats date to local date string
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
	const dateObj = typeof date === 'string' ? new Date(date) : date;
	
	const defaultOptions: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		...options
	};
	
	return dateObj.toLocaleDateString('en-US', defaultOptions);
}

/**
 * Formats a username/handle (removes special chars, lowercases)
 */
export function formatUsername(username: string): string {
	return username
		.toLowerCase()
		.replace(/[^a-z0-9_]/g, '')
		.slice(0, 20);
}