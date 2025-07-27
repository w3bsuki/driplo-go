// Re-export paraglide functions
export { getLocale as languageTag, setLocale as setLanguageTag } from '$lib/paraglide/runtime.js';
import { deLocalizeHref, localizeHref } from '$lib/paraglide/runtime.js';

export const i18n = {
	defaultLanguageTag: 'en',
	// Expose public functions from runtime
	resolveRoute: localizeHref,
	// Legacy method for compatibility
	route: (path: string) => deLocalizeHref(path)
};