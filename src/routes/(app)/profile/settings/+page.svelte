<script lang="ts">
	import { goto } from '$app/navigation'
	import { getAuthContext } from '$lib/stores/auth-context.svelte'
	import { onMount } from 'svelte'
	import ImageUpload from '$lib/components/upload/ImageUpload.svelte'
	import { Save, ArrowLeft, User, Image as ImageIcon, MapPin, Globe, FileText, Loader2, Camera, Instagram, Music2, Facebook, Twitter, Youtube, Link } from 'lucide-svelte'
	import { toast } from 'svelte-sonner'
	import type { PageData } from './$types'
	import * as m from '$lib/paraglide/messages.js'

	// Get page data from server
	let { data }: { data: PageData } = $props()
	
	// Get auth context
	const auth = getAuthContext()
	
	// Get supabase client from page data
	const supabase = $derived(data.supabase)

	let profile = $state(data.profile)
	let saving = $state(false)
	let uploadingAvatar = $state(false)
	let uploadingCover = $state(false)

	// Form fields initialized from server data
	let fullName = $state(data.profile.full_name || '')
	let username = $state(data.profile.username || '')
	let bio = $state(data.profile.bio || '')
	let location = $state(data.profile.location || '')
	let website = $state(data.profile.website || '')
	
	// Social media fields
	let socialMedia = $state({
		instagram: '',
		tiktok: '',
		facebook: '',
		twitter: '',
		youtube: '',
		pinterest: ''
	})
	
	// Load existing social media accounts on mount
	onMount(async () => {
		if (auth.user?.id) {
			try {
				const { data: socialAccounts } = await supabase
					.from('social_media_accounts')
					.select('*')
					.eq('user_id', auth.user.id)
				
				if (socialAccounts) {
					socialAccounts.forEach(account => {
						if (account.platform in socialMedia) {
							socialMedia[account.platform as keyof typeof socialMedia] = account.username || ''
						}
					})
				}
			} catch (error) {
				console.error('Error loading social media accounts:', error)
			}
		}
	})

	async function handleAvatarUpload(event: CustomEvent<{ file: File; preview: string }>) {
		uploadingAvatar = true

		try {
			const formData = new FormData()
			formData.append('file', event.detail.file)
			formData.append('type', 'avatar')

			const response = await fetch('/api/upload/image', {
				method: 'POST',
				body: formData
			})

			if (!response.ok) {
				throw new Error('Upload failed')
			}

			const result = await response.json()
			profile.avatar_url = result.url
			toast.success(m.settings_avatar_updated())
		} catch (error) {
			console.error('Avatar upload error:', error)
			toast.error(m.settings_avatar_error())
		} finally {
			uploadingAvatar = false
		}
	}

	async function handleCoverUpload(event: CustomEvent<{ file: File; preview: string }>) {
		uploadingCover = true

		try {
			const formData = new FormData()
			formData.append('file', event.detail.file)
			formData.append('type', 'cover')

			const response = await fetch('/api/upload/image', {
				method: 'POST',
				body: formData
			})

			if (!response.ok) {
				throw new Error('Upload failed')
			}

			const result = await response.json()
			profile.cover_url = result.url
			toast.success(m.settings_cover_updated())
		} catch (error) {
			console.error('Cover upload error:', error)
			toast.error(m.settings_cover_error())
		} finally {
			uploadingCover = false
		}
	}

	async function saveProfile() {
		if (!username.trim()) {
			toast.error(m.settings_username_required())
			return
		}

		saving = true

		try {
			// Update profile
			const { error: profileError } = await supabase
				.from('profiles')
				.update({
					full_name: fullName.trim() || null,
					username: username.trim(),
					bio: bio.trim() || null,
					location: location.trim() || null,
					website: website.trim() || null,
					updated_at: new Date().toISOString()
				})
				.eq('id', auth.user?.id)

			if (profileError) throw profileError

			// Update social media accounts
			for (const [platform, username] of Object.entries(socialMedia)) {
				if (username.trim()) {
					// First check if account exists
					const { data: existing } = await supabase
						.from('social_media_accounts')
						.select('id')
						.eq('user_id', auth.user?.id)
						.eq('platform', platform)
						.single()

					if (existing) {
						// Update existing
						await supabase
							.from('social_media_accounts')
							.update({
								username: username.trim(),
								url: getSocialMediaUrl(platform, username.trim()),
								updated_at: new Date().toISOString()
							})
							.eq('id', existing.id)
					} else {
						// Insert new
						await supabase
							.from('social_media_accounts')
							.insert({
								user_id: auth.user?.id,
								platform,
								username: username.trim(),
								url: getSocialMediaUrl(platform, username.trim())
							})
					}
				} else {
					// Delete if empty
					await supabase
						.from('social_media_accounts')
						.delete()
						.eq('user_id', auth.user?.id)
						.eq('platform', platform)
				}
			}

			toast.success(m.settings_profile_updated())
			goto(`/profile/${username}`)
		} catch (error: any) {
			console.error('Save profile error:', error)
			if (error.code === '23505') {
				toast.error(m.settings_username_taken())
			} else {
				toast.error(m.settings_save_error())
			}
		} finally {
			saving = false
		}
	}

	function getSocialMediaUrl(platform: string, username: string): string {
		const cleanUsername = username.replace('@', '')
		switch (platform) {
			case 'instagram':
				return `https://instagram.com/${cleanUsername}`
			case 'tiktok':
				return `https://tiktok.com/@${cleanUsername}`
			case 'facebook':
				return `https://facebook.com/${cleanUsername}`
			case 'twitter':
				return `https://twitter.com/${cleanUsername}`
			case 'youtube':
				return `https://youtube.com/@${cleanUsername}`
			case 'pinterest':
				return `https://pinterest.com/${cleanUsername}`
			default:
				return ''
		}
	}

	function goBack() {
		if (profile.username) {
			goto(`/profile/${profile.username}`)
		} else {
			goto('/')
		}
	}
