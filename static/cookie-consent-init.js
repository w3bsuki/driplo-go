// Set default consent state for Google Analytics
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

// Default to denied until user gives consent
gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'functionality_storage': 'denied',
    'personalization_storage': 'denied',
    'security_storage': 'granted'
});

// Check for existing consent
try {
    const consent = localStorage.getItem('driplo-cookie-consent');
    if (consent) {
        const parsed = JSON.parse(consent);
        if (parsed.version === '1.0' && parsed.consent?.consentGiven) {
            const prefs = parsed.consent.preferences;
            gtag('consent', 'update', {
                'analytics_storage': prefs.analytics ? 'granted' : 'denied',
                'ad_storage': prefs.marketing ? 'granted' : 'denied',
                'ad_user_data': prefs.marketing ? 'granted' : 'denied',
                'ad_personalization': prefs.marketing ? 'granted' : 'denied',
                'functionality_storage': prefs.preferences ? 'granted' : 'denied',
                'personalization_storage': prefs.preferences ? 'granted' : 'denied'
            });
        }
    }
} catch (e) {
    // Ignore errors
}