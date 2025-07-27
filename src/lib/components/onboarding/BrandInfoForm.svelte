<script lang="ts">
	import { Building2, Tag, FileText, Link2, Plus, X, Instagram, Globe, ShieldCheck } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	interface SocialMediaAccount {
		platform: string;
		username: string;
		url?: string;
	}

	interface Props {
		brandName: string;
		brandCategory: string;
		brandDescription: string;
		socialMediaAccounts: SocialMediaAccount[];
	}

	let { 
		brandName = $bindable(''), 
		brandCategory = $bindable(''), 
		brandDescription = $bindable(''),
		socialMediaAccounts = $bindable([])
	}: Props = $props();

	const brandCategories = [
		'Local Artisan',
		'Startup Brand',
		'Established Brand',
		'Vintage Collector',
		'Custom/Handmade',
		'Boutique',
		'Designer Brand',
		'Sustainable Fashion',
		'Streetwear',
		'Luxury Fashion'
	];

	const socialPlatforms = [
		{ id: 'instagram', name: 'Instagram', icon: '📷', placeholder: 'username' },
		{ id: 'tiktok', name: 'TikTok', icon: '🎵', placeholder: '@username' },
		{ id: 'facebook', name: 'Facebook', icon: '👥', placeholder: 'pagename' },
		{ id: 'twitter', name: 'Twitter/X', icon: '🐦', placeholder: '@username' },
		{ id: 'youtube', name: 'YouTube', icon: '📺', placeholder: 'channel' },
		{ id: 'pinterest', name: 'Pinterest', icon: '📌', placeholder: 'username' },
		{ id: 'website', name: 'Website', icon: '🌐', placeholder: 'https://example.com' }
	];

	let newSocialPlatform = $state('instagram');
	let newSocialUsername = $state('');
	let showAddSocial = $state(false);

	const maxDescriptionLength = 500;
	const descriptionLength = $derived(brandDescription.length);

	function addSocialAccount() {
		if (!newSocialUsername.trim()) {
			toast.error('Please enter a username');
			return;
		}

		// Check if platform already added
		if (socialMediaAccounts.find(acc => acc.platform === newSocialPlatform)) {
			toast.error('This platform is already added');
			return;
		}

		// Generate URL based on platform
		let url = '';
		switch (newSocialPlatform) {
			case 'instagram':
				url = `https://instagram.com/${newSocialUsername.replace('@', '')}`;
				break;
			case 'tiktok':
				url = `https://tiktok.com/@${newSocialUsername.replace('@', '')}`;
				break;
			case 'facebook':
				url = `https://facebook.com/${newSocialUsername}`;
				break;
			case 'twitter':
				url = `https://x.com/${newSocialUsername.replace('@', '')}`;
				break;
			case 'youtube':
				url = `https://youtube.com/@${newSocialUsername}`;
				break;
			case 'pinterest':
				url = `https://pinterest.com/${newSocialUsername}`;
				break;
			case 'website':
				url = newSocialUsername.startsWith('http') ? newSocialUsername : `https://${newSocialUsername}`;
				break;
		}

		socialMediaAccounts = [...socialMediaAccounts, {
			platform: newSocialPlatform,
			username: newSocialUsername,
			url
		}];

		newSocialUsername = '';
		showAddSocial = false;
		toast.success('Social media account added');
	}

	function removeSocialAccount(index: number) {
		socialMediaAccounts = socialMediaAccounts.filter((_, i) => i !== index);
	}

	function getPlatformIcon(platform: string) {
		return socialPlatforms.find(p => p.id === platform)?.icon || '🔗';
	}
</script>

