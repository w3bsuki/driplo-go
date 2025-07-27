<script lang="ts">
	import { CheckCircle, Sparkles, Package, ShoppingBag, Users, TrendingUp, Clock } from 'lucide-svelte';
	import Confetti from '$lib/components/ui/Confetti.svelte';
	import Image from '$lib/components/ui/Image.svelte';

	interface Props {
		accountType: 'personal' | 'brand';
		fullName: string;
		avatarUrl: string | null;
	}

	let { accountType, fullName, avatarUrl }: Props = $props();

	const nextSteps = accountType === 'personal' ? [
		{
			icon: Package,
			title: 'List Your First Item',
			description: 'Start selling by listing your fashion items',
			action: 'Start Selling',
			href: '/sell'
		},
		{
			icon: ShoppingBag,
			title: 'Explore Fashion',
			description: 'Browse unique items from our community',
			action: 'Start Shopping',
			href: '/browse'
		},
		{
			icon: Users,
			title: 'Follow Sellers',
			description: 'Connect with your favorite fashion sellers',
			action: 'Discover Sellers',
			href: '/sellers'
		}
	] : [
		{
			icon: Clock,
			title: 'Verification Pending',
			description: 'Our team is reviewing your brand application',
			action: 'Learn More',
			href: '/help/brand-verification'
		},
		{
			icon: Package,
			title: 'Prepare Your Catalog',
			description: 'Get your products ready to list',
			action: 'Selling Guide',
			href: '/help/selling'
		},
		{
			icon: TrendingUp,
			title: 'Brand Success Tips',
			description: 'Learn how to grow your brand on Driplo',
			action: 'Read Tips',
			href: '/help/brand-success'
		}
	];

	function getDefaultAvatar() {
		return `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`;
	}
</script>

<div class="relative">
	<Confetti />
	
	<div class="text-center space-y-6">
		<!-- Success Icon & Avatar -->
		<div class="relative inline-block">
			<div class="w-32 h-32 rounded-full overflow-hidden ring-4 ring-green-100 shadow-xl mx-auto">
				{#if avatarUrl}
					<Image
						src={avatarUrl}
						alt="Your avatar"
						class="w-full h-full object-cover"
					/>
				{:else}
					<img src={getDefaultAvatar()} alt="Your avatar" class="w-full h-full" />
				{/if}
			</div>
			<div class="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
				<CheckCircle class="w-8 h-8 text-white" />
			</div>
		</div>

		<!-- Welcome Message -->
		<div>
			<h2 class="text-4xl font-bold text-gray-900 mb-3">
				Welcome to Driplo, {fullName}! 🎉
			</h2>
			<p class="text-xl text-gray-600 max-w-2xl mx-auto">
				{#if accountType === 'personal'}
					Your profile is all set up! You're ready to start buying and selling amazing fashion items.
				{:else}
					Your brand profile has been submitted for verification. We'll notify you once approved!
				{/if}
			</p>
		</div>

		{#if accountType === 'brand'}
			<!-- Brand Verification Timeline -->
			<div class="max-w-md mx-auto p-4 bg-purple-50 border border-purple-200 rounded-lg">
				<div class="flex items-center gap-3">
					<Clock class="w-5 h-5 text-purple-600" />
					<div class="text-left">
						<p class="font-medium text-purple-900">Verification Timeline</p>
						<p class="text-sm text-purple-700">
							We'll review your application within 1-2 business days
						</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Next Steps -->
		<div class="mt-12">
			<h3 class="text-lg font-semibold text-gray-900 mb-6">What's Next?</h3>
			<div class="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
				{#each nextSteps as step}
					<div class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
						<div class="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg 
							flex items-center justify-center mb-4 mx-auto">
							<svelte:component this={step.icon} class="w-6 h-6 text-blue-600" />
						</div>
						<h4 class="font-semibold text-gray-900 mb-2">{step.title}</h4>
						<p class="text-sm text-gray-600 mb-4">{step.description}</p>
						<a 
							href={step.href}
							class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 
								font-medium text-sm group"
						>
							{step.action}
							<span class="group-hover:translate-x-1 transition-transform">→</span>
						</a>
					</div>
				{/each}
			</div>
		</div>

		<!-- Achievement Unlocked -->
		<div class="mt-12 inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r 
			from-yellow-50 to-orange-50 border border-yellow-200 rounded-full">
			<Sparkles class="w-5 h-5 text-yellow-600" />
			<span class="font-medium text-yellow-800">
				Achievement Unlocked: Profile Pioneer!
			</span>
		</div>

		<!-- Quick Stats -->
		<div class="mt-8 grid grid-cols-3 gap-4 max-w-lg mx-auto">
			<div class="text-center">
				<p class="text-3xl font-bold text-gray-900">0</p>
				<p class="text-sm text-gray-600">Listings</p>
			</div>
			<div class="text-center">
				<p class="text-3xl font-bold text-gray-900">0</p>
				<p class="text-sm text-gray-600">Followers</p>
			</div>
			<div class="text-center">
				<p class="text-3xl font-bold text-gray-900">100%</p>
				<p class="text-sm text-gray-600">Profile Complete</p>
			</div>
		</div>
	</div>
</div>