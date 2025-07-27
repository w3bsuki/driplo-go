export function formatCurrency(amount: number, locale: string): string {
	const currency = locale === 'bg' ? 'BGN' : 'USD';
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency
	}).format(amount);
}

export function getCurrencySymbol(locale: string): string {
	return locale === 'bg' ? 'лв.' : '$';
}

export function getCurrencyCode(locale: string): string {
	return locale === 'bg' ? 'BGN' : 'USD';
}