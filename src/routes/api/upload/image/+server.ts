import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { ImageOptimizer } from '$lib/server/image-optimizer'
import { v4 as uuidv4 } from 'uuid'

export const POST: RequestHandler = async ({ request, locals: { supabase, safeGetSession } }) => {
	const { session } = await safeGetSession()
	
	if (!session?.user) {
		throw error(401, 'Unauthorized')
	}

	try {
		const formData = await request.formData()
		const file = formData.get('file') as File
		const type = formData.get('type') as string || 'general' // avatar, cover, listing, general
		
		if (!file) {
			throw error(400, 'No file provided')
		}

		// Validate file type
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
		if (!allowedTypes.includes(file.type)) {
			throw error(400, 'Invalid file type')
		}

		// Validate file size (10MB max for original, will be compressed)
		const maxSize = 10 * 1024 * 1024
		if (file.size > maxSize) {
			throw error(400, 'File too large (max 10MB)')
		}

		// Convert File to Buffer
		const arrayBuffer = await file.arrayBuffer()
		const buffer = Buffer.from(arrayBuffer)

		// Initialize image optimizer
		const optimizer = new ImageOptimizer(supabase)
		
		// Determine bucket based on type
		let bucket: 'avatars' | 'covers' | 'listings' | 'brand-logos' = 'listings'
		switch (type) {
			case 'avatar':
				bucket = 'avatars'
				break
			case 'cover':
				bucket = 'covers'
				break
			case 'listing':
				bucket = 'listings'
				break
			case 'brand-logo':
				bucket = 'brand-logos'
				break
		}

		// Generate unique filename
		const fileName = `${uuidv4()}_${Date.now()}`
		
		// Optimize and upload images
		const result = await optimizer.optimizeAndUpload(
			buffer,
			fileName,
			bucket,
			session.user.id
		)

		// If this is an avatar or cover update, update the user's profile
		if (type === 'avatar' || type === 'cover') {
			const updateField = type === 'avatar' ? 'avatar_url' : 'cover_url'
			const responsiveField = type === 'avatar' ? 'avatar_urls' : 'cover_urls'
			
			// Get current profile to check for old image
			const { data: profile } = await supabase
				.from('profiles')
				.select(`${updateField}, ${responsiveField}`)
				.eq('id', session.user.id)
				.single()
			
			// Delete old images if they exist
			if (profile && profile[updateField]) {
				const oldPath = profile[updateField].split('/').slice(-2).join('/')
				await optimizer.deleteAllVersions(oldPath, bucket)
			}
			
			const { error: profileError } = await supabase
				.from('profiles')
				.update({ 
					[updateField]: result.original.url,
					[responsiveField]: {
						thumb: result.responsive.thumb.url,
						small: result.responsive.small.url,
						medium: result.responsive.medium.url,
						large: result.responsive.large.url
					}
				})
				.eq('id', session.user.id)

			if (profileError) {
				console.error('Profile update error:', profileError)
			}
		}
		
		return json({
			url: result.original.url,
			urls: {
				original: result.original.url,
				thumb: result.responsive.thumb.url,
				small: result.responsive.small.url,
				medium: result.responsive.medium.url,
				large: result.responsive.large.url
			},
			srcSet: result.srcSet,
			type,
			width: result.original.width,
			height: result.original.height
		})
	} catch (err) {
		console.error('Image upload error:', err)
		if (err instanceof Error && 'status' in err) {
			throw err
		}
		throw error(500, 'Internal server error')
	}
}