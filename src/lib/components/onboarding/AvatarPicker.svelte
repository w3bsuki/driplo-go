<script lang="ts">
	import { RefreshCw, Upload, Sparkles, Check } from 'lucide-svelte';
	import Image from '$lib/components/ui/Image.svelte';
	import { toast } from 'svelte-sonner';

	interface Props {
		customAvatarUrl: string | null;
		userId: string;
	}

	let { customAvatarUrl = $bindable(null), userId }: Props = $props();

	const avatarStyles = [
		{
			id: 'avataaars',
			name: 'Avataaars',
			description: 'Cute cartoon style',
			preview: 'A friendly, customizable avatar'
		},
		{
			id: 'bottts',
			name: 'Bottts',
			description: 'Playful robot avatars',
			preview: 'Fun robotic characters'
		},
		{
			id: 'personas',
			name: 'Personas',
			description: 'Modern illustrated people',
			preview: 'Professional human avatars'
		},
		{
			id: 'micah',
			name: 'Micah',
			description: 'Contemporary art style',
			preview: 'Artistic modern avatars'
		},
		{
			id: 'notionists',
			name: 'Notionists',
			description: 'Abstract and unique',
			preview: 'Creative abstract faces'
		},
		{
			id: 'lorelei',
			name: 'Lorelei',
			description: 'Elegant portraits',
			preview: 'Sophisticated avatar style'
		}
	];

	let uploading = $state(false);
	let selectedStyle = $state('avataaars');
	let currentSeed = $state(userId);
	let previewSeeds = $state<Record<string, string>>({});

	// Generate preview seeds for each style
	$effect(() => {
		avatarStyles.forEach(style => {
			if (!previewSeeds[style.id]) {
				previewSeeds[style.id] = Math.random().toString(36).substring(7);
			}
		});
	});
	
	// Export current avatar URL for parent component
	export function getCurrentAvatarUrl(): string {
		return customAvatarUrl || getAvatarUrl(selectedStyle, currentSeed);
	}

	function getAvatarUrl(style: string, seed: string) {
		return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
	}

	function selectStyle(styleId: string) {
		selectedStyle = styleId;
		customAvatarUrl = null; // Clear custom avatar when selecting a style
		// Generate new seed when changing style
		if (currentSeed === userId) {
			generateNewSeed();
		}
	}

	function generateNewSeed() {
		currentSeed = Math.random().toString(36).substring(2, 15);
		customAvatarUrl = null; // Clear custom avatar when generating new seed
	}

	async function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		// Validate file type and size
		const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
		if (!validTypes.includes(file.type)) {
			toast.error('Please upload a JPG, PNG, or WebP image');
			return;
		}

		if (file.size > 5 * 1024 * 1024) { // 5MB limit
			toast.error('Image must be less than 5MB');
			return;
		}

		uploading = true;
		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('type', 'avatar');
			
			const response = await fetch('/api/upload/image', {
				method: 'POST',
				body: formData
			});
			
			if (!response.ok) {
				throw new Error('Upload failed');
			}
			
			const data = await response.json();
			customAvatarUrl = data.url;
			toast.success('Avatar uploaded successfully!');
		} catch (error: any) {
			toast.error(error.message || 'Failed to upload avatar');
		} finally {
			uploading = false;
		}
	}
</script>

