import { deLocalizeUrl } from '$lib/paraglide/runtime.js'

export const reroute = ({ url }) => {
	return deLocalizeUrl(url).pathname
}