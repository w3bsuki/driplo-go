import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { v4 as uuidv4 } from 'uuid'
import { rateLimiters } from '$lib/server/rate-limit'

export const POST: RequestHandler = async (event) => {
	const { request, locals: { supabase, safeGetSession } } = event
	
	// Apply rate limiting
	const rateLimitResponse = await rateLimiters.upload(event)
	if (rateLimitResponse) {
		return rateLimitResponse
	}
	
	const { session } = await safeGetSession()
	
	console.log('Upload endpoint - Session:', session ? 'exists' : 'missing')
	console.log('Upload endpoint - User ID:', session?.user?.id)
	
	if (!session?.user) {
		console.error('Upload authentication failed - no session')
		throw error(401, 'Unauthorized - Please log in again')
	}

	try {
		const formData = await request.formData()
		const file = formData.get('file') as File
		const bucket = formData.get('bucket') as string || 'listings'
		
		if (!file) {
			throw error(400, 'No file provided')
		}

		// Validate file type (including HEIC for iOS)
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
		// iOS might send HEIC files as application/octet-stream or with no type
		const fileExt = file.name.split('.').pop()?.toLowerCase()
		const isHEIC = fileExt === 'heic' || fileExt === 'heif'
		
		if (!allowedTypes.includes(file.type) && !isHEIC) {
			console.log(`Invalid file type: ${file.type} for file: ${file.name}`)
			throw error(400, `Invalid file type: ${file.type || 'unknown'}`)
		}

		// Validate file size (10MB max)
		const maxSize = 10 * 1024 * 1024
		if (file.size > maxSize) {
			console.log(`File too large: ${file.name} is ${(file.size / 1024 / 1024).toFixed(2)}MB`)
			throw error(400, `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max 10MB)`)
		}

		// Generate unique filename (convert HEIC to JPG extension for consistency)
		let fileExtension = file.name.split('.').pop()?.toLowerCase()
		if (fileExtension === 'heic' || fileExtension === 'heif') {
			fileExtension = 'jpg' // Will be converted to JPEG by client
		}
		const fileName = `${session.user.id}/${uuidv4()}.${fileExtension}`

		// Convert File to ArrayBuffer for Supabase
		const arrayBuffer = await file.arrayBuffer()
		const buffer = new Uint8Array(arrayBuffer)

		// Upload to Supabase Storage with retry
		let uploadError = null
		let data = null
		
		for (let attempt = 1; attempt <= 3; attempt++) {
			try {
				console.log(`Upload attempt ${attempt} for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
				
				// Set proper content type (HEIC files should be uploaded as JPEG after client conversion)
				let contentType = file.type
				if (!contentType || contentType === 'application/octet-stream' || isHEIC) {
					contentType = 'image/jpeg'
				}
				
				const result = await supabase.storage
					.from(bucket)
					.upload(fileName, buffer, {
						contentType,
						upsert: false
					})
				
				if (result.error) {
					uploadError = result.error
					console.error(`Upload attempt ${attempt} failed:`, result.error)
					if (attempt < 3) {
						// Wait before retry
						await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
					}
				} else {
					data = result.data
					uploadError = null
					break
				}
			} catch (err) {
				uploadError = err
				console.error(`Upload attempt ${attempt} error:`, err)
				if (attempt < 3) {
					await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
				}
			}
		}

		if (uploadError) {
			console.error('All upload attempts failed:', uploadError)
			throw error(500, uploadError.message || 'Upload failed after 3 attempts')
		}

		// Get public URL
		const { data: { publicUrl } } = supabase.storage
			.from(bucket)
			.getPublicUrl(fileName)

		return json({
			url: publicUrl,
			path: fileName,
			bucket
		})
	} catch (err: any) {
		console.error('Upload error:', err)
		if (err.status) {
			throw err
		}
		throw error(500, err.message || 'Internal server error')
	}
}