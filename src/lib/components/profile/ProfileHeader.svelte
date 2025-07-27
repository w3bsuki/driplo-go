<script lang="ts">
	import { Badge } from '$lib/components/ui'
	import { Button } from '$lib/components/ui'
	import BrandBadge from '$lib/components/ui/BrandBadge.svelte'
	import { Camera, MapPin, Calendar, ExternalLink, MessageCircle, UserPlus, UserMinus, Award, Star, Building2 } from 'lucide-svelte'
	import type { Profile } from '$lib/types/unified'
	import { getAchievementIcon, getAchievementColor } from '$lib/data/achievements'
	import * as m from '$lib/paraglide/messages.js'
	
	interface Props {
		profile: Profile
		isOwnProfile?: boolean
		isFollowing?: boolean
		onFollow?: () => void
		onMessage?: () => void
		onEditProfile?: () => void
	}
	
	let { 
		profile, 
		isOwnProfile = false, 
		isFollowing = false,
		onFollow,
		onMessage,
		onEditProfile
	}: Props = $props()
	
	// Calculate profile completion percentage
	const completionScore = $derived(calculateCompletionScore(profile))
	
	function calculateCompletionScore(profile: Profile): number {
		let score = 0
		const fields = [
			profile.avatar_url,
			profile.cover_url,
			profile.bio,
			profile.location,
			profile.full_name,
			profile.verification_badges?.length > 0,
			Object.keys(profile.social_links || {}).length > 0
		]
		
		fields.forEach(field => {
			if (field) score += 100 / fields.length
		})
		
		return Math.round(score)
	}
	
	function formatJoinDate(dateString: string): string {
		const date = new Date(dateString)
		return date.toLocaleDateString('en-US', { 
			month: 'long', 
			year: 'numeric' 
		})
	}
	
	function getVerificationBadges(badges: any): string[] {
		if (!badges) return []
		if (Array.isArray(badges)) {
			return badges.filter(badge => ['email', 'phone', 'id', 'business', 'verified', 'admin'].includes(badge))
		}
		return []
	}
</script>