</script>

<svelte:head>
	<title>{m.settings_page_title()}</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
	<!-- Modern Header -->
	<div class="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
		<div class="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center">
			<button
				onclick={handleGoBack}
				class="p-2 -ml-2 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
			>
				<ArrowLeft class="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
			</button>
			<h1 class="ml-3 text-lg font-semibold text-gray-900">{m.settings_header_title()}</h1>
		</div>
	</div>

	<div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
		<!-- Modern Cover & Profile Section -->
		<div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
			<!-- Cover Image -->
			<div class="relative">
				<div class="h-32 sm:h-48 bg-gradient-to-br from-primary/20 to-primary/10 overflow-hidden">
					{#if profile.cover_url}
						<img src={profile.cover_url} alt="Cover" class="w-full h-full object-cover" />
					{/if}
				</div>
				<div class="absolute inset-0 flex items-center justify-center">
					<div class="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg">
						<ImageIcon class="w-6 h-6 text-gray-700 mb-2" />
						<p class="text-sm font-medium text-gray-700 mb-3">{m.settings_cover_image()}</p>
						<ImageUpload
							currentImage={profile.cover_url}
							placeholder={m.settings_cover_image()}
							aspectRatio="cover"
							disabled={uploadingCover}
							onupload={handleCoverUpload}
							class="!w-32 !h-20"
						/>
					</div>
				</div>
			</div>

			<!-- Profile Photo -->
			<div class="px-6 pb-6">
				<div class="flex items-end gap-6 -mt-16 sm:-mt-20">
					<div class="relative">
						<div class="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
							{#if profile.avatar_url}
								<img src={profile.avatar_url} alt="Profile" class="w-full h-full object-cover" />
							{/if}
						</div>
						<div class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-2xl">
							<div class="text-center">
								<Camera class="w-8 h-8 text-white mx-auto mb-2" />
								<p class="text-xs text-white font-medium">{m.settings_profile_picture()}</p>
							</div>
						</div>
						<div class="absolute bottom-2 right-2">
							<ImageUpload
								currentImage={profile.avatar_url}
								placeholder=""
								aspectRatio="square"
								disabled={uploadingAvatar}
								onupload={handleAvatarUpload}
								class="!w-10 !h-10 !rounded-full bg-primary hover:bg-primary/90 shadow-lg"
								buttonClass="!p-2"
								iconClass="!w-5 !h-5 text-white"
							/>
						</div>
					</div>
					<div class="flex-1 pb-2">
						<h2 class="text-xl font-semibold text-gray-900 mb-1">{fullName || username || 'Your Name'}</h2>
						<p class="text-sm text-gray-500">@{username || 'username'}</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Modern Form Section -->
		<div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
			<div class="p-6 sm:p-8">
				<h2 class="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
					<User class="w-5 h-5 text-primary" />
					{m.settings_profile_info()}
				</h2>
				
				<div class="space-y-6">
					<!-- Full Name Field -->
					<div class="space-y-2">
						<label for="fullName" class="block text-sm font-medium text-gray-700">
							{m.settings_full_name()}
						</label>
						<div class="relative">
							<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<User class="w-5 h-5 text-gray-400" />
							</div>
							<input
								id="fullName"
								type="text"
								bind:value={fullName}
								placeholder={m.settings_full_name_placeholder()}
								class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 placeholder-gray-400"
							/>
						</div>
					</div>

					<!-- Username Field -->
					<div class="space-y-2">
						<label for="username" class="block text-sm font-medium text-gray-700">
							{m.settings_username()} <span class="text-red-500">*</span>
						</label>
						<div class="relative">
							<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<span class="text-gray-400 font-medium text-lg">@</span>
							</div>
							<input
								id="username"
								type="text"
								bind:value={username}
								placeholder={m.settings_username_placeholder()}
								required
								class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 placeholder-gray-400"
							/>
						</div>
						<p class="text-xs text-gray-500 mt-1">driplo.com/profile/{username || 'username'}</p>
					</div>

					<!-- Bio Field -->
					<div class="space-y-2">
						<label for="bio" class="block text-sm font-medium text-gray-700">
							{m.settings_bio()}
						</label>
						<div class="relative">
							<div class="absolute top-3 left-3 pointer-events-none">
								<FileText class="w-5 h-5 text-gray-400" />
							</div>
							<textarea
								id="bio"
								bind:value={bio}
								placeholder={m.settings_bio_placeholder()}
								rows="4"
								class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 resize-none placeholder-gray-400"
							></textarea>
						</div>
						<p class="text-xs text-gray-500">{bio.length}/500 characters</p>
					</div>

					<!-- Location Field -->
					<div class="space-y-2">
						<label for="location" class="block text-sm font-medium text-gray-700">
							{m.settings_location()}
						</label>
						<div class="relative">
							<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<MapPin class="w-5 h-5 text-gray-400" />
							</div>
							<input
								id="location"
								type="text"
								bind:value={location}
								placeholder={m.settings_location_placeholder()}
								class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 placeholder-gray-400"
							/>
						</div>
					</div>

					<!-- Website Field -->
					<div class="space-y-2">
						<label for="website" class="block text-sm font-medium text-gray-700">
							{m.settings_website()}
						</label>
						<div class="relative">
							<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Globe class="w-5 h-5 text-gray-400" />
							</div>
							<input
								id="website"
								type="url"
								bind:value={website}
								placeholder={m.settings_website_placeholder()}
								class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 placeholder-gray-400"
							/>
						</div>
					</div>
				</div>

				<!-- Social Media Section -->
				<div class="mt-8 pt-8 border-t border-gray-100">
					<h3 class="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
						<Link class="w-5 h-5 text-primary" />
						Social Media Accounts
					</h3>
					
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
						<!-- Instagram -->
						<div class="space-y-2">
							<label for="instagram" class="block text-sm font-medium text-gray-700">
								Instagram
							</label>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Instagram class="w-5 h-5 text-gray-400" />
								</div>
								<input
									id="instagram"
									type="text"
									bind:value={socialMedia.instagram}
									placeholder="@username"
									class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 placeholder-gray-400"
								/>
							</div>
						</div>

						<!-- TikTok -->
						<div class="space-y-2">
							<label for="tiktok" class="block text-sm font-medium text-gray-700">
								TikTok
							</label>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Music2 class="w-5 h-5 text-gray-400" />
								</div>
								<input
									id="tiktok"
									type="text"
									bind:value={socialMedia.tiktok}
									placeholder="@username"
									class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 placeholder-gray-400"
								/>
							</div>
						</div>

						<!-- Facebook -->
						<div class="space-y-2">
							<label for="facebook" class="block text-sm font-medium text-gray-700">
								Facebook
							</label>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Facebook class="w-5 h-5 text-gray-400" />
								</div>
								<input
									id="facebook"
									type="text"
									bind:value={socialMedia.facebook}
									placeholder="username or page"
									class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 placeholder-gray-400"
								/>
							</div>
						</div>

						<!-- Twitter/X -->
						<div class="space-y-2">
							<label for="twitter" class="block text-sm font-medium text-gray-700">
								X (Twitter)
							</label>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Twitter class="w-5 h-5 text-gray-400" />
								</div>
								<input
									id="twitter"
									type="text"
									bind:value={socialMedia.twitter}
									placeholder="@username"
									class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 placeholder-gray-400"
								/>
							</div>
						</div>

						<!-- YouTube -->
						<div class="space-y-2">
							<label for="youtube" class="block text-sm font-medium text-gray-700">
								YouTube
							</label>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Youtube class="w-5 h-5 text-gray-400" />
								</div>
								<input
									id="youtube"
									type="text"
									bind:value={socialMedia.youtube}
									placeholder="@channel"
									class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 placeholder-gray-400"
								/>
							</div>
						</div>

						<!-- Pinterest -->
						<div class="space-y-2">
							<label for="pinterest" class="block text-sm font-medium text-gray-700">
								Pinterest
							</label>
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<svg class="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
										<path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.199-2.405.041-3.442.217-.937 1.407-5.965 1.407-5.965s-.359-.718-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.03-.655 2.569-.994 3.994-.283 1.195.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.091.378-.293 1.189-.332 1.355-.053.219-.173.265-.4.159-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.966 7.398 6.931 0 4.136-2.608 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
									</svg>
								</div>
								<input
									id="pinterest"
									type="text"
									bind:value={socialMedia.pinterest}
									placeholder="username"
									class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 placeholder-gray-400"
								/>
							</div>
						</div>
					</div>
					
					<p class="text-xs text-gray-500 mt-4">Add your social media usernames to help customers find and follow your brand</p>
				</div>
			</div>

			<!-- Modern Save Section -->
			<div class="px-6 sm:px-8 py-6 bg-gray-50 border-t border-gray-100">
				<div class="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
					<p class="text-sm text-gray-500">
						{m.settings_required_fields ? m.settings_required_fields() : 'Fields marked with * are required'}
					</p>
					<div class="flex gap-3">
						<button
							onclick={handleGoBack}
							class="flex-1 sm:flex-initial px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
						>
							Cancel
						</button>
						<button
							onclick={handleSaveProfile}
							disabled={saving || !username.trim()}
							class="flex-1 sm:flex-initial bg-primary text-white py-3 px-8 rounded-xl font-medium hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-2 min-w-[140px]"
						>
							{#if saving}
								<Loader2 class="w-4 h-4 animate-spin" />
								<span>Saving...</span>
							{:else}
								<Save class="w-4 h-4" />
								<span>{m.settings_save_changes()}</span>
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Additional Settings Cards -->
		<div class="mt-8 grid gap-6">
			<!-- Account Settings Card -->
			<div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Account Settings</h3>
				<p class="text-sm text-gray-500 mb-4">Manage your account security and preferences</p>
				<a href="/profile/settings/account" class="text-primary hover:text-primary/80 text-sm font-medium transition-colors">
					Manage Account →
				</a>
			</div>

			<!-- Notification Settings Card -->
			<div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Notifications</h3>
				<p class="text-sm text-gray-500 mb-4">Control how you receive updates and alerts</p>
				<a href="/profile/settings/notifications" class="text-primary hover:text-primary/80 text-sm font-medium transition-colors">
					Configure Notifications →
				</a>
			</div>

			<!-- Privacy Settings Card -->
			<div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Privacy</h3>
				<p class="text-sm text-gray-500 mb-4">Manage your data and privacy preferences</p>
				<a href="/profile/settings/privacy" class="text-primary hover:text-primary/80 text-sm font-medium transition-colors">
					Privacy Settings →
				</a>
			</div>
		</div>

		<!-- Help Section -->
		<div class="mt-8 text-center">
			<p class="text-sm text-gray-500">
				Need help? <a href="/help" class="text-primary hover:underline">Contact support</a>
			</p>
		</div>
	</div>
</div>

<style>
	/* Custom styles for better image upload integration */
	:global(.image-upload-wrapper) {
		border: 0;
		background-color: transparent;
		padding: 0;
	}
	
	:global(.image-upload-button) {
		background-color: primary;
		border: 0;
	}
	
	:global(.image-upload-button:hover) {
		background-color: hsl(var(--primary) / 0.9);
	}
</style>