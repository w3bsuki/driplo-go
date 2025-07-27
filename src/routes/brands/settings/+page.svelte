<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import { 
		Store, Check, X, Upload, Link, Instagram, Facebook, 
		Globe, FileText, Shield, AlertCircle, Clock, ChevronRight,
		Twitter, Youtube
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { cn } from '$lib/utils';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import * as m from '$lib/paraglide/messages.js';

	let { data }: { data: PageData } = $props();
	
	const supabase = $derived(data.supabase);
	const user = $derived(data.user);
	const profile = $derived(data.profile);
	
	// Form state
	let loading = $state(false);
	let activeTab = $state<'info' | 'verification' | 'social'>('info');
	let uploadingLogo = $state(false);
	
	// Brand info
	let brandName = $state(profile?.brand_name || '');
	let brandDescription = $state(profile?.brand_description || '');
	let brandCategory = $state(profile?.brand_category || '');
	let brandWebsite = $state(profile?.brand_website || '');
	let brandStory = $state(profile?.brand_story || '');
	let brandEstablishedDate = $state(profile?.brand_established_date || '');
	
	// Social media
	let brandInstagram = $state(profile?.brand_instagram || '');
	let brandFacebook = $state(profile?.brand_facebook || '');
	let brandTwitter = $state('');
	let brandYoutube = $state('');
	let brandTiktok = $state('');
	
	// Verification
	let verificationRequest = $state<any>(null);
	let businessRegistrationNumber = $state('');
	let taxId = $state('');
	let verificationDocuments = $state<File[]>([]);
	
	// Check if user is already a brand
	let isBrand = $derived(profile?.account_type === 'brand');
	let isVerified = $derived(profile?.is_verified || false);
	
	async function generateBrandSlug(brandName: string): Promise<string> {
		const baseSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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

	onMount(async () => {
		if (!user) {
			goto('/login');
			return;
		}
		
		// If profile is null or not loaded properly, try to fetch it
		if (!profile) {
			// Fetch profile if not loaded
			const { data: fetchedProfile } = await supabase
				.from('profiles')
				.select('*')
				.eq('id', user.id)
				.single();
			
			if (fetchedProfile) {
				// Update the local state with fetched profile
				data.profile = fetchedProfile;
			}
		}
		
		// Load existing verification request if any
		if (isBrand) {
			const { data } = await supabase
				.from('brand_verification_requests' as any)
				.select('*')
				.eq('user_id', user.id)
				.order('created_at', { ascending: false })
				.limit(1)
				.single();
			
			if (data) {
				verificationRequest = data;
			}
		}
		
		// Load social media accounts from page data
		const socialAccounts = data.socialMediaAccounts;
		
		if (socialAccounts) {
			socialAccounts.forEach(account => {
				switch (account.platform) {
					case 'twitter':
						brandTwitter = account.username;
						break;
					case 'youtube':
						brandYoutube = account.username;
						break;
					case 'tiktok':
						brandTiktok = account.username;
						break;
				}
			});
		}
	});
	
	async function handleUpgradeToBrand() {
		if (!brandName.trim()) {
			toast.error('Please enter a brand name');
			return;
		}
		
		loading = true;
		try {
			const { error } = await supabase
				.from('profiles')
				.update({
					account_type: 'brand',
					brand_name: brandName,
					brand_description: brandDescription,
					brand_category: brandCategory,
					brand_website: brandWebsite,
					brand_story: brandStory,
					brand_established_date: brandEstablishedDate || null
				})
				.eq('id', user.id);
			
			if (error) throw error;
			
			// Generate brand slug for the new brand
			const brandSlug = await generateBrandSlug(brandName);
			
			// Create brand profile
			const { error: brandProfileError } = await supabase
				.from('brand_profiles')
				.insert({
					user_id: user.id,
					brand_name: brandName,
					brand_slug: brandSlug,
					brand_description: brandDescription,
					website_url: brandWebsite
				});
			
			if (brandProfileError) throw brandProfileError;
			
			toast.success('Successfully upgraded to brand account!');
			// Redirect to brand welcome page
			goto(`/brands/welcome?slug=${brandSlug}`);
		} catch (error: any) {
			toast.error(error.message || 'Failed to upgrade account');
		} finally {
			loading = false;
		}
	}
	
	async function handleUpdateBrandInfo() {
		loading = true;
		try {
			const { error } = await supabase
				.from('profiles')
				.update({
					brand_name: brandName,
					brand_description: brandDescription,
					brand_category: brandCategory,
					brand_website: brandWebsite,
					brand_story: brandStory,
					brand_established_date: brandEstablishedDate || null,
					brand_instagram: brandInstagram,
					brand_facebook: brandFacebook
				})
				.eq('id', user.id);
			
			if (error) throw error;
			
			// Save social media accounts
			const socialPlatforms = [
				{ platform: 'instagram', username: brandInstagram, url: `https://instagram.com/${brandInstagram}` },
				{ platform: 'facebook', username: brandFacebook, url: `https://facebook.com/${brandFacebook}` },
				{ platform: 'twitter', username: brandTwitter, url: `https://twitter.com/${brandTwitter}` },
				{ platform: 'youtube', username: brandYoutube, url: `https://youtube.com/@${brandYoutube}` },
				{ platform: 'tiktok', username: brandTiktok, url: `https://tiktok.com/@${brandTiktok}` }
			];
			
			for (const social of socialPlatforms) {
				if (social.username) {
					await supabase
						.from('social_media_accounts')
						.upsert({
							user_id: user.id,
							platform: social.platform,
							username: social.username,
							url: social.url
						}, {
							onConflict: 'user_id,platform'
						});
				}
			}
			
			toast.success('Brand information updated successfully!');
		} catch (error: any) {
			toast.error(error.message || 'Failed to update brand info');
		} finally {
			loading = false;
		}
	}
	
	async function handleSubmitVerification() {
		if (!businessRegistrationNumber && !taxId) {
			toast.error('Please provide at least one business identifier');
			return;
		}
		
		loading = true;
		try {
			// Upload documents if any
			let documentUrls = [];
			if (verificationDocuments.length > 0) {
				for (const doc of verificationDocuments) {
					const fileName = `brand-docs/${user.id}/${Date.now()}-${doc.name}`;
					const { data: uploadData, error: uploadError } = await supabase.storage
						.from('documents')
						.upload(fileName, doc);
					
					if (uploadError) throw uploadError;
					
					const { data: { publicUrl } } = supabase.storage
						.from('documents')
						.getPublicUrl(fileName);
					
					documentUrls.push({
						name: doc.name,
						url: publicUrl,
						uploaded_at: new Date().toISOString()
					});
				}
			}
			
			// Create verification request
			const { data, error } = await supabase
				.from('brand_verification_requests' as any)
				.insert({
					user_id: user.id,
					brand_name: brandName,
					brand_category: brandCategory,
					business_registration_number: businessRegistrationNumber || null,
					tax_id: taxId || null,
					documents: documentUrls,
					social_media_accounts: {
						instagram: brandInstagram,
						facebook: brandFacebook,
						twitter: brandTwitter,
						youtube: brandYoutube,
						tiktok: brandTiktok,
						website: brandWebsite
					}
				})
				.select()
				.single();
			
			if (error) throw error;
			
			verificationRequest = data;
			toast.success('Verification request submitted successfully! We\'ll review it within 2-3 business days.');
		} catch (error: any) {
			toast.error(error.message || 'Failed to submit verification');
		} finally {
			loading = false;
		}
	}
	
	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files) {
			verificationDocuments = Array.from(input.files);
		}
	}
	
	function getStatusBadge(status: string) {
		switch (status) {
			case 'pending':
				return { icon: Clock, class: 'bg-yellow-100 text-yellow-700', text: 'Pending Review' };
			case 'approved':
				return { icon: Check, class: 'bg-green-100 text-green-700', text: 'Verified' };
			case 'rejected':
				return { icon: X, class: 'bg-red-100 text-red-700', text: 'Rejected' };
			case 'more_info_needed':
				return { icon: AlertCircle, class: 'bg-orange-100 text-orange-700', text: 'More Info Needed' };
			default:
				return { icon: Clock, class: 'bg-gray-100 text-gray-700', text: status };
		}
	}
