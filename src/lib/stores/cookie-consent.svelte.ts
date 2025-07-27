import { browser } from '$app/environment';

export interface CookiePreferences {
	necessary: boolean;
	analytics: boolean;
	marketing: boolean;
	preferences: boolean;
}

export interface CookieConsent {
	consentGiven: boolean;
	consentDate: string | null;
	preferences: CookiePreferences;
}

const COOKIE_CONSENT_KEY = 'driplo-cookie-consent';
const COOKIE_CONSENT_VERSION = '1.0';

class CookieConsentStore {
	private _consent = $state<CookieConsent>({
		consentGiven: false,
		consentDate: null,
		preferences: {
			necessary: true, // Always true
			analytics: false,
			marketing: false,
			preferences: false
		}
	});

	private _showBanner = $state<boolean>(false);
	private _showPreferences = $state<boolean>(false);

	constructor() {
		if (browser) {
			this.loadConsent();
			// Only show banner if no consent has been given
			if (!this._consent.consentGiven) {
				this._showBanner = true;
			}
		}
	}

	get consent() {
		return this._consent;
	}

	get showBanner() {
		return this._showBanner;
	}

	get showPreferences() {
		return this._showPreferences;
	}

	private loadConsent() {
		try {
			const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				// Check version compatibility
				if (parsed.version === COOKIE_CONSENT_VERSION && parsed.consent) {
					this._consent = parsed.consent;
					this._showBanner = false;
					this.applyPreferences();
				}
			}
		} catch (error) {
			console.error('Failed to load cookie consent:', error);
		}
	}

	private saveConsent() {
		if (!browser) return;
		
		try {
			localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
				version: COOKIE_CONSENT_VERSION,
				consent: this._consent
			}));
		} catch (error) {
			console.error('Failed to save cookie consent:', error);
		}
	}

	private applyPreferences() {
		if (!browser) return;

		// Dispatch custom event for other scripts to listen to
		const event = new CustomEvent('cookieConsentChanged', {
			detail: this._consent.preferences
		});
		window.dispatchEvent(event);

		// Make consent available globally
		(window as any).cookieConsent = this._consent;

		// Handle Google Analytics
		if (this._consent.preferences.analytics) {
			// Enable GA if it exists
			if ((window as any).gtag) {
				(window as any).gtag('consent', 'update', {
					analytics_storage: 'granted'
				});
			}
		} else {
			// Disable GA
			if ((window as any).gtag) {
				(window as any).gtag('consent', 'update', {
					analytics_storage: 'denied'
				});
			}
		}

		// Handle marketing cookies
		if (this._consent.preferences.marketing) {
			// Enable marketing cookies
			if ((window as any).gtag) {
				(window as any).gtag('consent', 'update', {
					ad_storage: 'granted',
					ad_user_data: 'granted',
					ad_personalization: 'granted'
				});
			}
		} else {
			// Disable marketing cookies
			if ((window as any).gtag) {
				(window as any).gtag('consent', 'update', {
					ad_storage: 'denied',
					ad_user_data: 'denied',
					ad_personalization: 'denied'
				});
			}
		}
	}

	acceptAll() {
		this._consent = {
			consentGiven: true,
			consentDate: new Date().toISOString(),
			preferences: {
				necessary: true,
				analytics: true,
				marketing: true,
				preferences: true
			}
		};
		this._showBanner = false;
		this._showPreferences = false;
		this.saveConsent();
		this.applyPreferences();
	}

	rejectAll() {
		this._consent = {
			consentGiven: true,
			consentDate: new Date().toISOString(),
			preferences: {
				necessary: true,
				analytics: false,
				marketing: false,
				preferences: false
			}
		};
		this._showBanner = false;
		this._showPreferences = false;
		this.saveConsent();
		this.applyPreferences();
	}

	savePreferences(preferences: Partial<CookiePreferences>) {
		this._consent = {
			consentGiven: true,
			consentDate: new Date().toISOString(),
			preferences: {
				necessary: true, // Always true
				analytics: preferences.analytics ?? this._consent.preferences.analytics,
				marketing: preferences.marketing ?? this._consent.preferences.marketing,
				preferences: preferences.preferences ?? this._consent.preferences.preferences
			}
		};
		this._showBanner = false;
		this._showPreferences = false;
		this.saveConsent();
		this.applyPreferences();
	}

	updatePreference(category: keyof CookiePreferences, value: boolean) {
		if (category === 'necessary') return; // Can't change necessary cookies
		
		this._consent.preferences[category] = value;
	}

	openPreferences() {
		this._showPreferences = true;
	}

	closePreferences() {
		this._showPreferences = false;
	}

	togglePreferences() {
		this._showPreferences = !this._showPreferences;
	}

	reopenBanner() {
		this._showBanner = true;
		this._showPreferences = false;
	}
}

export const cookieConsent = new CookieConsentStore();