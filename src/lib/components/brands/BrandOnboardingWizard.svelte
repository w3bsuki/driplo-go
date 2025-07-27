<script lang="ts">
	import { Building2, Upload, FileText, Link2, Check, ArrowLeft, ArrowRight, Camera, Globe, Instagram, Facebook, Twitter, Youtube, Sparkles } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	
	interface Props {
		supabase: any;
		profile: any;
		existingBrandProfile?: any;
	}
	
	let { supabase, profile, existingBrandProfile }: Props = $props();
	
	// Form state
	let loading = $state(false);
	let currentStep = $state(1);
	const totalSteps = 6;
	
	// Step 1: Brand Basics
	let brandName = $state(existingBrandProfile?.brand_name || '');
	let brandCategory = $state(existingBrandProfile?.brand_category || '');
	let brandDescription = $state(existingBrandProfile?.brand_description || '');
	
	// Step 2: Brand Logo
	let brandLogoFile = $state<File | null>(null);
	let brandLogoPreview = $state(existingBrandProfile?.brand_logo_url || '');
	let uploadingLogo = $state(false);
	
	// Step 3: Brand Story
	let brandStory = $state(existingBrandProfile?.brand_story || '');
	let brandValues = $state(existingBrandProfile?.brand_values || '');
	let brandMission = $state(existingBrandProfile?.brand_mission || '');
	
	// Step 4: Cover Image
	let brandCoverFile = $state<File | null>(null);
	let brandCoverPreview = $state(existingBrandProfile?.brand_cover_url || '');
	let uploadingCover = $state(false);
	
	// Step 5: Social Media
	let brandWebsite = $state(existingBrandProfile?.website_url || '');
	let brandInstagram = $state(existingBrandProfile?.instagram_url || '');
	let brandFacebook = $state(existingBrandProfile?.facebook_url || '');
	let brandTwitter = $state(existingBrandProfile?.twitter_url || '');
	let brandYoutube = $state(existingBrandProfile?.youtube_url || '');
	let brandTiktok = $state(existingBrandProfile?.tiktok_url || '');
	
	const brandCategories = [
		'Fashion & Apparel',
		'Accessories',
		'Footwear',
		'Jewelry',
		'Bags & Luggage',
		'Beauty & Cosmetics',
		'Vintage & Thrift',
		'Handmade & Artisan',
		'Sustainable Fashion',
		'Streetwear',
		'Luxury Fashion',
		'Other'
	];
	
	async function handleLogoChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files?.length) return;
		
		const file = input.files[0];
		if (file.size > 5 * 1024 * 1024) {
			toast.error('Logo must be less than 5MB');
			return;
		}
		
		brandLogoFile = file;
		
		// Create preview
		const reader = new FileReader();
		reader.onload = (e) => {
			brandLogoPreview = e.target?.result as string;
		};
		reader.readAsDataURL(file);
	}
	
	async function handleCoverChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files?.length) return;
		
		const file = input.files[0];
		if (file.size > 10 * 1024 * 1024) {
			toast.error('Cover image must be less than 10MB');
			return;
		}
		
		brandCoverFile = file;
		
		// Create preview
		const reader = new FileReader();
		reader.onload = (e) => {
			brandCoverPreview = e.target?.result as string;
		};
		reader.readAsDataURL(file);
	}
	
	async function uploadImage(file: File, type: 'logo' | 'cover'): Promise<string | null> {
		try {
			const fileExt = file.name.split('.').pop();
			const fileName = `${profile.id}/${type}_${Date.now()}.${fileExt}`;
			
			const { data, error } = await supabase.storage
				.from('brand-assets')
				.upload(fileName, file, {
					cacheControl: '3600',
					upsert: true
				});
			
			if (error) throw error;
			
			const { data: { publicUrl } } = supabase.storage
				.from('brand-assets')
				.getPublicUrl(fileName);
			
			return publicUrl;
		} catch (error: any) {
			console.error(`Error uploading ${type}:`, error);
			toast.error(`Failed to upload ${type}`);
			return null;
		}
	}
	
	function canProceed(): boolean {
		switch (currentStep) {
			case 1:
				return brandName.trim() !== '' && brandCategory !== '' && brandDescription.trim() !== '';
			case 2:
				return true; // Logo is optional
			case 3:
				return brandStory.trim() !== ''; // Story is required, values and mission are optional
			case 4:
				return true; // Cover is optional
			case 5:
				return true; // Social media is optional
			case 6:
				return true; // Review step
			default:
				return false;
		}
	}
	
	async function generateBrandSlug(name: string): Promise<string> {
		const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
		let slug = baseSlug;
		let counter = 0;
		
		while (true) {
			const { data } = await supabase
				.from('brand_profiles')
				.select('id')
				.eq('brand_slug', slug)
				.single();
			
			if (!data) break;
			
			counter++;
			slug = `${baseSlug}-${counter}`;
		}
		
		return slug;
	}
	
	async function handleComplete() {
		loading = true;
		
		try {
			// Upload images if new ones selected
			let logoUrl = brandLogoPreview;
			let coverUrl = brandCoverPreview;
			
			if (brandLogoFile) {
				uploadingLogo = true;
				const uploadedUrl = await uploadImage(brandLogoFile, 'logo');
				if (uploadedUrl) logoUrl = uploadedUrl;
				uploadingLogo = false;
			}
			
			if (brandCoverFile) {
				uploadingCover = true;
				const uploadedUrl = await uploadImage(brandCoverFile, 'cover');
				if (uploadedUrl) coverUrl = uploadedUrl;
				uploadingCover = false;
			}
			
			// Update profile to brand account
			const { error: profileError } = await supabase
				.from('profiles')
				.update({
					account_type: 'brand',
					brand_name: brandName,
					brand_description: brandDescription,
					brand_category: brandCategory,
					brand_story: brandStory,
					brand_logo_url: logoUrl,
					brand_cover_url: coverUrl,
					brand_onboarding_completed: true
				})
				.eq('id', profile.id);
			
			if (profileError) throw profileError;
			
			// Generate brand slug
			const brandSlug = await generateBrandSlug(brandName);
			
			// Create or update brand profile
			const brandProfileData = {
				user_id: profile.id,
				brand_name: brandName,
				brand_slug: brandSlug,
				brand_description: brandDescription,
				brand_category: brandCategory,
				brand_story: brandStory,
				brand_values: brandValues,
				brand_mission: brandMission,
				brand_logo_url: logoUrl,
				brand_cover_url: coverUrl,
				website_url: brandWebsite || null,
				instagram_url: brandInstagram || null,
				facebook_url: brandFacebook || null,
				twitter_url: brandTwitter || null,
				youtube_url: brandYoutube || null,
				tiktok_url: brandTiktok || null
			};
			
			if (existingBrandProfile) {
				// Update existing
				const { error } = await supabase
					.from('brand_profiles')
					.update(brandProfileData)
					.eq('id', existingBrandProfile.id);
				
				if (error) throw error;
			} else {
				// Create new
				const { error } = await supabase
					.from('brand_profiles')
					.insert(brandProfileData);
				
				if (error) throw error;
			}
			
			toast.success('Brand profile created successfully!');
			
			// Redirect to brand welcome page
			goto(`/brands/welcome?slug=${brandSlug}`);
			
		} catch (error: any) {
			console.error('Error creating brand:', error);
			toast.error(error.message || 'Failed to create brand profile');
		} finally {
			loading = false;
		}
	}
	
	function handleNextStep() {
		if (canProceed() && currentStep < totalSteps) {
			currentStep++;
		}
	}
	
	function handlePrevStep() {
		if (currentStep > 1) {
			currentStep--;
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8">
	<div class="max-w-4xl mx-auto px-4">
		<!-- Header -->
		<div class="text-center mb-8">
			<h1 class="text-4xl font-bold text-gray-900 mb-3">
				Turn Your Account into a Brand
			</h1>
			<p class="text-lg text-gray-600">
				Let's set up your professional brand presence on Driplo
			</p>
		</div>
		
		<!-- Progress Bar -->
		<div class="mb-8">
			<div class="flex items-center justify-between mb-2">
				<span class="text-sm text-gray-600">Step {currentStep} of {totalSteps}</span>
				<span class="text-sm text-gray-600">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
			</div>
			<div class="w-full bg-gray-200 rounded-full h-2">
				<div 
					class="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
					style="width: {(currentStep / totalSteps) * 100}%"
				></div>
			</div>
		</div>
		
		<!-- Form Content -->
		<div class="bg-white rounded-2xl shadow-xl p-8">
			{#if currentStep === 1}
				<!-- Step 1: Brand Basics -->
				<div class="space-y-6">
					<div class="text-center mb-6">
						<div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<Building2 class="w-8 h-8 text-purple-600" />
						</div>
						<h2 class="text-2xl font-semibold text-gray-900">Brand Basics</h2>
						<p class="text-gray-600 mt-2">Let's start with your brand's essential information</p>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Brand Name <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							bind:value={brandName}
							placeholder="Enter your brand name"
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							maxlength="100"
						/>
						<p class="mt-1 text-xs text-gray-500">This will be your official brand name on Driplo</p>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Brand Category <span class="text-red-500">*</span>
						</label>
						<select
							bind:value={brandCategory}
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
						>
							<option value="">Select a category</option>
							{#each brandCategories as category}
								<option value={category}>{category}</option>
							{/each}
						</select>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Brand Description <span class="text-red-500">*</span>
						</label>
						<textarea
							bind:value={brandDescription}
							placeholder="Describe what your brand is about..."
							rows="4"
							maxlength="500"
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
						></textarea>
						<p class="mt-1 text-xs text-gray-500">{brandDescription.length}/500 characters</p>
					</div>
				</div>
				
			{:else if currentStep === 2}
				<!-- Step 2: Brand Logo -->
				<div class="space-y-6">
					<div class="text-center mb-6">
						<div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<Camera class="w-8 h-8 text-purple-600" />
						</div>
						<h2 class="text-2xl font-semibold text-gray-900">Brand Logo</h2>
						<p class="text-gray-600 mt-2">Upload a logo that represents your brand (optional)</p>
					</div>
					
					<div class="flex flex-col items-center">
						<div class="relative">
							<div class="w-48 h-48 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
								{#if brandLogoPreview}
									<img 
										src={brandLogoPreview} 
										alt="Brand logo"
										class="w-full h-full object-cover"
									/>
								{:else}
									<Camera class="w-16 h-16 text-gray-400" />
								{/if}
							</div>
							
							{#if uploadingLogo}
								<div class="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
									<Spinner size="lg" color="white" />
								</div>
							{/if}
						</div>
						
						<label class="mt-6 cursor-pointer">
							<input
								type="file"
								accept="image/*"
								onchange={handleLogoChange}
								class="hidden"
								disabled={uploadingLogo}
							/>
							<div class="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors">
								<Upload class="w-5 h-5 inline mr-2" />
								{brandLogoPreview ? 'Change Logo' : 'Upload Logo'}
							</div>
						</label>
						
						<p class="mt-4 text-xs text-gray-500 text-center max-w-sm">
							Recommended: Square image, at least 400x400px, PNG or JPG format. Max size: 5MB
						</p>
					</div>
				</div>
				
			{:else if currentStep === 3}
				<!-- Step 3: Brand Story -->
				<div class="space-y-6">
					<div class="text-center mb-6">
						<div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<FileText class="w-8 h-8 text-purple-600" />
						</div>
						<h2 class="text-2xl font-semibold text-gray-900">Brand Story</h2>
						<p class="text-gray-600 mt-2">Share your brand's journey and what drives you</p>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Your Story <span class="text-red-500">*</span>
						</label>
						<textarea
							bind:value={brandStory}
							placeholder="Tell customers about your brand's journey, inspiration, and what makes you unique..."
							rows="6"
							maxlength="1000"
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
						></textarea>
						<p class="mt-1 text-xs text-gray-500">{brandStory.length}/1000 characters</p>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Brand Values (optional)
						</label>
						<textarea
							bind:value={brandValues}
							placeholder="What values does your brand stand for? (e.g., sustainability, quality, innovation)"
							rows="3"
							maxlength="500"
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
						></textarea>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Brand Mission (optional)
						</label>
						<textarea
							bind:value={brandMission}
							placeholder="What is your brand's mission statement?"
							rows="2"
							maxlength="300"
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
						></textarea>
					</div>
				</div>
				
			{:else if currentStep === 4}
				<!-- Step 4: Cover Image -->
				<div class="space-y-6">
					<div class="text-center mb-6">
						<div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<Upload class="w-8 h-8 text-purple-600" />
						</div>
						<h2 class="text-2xl font-semibold text-gray-900">Brand Cover</h2>
						<p class="text-gray-600 mt-2">Add a cover image for your brand profile (optional)</p>
					</div>
					
					<div class="flex flex-col items-center">
						<div class="relative w-full max-w-2xl">
							<div class="w-full h-64 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
								{#if brandCoverPreview}
									<img 
										src={brandCoverPreview} 
										alt="Brand cover"
										class="w-full h-full object-cover"
									/>
								{:else}
									<Upload class="w-16 h-16 text-gray-400" />
								{/if}
							</div>
							
							{#if uploadingCover}
								<div class="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
									<Spinner size="lg" color="white" />
								</div>
							{/if}
						</div>
						
						<label class="mt-6 cursor-pointer">
							<input
								type="file"
								accept="image/*"
								onchange={handleCoverChange}
								class="hidden"
								disabled={uploadingCover}
							/>
							<div class="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors">
								<Upload class="w-5 h-5 inline mr-2" />
								{brandCoverPreview ? 'Change Cover' : 'Upload Cover'}
							</div>
						</label>
						
						<p class="mt-4 text-xs text-gray-500 text-center max-w-sm">
							Recommended: 1920x480px or similar aspect ratio, PNG or JPG format. Max size: 10MB
						</p>
					</div>
				</div>
				
			{:else if currentStep === 5}
				<!-- Step 5: Social Media -->
				<div class="space-y-6">
					<div class="text-center mb-6">
						<div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<Link2 class="w-8 h-8 text-purple-600" />
						</div>
						<h2 class="text-2xl font-semibold text-gray-900">Social Media</h2>
						<p class="text-gray-600 mt-2">Connect your social accounts to build trust (optional)</p>
					</div>
					
					<div class="grid gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
								<Globe class="w-4 h-4" />
								Website
							</label>
							<input
								type="url"
								bind:value={brandWebsite}
								placeholder="https://yourbrand.com"
								class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							/>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
								<Instagram class="w-4 h-4" />
								Instagram
							</label>
							<input
								type="text"
								bind:value={brandInstagram}
								placeholder="https://instagram.com/yourbrand"
								class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							/>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
								<Facebook class="w-4 h-4" />
								Facebook
							</label>
							<input
								type="text"
								bind:value={brandFacebook}
								placeholder="https://facebook.com/yourbrand"
								class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							/>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
								<Twitter class="w-4 h-4" />
								Twitter
							</label>
							<input
								type="text"
								bind:value={brandTwitter}
								placeholder="https://twitter.com/yourbrand"
								class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							/>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
								<Youtube class="w-4 h-4" />
								YouTube
							</label>
							<input
								type="text"
								bind:value={brandYoutube}
								placeholder="https://youtube.com/@yourbrand"
								class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							/>
						</div>
						
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
								<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
									<path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
								</svg>
								TikTok
							</label>
							<input
								type="text"
								bind:value={brandTiktok}
								placeholder="https://tiktok.com/@yourbrand"
								class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
							/>
						</div>
					</div>
				</div>
				
			{:else if currentStep === 6}
				<!-- Step 6: Review -->
				<div class="space-y-6">
					<div class="text-center mb-6">
						<div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<Check class="w-8 h-8 text-purple-600" />
						</div>
						<h2 class="text-2xl font-semibold text-gray-900">Review & Confirm</h2>
						<p class="text-gray-600 mt-2">Review your brand information before creating your profile</p>
					</div>
					
					<div class="space-y-4">
						<!-- Logo & Name -->
						<div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
							{#if brandLogoPreview}
								<img src={brandLogoPreview} alt="Logo" class="w-16 h-16 rounded-lg object-cover" />
							{:else}
								<div class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
									<Building2 class="w-8 h-8 text-gray-400" />
								</div>
							{/if}
							<div>
								<h3 class="font-semibold text-gray-900">{brandName}</h3>
								<p class="text-sm text-gray-600">{brandCategory}</p>
							</div>
						</div>
						
						<!-- Description -->
						<div class="p-4 bg-gray-50 rounded-lg">
							<h4 class="font-medium text-gray-900 mb-2">Description</h4>
							<p class="text-sm text-gray-600">{brandDescription}</p>
						</div>
						
						<!-- Story -->
						{#if brandStory}
							<div class="p-4 bg-gray-50 rounded-lg">
								<h4 class="font-medium text-gray-900 mb-2">Brand Story</h4>
								<p class="text-sm text-gray-600 line-clamp-3">{brandStory}</p>
							</div>
						{/if}
						
						<!-- Social Media -->
						{#if brandWebsite || brandInstagram || brandFacebook || brandTwitter || brandYoutube || brandTiktok}
							<div class="p-4 bg-gray-50 rounded-lg">
								<h4 class="font-medium text-gray-900 mb-2">Social Media</h4>
								<div class="flex flex-wrap gap-3">
									{#if brandWebsite}
										<div class="flex items-center gap-1 text-sm text-gray-600">
											<Globe class="w-4 h-4" />
											Website
										</div>
									{/if}
									{#if brandInstagram}
										<div class="flex items-center gap-1 text-sm text-gray-600">
											<Instagram class="w-4 h-4" />
											Instagram
										</div>
									{/if}
									{#if brandFacebook}
										<div class="flex items-center gap-1 text-sm text-gray-600">
											<Facebook class="w-4 h-4" />
											Facebook
										</div>
									{/if}
									{#if brandTwitter}
										<div class="flex items-center gap-1 text-sm text-gray-600">
											<Twitter class="w-4 h-4" />
											Twitter
										</div>
									{/if}
									{#if brandYoutube}
										<div class="flex items-center gap-1 text-sm text-gray-600">
											<Youtube class="w-4 h-4" />
											YouTube
										</div>
									{/if}
									{#if brandTiktok}
										<div class="flex items-center gap-1 text-sm text-gray-600">
											<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
												<path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
											</svg>
											TikTok
										</div>
									{/if}
								</div>
							</div>
						{/if}
						
						<div class="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
							<div class="flex gap-3">
								<Sparkles class="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
								<div class="text-sm">
									<p class="font-medium text-purple-900 mb-2">What happens next?</p>
									<ul class="space-y-1 text-purple-800">
										<li>• Your brand profile will be created immediately</li>
										<li>• You'll get access to brand analytics and tools</li>
										<li>• Customers will see your brand badge on listings</li>
										<li>• You can apply for verification later</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
			
			<!-- Navigation Buttons -->
			<div class="flex justify-between mt-8">
				<button
					onclick={handlePrevStep}
					disabled={currentStep === 1}
					class="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
				>
					<ArrowLeft class="w-5 h-5" />
					Previous
				</button>
				
				{#if currentStep < totalSteps}
					<button
						onclick={handleNextStep}
						disabled={!canProceed()}
						class="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
					>
						Next
						<ArrowRight class="w-5 h-5" />
					</button>
				{:else}
					<button
						onclick={handleComplete}
						disabled={loading || !canProceed()}
						class="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
					>
						{#if loading}
							<Spinner size="sm" color="white" />
							Creating Brand...
						{:else}
							<Check class="w-5 h-5" />
							Create Brand Profile
						{/if}
					</button>
				{/if}
			</div>
		</div>
		
		<!-- Skip for Now -->
		<div class="text-center mt-6">
			<a href="/" class="text-gray-500 hover:text-gray-700 text-sm">
				Skip for now
			</a>
		</div>
	</div>
</div>