</script>

<svelte:head>
	<title>{isBrand ? 'Brand Settings' : 'Upgrade to Brand Account'} - Driplo</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<div class="container mx-auto px-4 py-8 max-w-4xl">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900 flex items-center gap-3">
				<Store class="w-8 h-8 text-primary" />
				{isBrand ? 'Brand Settings' : 'Upgrade to Brand Account'}
			</h1>
			<p class="text-gray-600 mt-2">
				{isBrand 
					? 'Manage your brand profile and verification status' 
					: 'Transform your personal account into a professional brand account'}
			</p>
		</div>
		
		{#if profile === null || profile === undefined}
			<!-- Loading State -->
			<div class="bg-white rounded-xl shadow-sm p-8 flex items-center justify-center">
				<Spinner size="lg" />
			</div>
		{:else if !isBrand}
			<!-- Upgrade to Brand Section -->
			<div class="bg-white rounded-xl shadow-sm p-8">
				<h2 class="text-2xl font-semibold mb-6">Why upgrade to a Brand Account?</h2>
				
				<div class="grid md:grid-cols-2 gap-6 mb-8">
					<div class="space-y-4">
						<div class="flex gap-3">
							<div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
								<Shield class="w-5 h-5 text-primary" />
							</div>
							<div>
								<h3 class="font-medium">Verified Badge</h3>
								<p class="text-sm text-gray-600">Get a verified checkmark to build trust</p>
							</div>
						</div>
						<div class="flex gap-3">
							<div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
								<Store class="w-5 h-5 text-primary" />
							</div>
							<div>
								<h3 class="font-medium">Brand Storefront</h3>
								<p class="text-sm text-gray-600">Dedicated brand page with custom branding</p>
							</div>
						</div>
					</div>
					<div class="space-y-4">
						<div class="flex gap-3">
							<div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
								<Globe class="w-5 h-5 text-primary" />
							</div>
							<div>
								<h3 class="font-medium">Priority Listing</h3>
								<p class="text-sm text-gray-600">Featured placement in search results</p>
							</div>
						</div>
						<div class="flex gap-3">
							<div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
								<FileText class="w-5 h-5 text-primary" />
							</div>
							<div>
								<h3 class="font-medium">Analytics & Insights</h3>
								<p class="text-sm text-gray-600">Detailed sales and performance data</p>
							</div>
						</div>
					</div>
				</div>
				
				<div class="border-t pt-6 space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Brand Name *
						</label>
						<input
							type="text"
							bind:value={brandName}
							placeholder="Enter your brand name"
							class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
						/>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Brand Description
						</label>
						<textarea
							bind:value={brandDescription}
							placeholder="Tell us about your brand..."
							rows="3"
							class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
						/>
					</div>
					
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Brand Category
						</label>
						<select
							bind:value={brandCategory}
							class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
						>
							<option value="">Select category</option>
							<option value="fashion">Fashion & Apparel</option>
							<option value="accessories">Accessories</option>
							<option value="footwear">Footwear</option>
							<option value="jewelry">Jewelry</option>
							<option value="bags">Bags & Luggage</option>
							<option value="beauty">Beauty & Cosmetics</option>
							<option value="vintage">Vintage & Thrift</option>
							<option value="handmade">Handmade & Artisan</option>
							<option value="sustainable">Sustainable Fashion</option>
							<option value="other">Other</option>
						</select>
					</div>
					
					<button
						onclick={handleUpgradeToBrand}
						disabled={loading || !brandName.trim()}
						class="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
					>
						{#if loading}
							<Spinner size="sm" color="white" />
						{:else}
							<Store class="w-5 h-5" />
							Upgrade to Brand Account
						{/if}
					</button>
				</div>
			</div>
		{:else}
			<!-- Brand Management Tabs -->
			<div class="bg-white rounded-xl shadow-sm">
				<div class="border-b">
					<div class="flex">
						<button
							onclick={() => activeTab = 'info'}
							class={cn(
								"px-6 py-4 font-medium transition-colors relative",
								activeTab === 'info' 
									? "text-primary border-b-2 border-primary" 
									: "text-gray-500 hover:text-gray-700"
							)}
						>
							Brand Info
						</button>
						<button
							onclick={() => activeTab = 'verification'}
							class={cn(
								"px-6 py-4 font-medium transition-colors relative flex items-center gap-2",
								activeTab === 'verification' 
									? "text-primary border-b-2 border-primary" 
									: "text-gray-500 hover:text-gray-700"
							)}
						>
							Verification
							{#if isVerified}
								<Check class="w-4 h-4 text-green-600" />
							{:else if verificationRequest}
								<Clock class="w-4 h-4 text-yellow-600" />
							{/if}
						</button>
						<button
							onclick={() => activeTab = 'social'}
							class={cn(
								"px-6 py-4 font-medium transition-colors relative",
								activeTab === 'social' 
									? "text-primary border-b-2 border-primary" 
									: "text-gray-500 hover:text-gray-700"
							)}
						>
							Social Media
						</button>
					</div>
				</div>
				
				<div class="p-8">
					{#if activeTab === 'info'}
						<!-- Brand Info Tab -->
						<div class="space-y-6">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">
									Brand Name
								</label>
								<input
									type="text"
									bind:value={brandName}
									class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
								/>
							</div>
							
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">
									Brand Description
								</label>
								<textarea
									bind:value={brandDescription}
									rows="3"
									class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
								/>
							</div>
							
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">
									Brand Story
								</label>
								<textarea
									bind:value={brandStory}
									rows="5"
									placeholder="Tell your brand's story..."
									class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
								/>
							</div>
							
							<div class="grid md:grid-cols-2 gap-6">
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										Category
									</label>
									<select
										bind:value={brandCategory}
										class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
									>
										<option value="">Select category</option>
										<option value="fashion">Fashion & Apparel</option>
										<option value="accessories">Accessories</option>
										<option value="footwear">Footwear</option>
										<option value="jewelry">Jewelry</option>
										<option value="bags">Bags & Luggage</option>
										<option value="beauty">Beauty & Cosmetics</option>
										<option value="vintage">Vintage & Thrift</option>
										<option value="handmade">Handmade & Artisan</option>
										<option value="sustainable">Sustainable Fashion</option>
										<option value="other">Other</option>
									</select>
								</div>
								
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-2">
										Established Date
									</label>
									<input
										type="date"
										bind:value={brandEstablishedDate}
										class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
									/>
								</div>
							</div>
							
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">
									Website
								</label>
								<input
									type="url"
									bind:value={brandWebsite}
									placeholder="https://yourbrand.com"
									class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
								/>
							</div>
							
							<button
								onclick={handleUpdateBrandInfo}
								disabled={loading}
								class="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
							>
								{#if loading}
									<Spinner size="sm" color="white" />
								{:else}
									Save Changes
								{/if}
							</button>
						</div>
					{:else if activeTab === 'verification'}
						<!-- Verification Tab -->
						<div class="space-y-6">
							{#if isVerified}
								<div class="bg-green-50 border border-green-200 rounded-lg p-6 flex items-start gap-4">
									<div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
										<Shield class="w-6 h-6 text-green-600" />
									</div>
									<div>
										<h3 class="font-semibold text-green-900">Your brand is verified!</h3>
										<p class="text-green-700 mt-1">
											You have access to all brand features including the verified badge.
										</p>
									</div>
								</div>
							{:else if verificationRequest}
								{@const status = getStatusBadge(verificationRequest.verification_status)}
								<div class={cn(
									"border rounded-lg p-6 flex items-start gap-4",
									verificationRequest.verification_status === 'pending' && "bg-yellow-50 border-yellow-200",
									verificationRequest.verification_status === 'rejected' && "bg-red-50 border-red-200",
									verificationRequest.verification_status === 'more_info_needed' && "bg-orange-50 border-orange-200"
								)}>
									<div class={cn("w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0", status.class)}>
										<svelte:component this={status.icon} class="w-6 h-6" />
									</div>
									<div class="flex-1">
										<h3 class="font-semibold">{status.text}</h3>
										<p class="text-sm text-gray-600 mt-1">
											Submitted on {new Date(verificationRequest.submitted_at).toLocaleDateString()}
										</p>
										{#if verificationRequest.admin_notes}
											<div class="mt-3 p-3 bg-white rounded border">
												<p class="text-sm font-medium mb-1">Admin Notes:</p>
												<p class="text-sm text-gray-600">{verificationRequest.admin_notes}</p>
											</div>
										{/if}
									</div>
								</div>
							{/if}
							
							{#if !isVerified && (!verificationRequest || verificationRequest.verification_status === 'rejected')}
								<div class="space-y-4">
									<p class="text-gray-600">
										Verify your brand to get a verified badge and access premium features.
									</p>
									
									<div>
										<label class="block text-sm font-medium text-gray-700 mb-2">
											Business Registration Number
										</label>
										<input
											type="text"
											bind:value={businessRegistrationNumber}
											placeholder="Enter your business registration number"
											class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
										/>
									</div>
									
									<div>
										<label class="block text-sm font-medium text-gray-700 mb-2">
											Tax ID / VAT Number
										</label>
										<input
											type="text"
											bind:value={taxId}
											placeholder="Enter your tax ID"
											class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
										/>
									</div>
									
									<div>
										<label class="block text-sm font-medium text-gray-700 mb-2">
											Supporting Documents
										</label>
										<input
											type="file"
											multiple
											accept=".pdf,.jpg,.jpeg,.png"
											onchange={handleFileSelect}
											class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
										/>
										<p class="text-xs text-gray-500 mt-1">
											Upload business registration, tax certificates, or other relevant documents
										</p>
									</div>
									
									<button
										onclick={handleSubmitVerification}
										disabled={loading}
										class="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
									>
										{#if loading}
											<Spinner size="sm" color="white" />
										{:else}
											<Shield class="w-5 h-5" />
											Submit for Verification
										{/if}
									</button>
								</div>
							{/if}
						</div>
					{:else if activeTab === 'social'}
						<!-- Social Media Tab -->
						<div class="space-y-6">
							<p class="text-gray-600">
								Connect your social media accounts to build trust with customers.
							</p>
							
							<div class="space-y-4">
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
										<Instagram class="w-4 h-4" />
										Instagram
									</label>
									<input
										type="text"
										bind:value={brandInstagram}
										placeholder="@yourbrand"
										class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
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
										placeholder="yourbrand"
										class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
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
										placeholder="@yourbrand"
										class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
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
										placeholder="@yourbrand"
										class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
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
										placeholder="@yourbrand"
										class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
									/>
								</div>
							</div>
							
							<button
								onclick={handleUpdateBrandInfo}
								disabled={loading}
								class="w-full py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
							>
								{#if loading}
									<Spinner size="sm" color="white" />
								{:else}
									Save Social Media
								{/if}
							</button>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>