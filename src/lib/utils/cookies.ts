/**
 * Set a cookie with proper attributes for production
 */
export function setCookie(name: string, value: string, maxAge = 31536000) {
	const isProduction = import.meta.env['PROD'];
	// For Vercel apps, we don't set domain attribute as it can cause issues
	// The cookie will work for the exact domain (dripl0.vercel.app)
	const domain = undefined; // Let browser handle domain automatically
	
	const cookieParts = [
		`${name}=${value}`,
		'Path=/',
		`Max-Age=${maxAge}`,
		'SameSite=Lax',
		isProduction ? 'Secure' : '', // Only use Secure in production
		domain ? `Domain=${domain}` : ''
	].filter(Boolean);
	
	document.cookie = cookieParts.join('; ');
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
	if (typeof document === 'undefined') return null;
	
	const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
	return match?.[2] ?? null;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string) {
	setCookie(name, '', -1);
}