<div class="space-y-6">
	<div class="text-center mb-8">
		<h2 class="text-3xl font-bold text-gray-900 mb-3">Brand Information</h2>
		<p class="text-lg text-gray-600 max-w-2xl mx-auto">
			Tell us about your brand. This information will be reviewed by our team for verification.
		</p>
	</div>

	<div class="space-y-6 max-w-2xl mx-auto">
		<!-- Brand Name -->
		<div>
			<label for="brandName" class="block text-sm font-medium text-gray-700 mb-2">
				<div class="flex items-center gap-2">
					<Building2 class="w-4 h-4" />
					Brand Name <span class="text-red-500">*</span>
				</div>
			</label>
			<input
				id="brandName"
				type="text"
				bind:value={brandName}
				placeholder="Enter your official brand name"
				class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
					focus:ring-purple-500 focus:border-transparent transition-all duration-200"
				maxlength="100"
			/>
			<p class="mt-1 text-xs text-gray-500">
				Use your registered business name or brand name
			</p>
		</div>

		<!-- Brand Category -->
		<div>
			<label for="brandCategory" class="block text-sm font-medium text-gray-700 mb-2">
				<div class="flex items-center gap-2">
					<Tag class="w-4 h-4" />
					Brand Category <span class="text-red-500">*</span>
				</div>
			</label>
			<select
				id="brandCategory"
				bind:value={brandCategory}
				class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
					focus:ring-purple-500 focus:border-transparent transition-all duration-200"
			>
				<option value="">Select a category</option>
				{#each brandCategories as category}
					<option value={category}>{category}</option>
				{/each}
			</select>
		</div>

		<!-- Brand Description -->
		<div>
			<label for="brandDescription" class="block text-sm font-medium text-gray-700 mb-2">
				<div class="flex items-center gap-2">
					<FileText class="w-4 h-4" />
					Brand Description
				</div>
			</label>
			<textarea
				id="brandDescription"
				bind:value={brandDescription}
				placeholder="Tell us about your brand story, values, and what makes you unique..."
				rows="4"
				maxlength={maxDescriptionLength}
				class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
					focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
			></textarea>
			<div class="mt-1 flex justify-between text-xs text-gray-500">
				<span>Share your brand's story and values</span>
				<span>{descriptionLength}/{maxDescriptionLength}</span>
			</div>
		</div>

		<!-- Social Media Accounts -->
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-2">
				<div class="flex items-center gap-2">
					<Link2 class="w-4 h-4" />
					Social Media Accounts
				</div>
			</label>
			
			{#if socialMediaAccounts.length > 0}
				<div class="space-y-2 mb-4">
					{#each socialMediaAccounts as account, index}
						<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
							<span class="text-xl">{getPlatformIcon(account.platform)}</span>
							<div class="flex-1">
								<p class="font-medium text-gray-900 capitalize">{account.platform}</p>
								<p class="text-sm text-gray-600">@{account.username}</p>
							</div>
							<button
								onclick={() => removeSocialAccount(index)}
								class="p-1 hover:bg-gray-200 rounded transition-colors"
							>
								<X class="w-4 h-4 text-gray-500" />
							</button>
						</div>
					{/each}
				</div>
			{/if}

			{#if showAddSocial}
				<div class="p-4 border border-gray-200 rounded-lg space-y-3">
					<div class="grid grid-cols-2 gap-3">
						<select
							bind:value={newSocialPlatform}
							class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 
								focus:ring-purple-500 focus:border-transparent"
						>
							{#each socialPlatforms as platform}
								<option value={platform.id}>
									{platform.icon} {platform.name}
								</option>
							{/each}
						</select>
						<input
							type="text"
							bind:value={newSocialUsername}
							placeholder={socialPlatforms.find(p => p.id === newSocialPlatform)?.placeholder}
							class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 
								focus:ring-purple-500 focus:border-transparent"
							onkeydown={(e) => e.key === 'Enter' && addSocialAccount()}
						/>
					</div>
					<div class="flex gap-2">
						<button
							onclick={handleAddSocialAccount}
							class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 
								transition-colors text-sm font-medium"
						>
							Add Account
						</button>
						<button
							onclick={() => {
								showAddSocial = false;
								newSocialUsername = '';
							}}
							class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
						>
							Cancel
						</button>
					</div>
				</div>
			{:else}
				<button
					onclick={() => showAddSocial = true}
					class="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg
						hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
				>
					<Plus class="w-4 h-4" />
					Add Social Media Account
				</button>
			{/if}
			
			<p class="mt-2 text-xs text-gray-500">
				Connect your social media to verify your brand identity
			</p>
		</div>

		<!-- Verification Notice -->
		<div class="mt-8 p-4 bg-purple-50 border border-purple-200 rounded-lg">
			<div class="flex gap-3">
				<ShieldCheck class="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
				<div class="text-sm">
					<p class="font-medium text-purple-900 mb-2">Verification Process</p>
					<ul class="space-y-1 text-purple-800">
						<li>• Our team will review your brand information</li>
						<li>• We'll verify your social media accounts</li>
						<li>• Approval typically takes 1-2 business days</li>
						<li>• You'll receive an email once verified</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</div>