<div class="space-y-6">
	<div class="text-center mb-8">
		<h2 class="text-3xl font-bold text-gray-900 mb-3">Choose Your Avatar</h2>
		<p class="text-lg text-gray-600 max-w-2xl mx-auto">
			Select an avatar style that represents you. You can always change it later in your profile settings.
		</p>
	</div>

	<!-- Current Avatar Preview -->
	<div class="flex flex-col items-center mb-8">
		<div class="relative group">
			<div class="w-32 h-32 rounded-full overflow-hidden ring-4 ring-blue-100 shadow-xl">
				{#if customAvatarUrl}
					<Image
						src={customAvatarUrl}
						alt="Custom avatar"
						class="w-full h-full object-cover"
					/>
				{:else}
					<img 
						src={getAvatarUrl(selectedStyle, currentSeed)} 
						alt="Avatar preview" 
						class="w-full h-full"
					/>
				{/if}
			</div>
			{#if !customAvatarUrl}
				<button
					onclick={handleGenerateNewSeed}
					class="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-md
						hover:shadow-lg transition-all duration-200 group-hover:scale-110"
					title="Generate new avatar"
				>
					<RefreshCw class="w-4 h-4 text-gray-600" />
				</button>
			{/if}
		</div>
		<p class="mt-3 text-sm text-gray-600 font-medium">Your Avatar</p>
	</div>

	<!-- Avatar Style Grid -->
	<div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
		{#each avatarStyles as style}
			{@const isSelected = selectedStyle === style.id && !customAvatarUrl}
			<button
				onclick={() => selectStyle(style.id)}
				class="relative p-4 rounded-xl border-2 transition-all duration-200 group
					{isSelected 
						? 'border-blue-500 bg-blue-50 shadow-md' 
						: 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'}"
			>
				{#if isSelected}
					<div class="absolute top-2 right-2">
						<div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
							<Check class="w-4 h-4 text-white" />
						</div>
					</div>
				{/if}

				<div class="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden ring-2 
					{isSelected ? 'ring-blue-200' : 'ring-gray-100'}">
					<img 
						src={getAvatarUrl(style.id, previewSeeds[style.id] || 'preview')} 
						alt="{style.name} style"
						class="w-full h-full"
					/>
				</div>
				<h3 class="font-medium text-gray-900 mb-1">{style.name}</h3>
				<p class="text-xs text-gray-600">{style.description}</p>
			</button>
		{/each}
	</div>

	<!-- Custom Upload Option -->
	<div class="relative">
		<div class="absolute inset-0 flex items-center">
			<div class="w-full border-t border-gray-200"></div>
		</div>
		<div class="relative flex justify-center text-sm">
			<span class="px-4 bg-white text-gray-500">or</span>
		</div>
	</div>

	<div class="mt-6">
		<label 
			for="avatar-upload"
			class="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 
				border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 
				transition-colors duration-200"
		>
			<div class="flex flex-col items-center justify-center pt-5 pb-6">
				{#if uploading}
					<div class="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
					<p class="text-sm text-gray-600">Uploading...</p>
				{:else}
					<Upload class="w-8 h-8 mb-2 text-gray-400" />
					<p class="mb-2 text-sm text-gray-600">
						<span class="font-medium">Click to upload</span> your own avatar
					</p>
					<p class="text-xs text-gray-500">PNG, JPG or WebP (MAX. 5MB)</p>
				{/if}
			</div>
			<input 
				id="avatar-upload" 
				type="file" 
				class="hidden" 
				accept="image/*"
				onchange={handleFileUpload}
				disabled={uploading}
			/>
		</label>
	</div>

	{#if customAvatarUrl}
		<div class="p-4 bg-green-50 border border-green-200 rounded-lg">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
					<Check class="w-5 h-5 text-green-600" />
				</div>
				<div class="flex-1">
					<p class="font-medium text-green-900">Custom avatar uploaded!</p>
					<p class="text-sm text-green-700">You can change it anytime from your profile settings.</p>
				</div>
				<button
					onclick={() => customAvatarUrl = null}
					class="text-sm text-green-600 hover:text-green-700 font-medium"
				>
					Remove
				</button>
			</div>
		</div>
	{/if}

	<!-- Fun Facts -->
	<div class="mt-8 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
		<div class="flex gap-3">
			<Sparkles class="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
			<div class="text-sm">
				<p class="font-medium text-gray-900 mb-1">Did you know?</p>
				<p class="text-gray-700">
					Your avatar helps build trust with other users. Profiles with avatars get 3x more 
					engagement than those without!
				</p>
			</div>
		</div>
	</div>
</div>