<!-- Mobile-First Profile Header -->
<div class="bg-white rounded-b-3xl shadow-sm overflow-hidden">
	<!-- Cover Image with Blue Gradient -->
	<div class="relative h-32 sm:h-40 md:h-48 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
		{#if profile.cover_url}
			<img 
				src={profile.cover_url} 
				alt="Cover" 
				class="w-full h-full object-cover opacity-90"
			/>
			<div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
		{:else}
			<div class="absolute inset-0">
				<div class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-10"></div>
			</div>
		{/if}
		
		{#if isOwnProfile}
			<button 
				class="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-2 rounded-full transition-all"
				onclick={onEditProfile}
			>
				<Camera class="w-4 h-4" />
			</button>
		{/if}
	</div>
	
	<!-- Profile Content -->
	<div class="px-4 sm:px-6 pb-4 sm:pb-6">
		<!-- Avatar and Actions Row -->
		<div class="flex items-end justify-between -mt-12 sm:-mt-16 mb-3 sm:mb-4">
			<!-- Avatar -->
			<div class="relative">
				<img 
					src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} 
					alt={profile.username}
					class="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-md bg-white object-cover"
				/>
				
				{#if profile.seller_rating >= 4.5 && profile.seller_rating_count >= 5}
					<div class="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-1.5 rounded-full shadow-lg">
						<Star class="w-3 h-3 fill-current" />
					</div>
				{/if}
			</div>
			
			<!-- Action Buttons -->
			<div class="flex gap-2">
				{#if isOwnProfile}
					<Button
						variant="outline"
						size="sm"
						class="text-xs sm:text-sm border-blue-500 text-blue-600 hover:bg-blue-50"
						onclick={onEditProfile}
					>
						{m.profile_header_edit()}
					</Button>
					{#if profile.account_type !== 'brand'}
						<Button
							variant="default"
							size="sm"
							class="text-xs sm:text-sm bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
							onclick={() => window.location.href = '/brands/settings'}
						>
							<Building2 class="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
							<span class="hidden sm:inline">Turn into Brand</span>
							<span class="sm:hidden">Brand</span>
						</Button>
					{/if}
				{:else}
					<Button
						size="sm"
						variant={isFollowing ? 'outline' : 'default'}
						class={isFollowing 
							? 'text-xs sm:text-sm border-gray-300' 
							: 'text-xs sm:text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
						}
						onclick={onFollow}
					>
						{#if isFollowing}
							<UserMinus class="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
							{m.profile_header_following()}
						{:else}
							<UserPlus class="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
							{m.profile_header_follow()}
						{/if}
					</Button>
					<Button
						size="sm"
						variant="outline"
						class="text-xs sm:text-sm border-gray-300"
						onclick={onMessage}
					>
						<MessageCircle class="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
						<span class="hidden sm:inline">{m.profile_header_message()}</span>
					</Button>
				{/if}
			</div>
		</div>
		
		<!-- Name and Username -->
		<div class="mb-3">
			<h1 class="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
				{profile.full_name || profile.username}
				{#if profile.account_type === 'brand'}
					<BrandBadge size="sm" isVerified={profile.is_verified} showText={true} />
				{:else if getVerificationBadges(profile.verification_badges).length > 0}
					<span class="inline-flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full">
						<svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
							<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
						</svg>
					</span>
				{/if}
			</h1>
			<p class="text-sm sm:text-base text-gray-600">@{profile.username}</p>
		</div>
		
		<!-- Stats Grid - Mobile Optimized -->
		<div class="grid grid-cols-3 gap-3 mb-4 text-center">
			<div class="bg-blue-50 rounded-xl p-3">
				<div class="text-lg sm:text-xl font-bold text-gray-900">{profile.followers_count}</div>
				<div class="text-xs text-gray-600">{m.profile_header_followers()}</div>
			</div>
			<div class="bg-blue-50 rounded-xl p-3">
				<div class="text-lg sm:text-xl font-bold text-gray-900">{profile.following_count}</div>
				<div class="text-xs text-gray-600">{m.profile_header_following_count()}</div>
			</div>
			<div class="bg-blue-50 rounded-xl p-3">
				<div class="text-lg sm:text-xl font-bold text-gray-900">{profile.listings_count}</div>
				<div class="text-xs text-gray-600">{m.profile_header_listings_count()}</div>
			</div>
		</div>
		
		<!-- Bio -->
		{#if profile.bio}
			<p class="text-sm text-gray-700 mb-3 leading-relaxed">{profile.bio}</p>
		{/if}
		
		<!-- Info Pills -->
		<div class="flex flex-wrap gap-2 text-xs">
			{#if profile.location}
				<div class="flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
					<MapPin class="w-3 h-3" />
					<span>{profile.location}</span>
				</div>
			{/if}
			<div class="flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
				<Calendar class="w-3 h-3" />
				<span>{m.profile_header_joined({ date: formatJoinDate(profile.member_since) })}</span>
			</div>
			{#if profile.seller_rating > 0}
				<div class="flex items-center gap-1 text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-medium">
					<Star class="w-3 h-3 fill-current" />
					<span>{profile.seller_rating.toFixed(1)}</span>
				</div>
			{/if}
		</div>
		
		<!-- Achievements Preview -->
		{#if profile.achievements?.length > 0}
			<div class="mt-4 flex gap-2 overflow-x-auto pb-2">
				{#each profile.achievements.slice(0, 5) as achievement}
					<div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
						<Award class="w-5 h-5 text-white" />
					</div>
				{/each}
				{#if profile.achievements.length > 5}
					<div class="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
						+{profile.achievements.length - 5}
					</div>
				{/if}
			</div>
		{/if}
		
		<!-- Profile Completion (Own Profile Only) -->
		{#if isOwnProfile && completionScore < 100}
			<div class="mt-4 bg-blue-50 rounded-xl p-3">
				<div class="flex items-center justify-between mb-2">
					<span class="text-sm font-medium text-gray-700">{m.profile_header_completion()}</span>
					<span class="text-sm font-bold text-blue-600">{completionScore}%</span>
				</div>
				<div class="w-full bg-blue-200 rounded-full h-2">
					<div 
						class="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
						style="width: {completionScore}%"
					></div>
				</div>
			</div>
		{/if}
	</div>
</div>