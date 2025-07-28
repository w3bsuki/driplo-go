import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url, locals: { supabase, safeGetSession } }) => {
	const code = url.searchParams.get('code')
	const next = url.searchParams.get('next') ?? '/'
	const error = url.searchParams.get('error')
	const errorDescription = url.searchParams.get('error_description')

	// Handle OAuth errors
	if (error) {
		console.error('OAuth error:', error, errorDescription)
		redirect(303, `/login?error=${error}&message=${encodeURIComponent(errorDescription || 'Authentication failed')}`)
	}

	if (code) {
		try {
			// Exchange the code for a session
			const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
			
			if (exchangeError) {
				console.error('Code exchange error:', exchangeError)
				redirect(303, '/login?error=auth_callback_error&message=' + encodeURIComponent(exchangeError.message))
			}

			// Verify the session was created successfully
			const { session, user } = await safeGetSession()
			
			if (!session || !user) {
				console.error('No session after code exchange')
				redirect(303, '/login?error=session_creation_failed')
			}

			// Log successful authentication
			await supabase.rpc('log_auth_event', {
				p_user_id: user.id,
				p_action: 'oauth_login',
				p_success: true
			}).catch(console.error)

			// Successfully authenticated, redirect to next page
			redirect(303, `/${next.slice(1)}`)
		} catch (err) {
			console.error('Callback error:', err)
			redirect(303, '/login?error=auth_callback_error')
		}
	}

	// No code parameter, redirect to login
	redirect(303, '/login?error=missing_code')
}