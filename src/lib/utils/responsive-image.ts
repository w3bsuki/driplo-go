/**
 * Client-side utility for handling responsive images
 */

export function getResponsiveImageUrl(
	src: string | Record<string, string>,
	preferredSize: 'thumb' | 'small' | 'medium' | 'large' | 'full' = 'medium'
): string {
	// If src is a string, return it as-is
	if (typeof src === 'string') {
		return src;
	}

	// If src is an object with size variants, return the preferred size or fallback
	if (src[preferredSize]) {
		return src[preferredSize];
	}

	// Fallback order: medium -> small -> large -> thumb -> full -> first available
	const fallbackOrder = ['medium', 'small', 'large', 'thumb', 'full'];
	
	for (const size of fallbackOrder) {
		if (src[size]) {
			return src[size];
		}
	}

	// Return the first available URL if none of the preferred sizes exist
	const firstUrl = Object.values(src).find(url => url);
	return firstUrl || '/images/placeholder.jpg';
}