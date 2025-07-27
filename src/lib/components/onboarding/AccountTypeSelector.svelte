<script lang="ts">
	import { User, Building2, CheckCircle2, ShieldCheck, TrendingUp, Globe } from 'lucide-svelte';

	interface Props {
		accountType: 'personal' | 'brand';
	}

	let { accountType = $bindable('personal') }: Props = $props();

	const accountTypes = [
		{
			value: 'personal' as const,
			title: 'Personal Account',
			description: 'Perfect for buying and selling your own fashion items',
			icon: User,
			features: [
				'Buy and sell personal items',
				'Build your seller reputation',
				'Simple and quick setup',
				'No verification required'
			],
			color: 'blue'
		},
		{
			value: 'brand' as const,
			title: 'Brand Account',
			description: 'For fashion brands, boutiques, and businesses',
			icon: Building2,
			features: [
				'Professional brand profile',
				'Social media integration',
				'Featured in Top Brands',
				'Analytics dashboard'
			],
			badge: 'Requires Verification',
			color: 'purple'
		}
	];
</script>

<div class="space-y-6">
	<div class="text-center mb-8">
		<h2 class="text-3xl font-bold text-gray-900 mb-3">Choose Your Account Type</h2>
		<p class="text-lg text-gray-600 max-w-2xl mx-auto">
			Select the type of account that best fits your needs. You can always upgrade later.
		</p>
	</div>

	<div class="grid md:grid-cols-2 gap-6">
		{#each accountTypes as type}
			{@const isSelected = accountType === type.value}
			<button
				onclick={() => accountType = type.value}
				class="relative text-left p-6 rounded-xl border-2 transition-all duration-300 group
					{isSelected 
						? `border-${type.color}-500 bg-${type.color}-50 shadow-lg` 
						: 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'}"
			>
				{#if type.badge}
					<span class="absolute top-4 right-4 px-3 py-1 text-xs font-medium rounded-full
						bg-purple-100 text-purple-700">
						{type.badge}
					</span>
				{/if}

				<div class="flex items-start gap-4 mb-4">
					<div class="p-3 rounded-lg {isSelected ? `bg-${type.color}-100` : 'bg-gray-100'} 
						group-hover:scale-110 transition-transform duration-200">
						<svelte:component 
							this={type.icon} 
							class="w-6 h-6 {isSelected ? `text-${type.color}-600` : 'text-gray-600'}"
						/>
					</div>
					<div class="flex-1">
						<h3 class="text-xl font-semibold text-gray-900 mb-1">{type.title}</h3>
						<p class="text-gray-600">{type.description}</p>
					</div>
				</div>

				<ul class="space-y-2 mb-4">
					{#each type.features as feature}
						<li class="flex items-center gap-2 text-sm">
							<CheckCircle2 class="w-4 h-4 {isSelected ? `text-${type.color}-600` : 'text-gray-400'}" />
							<span class="{isSelected ? 'text-gray-900' : 'text-gray-600'}">{feature}</span>
						</li>
					{/each}
				</ul>

				{#if isSelected}
					<div class="absolute top-4 left-4">
						<div class="w-6 h-6 bg-{type.color}-500 rounded-full flex items-center justify-center">
							<CheckCircle2 class="w-4 h-4 text-white" />
						</div>
					</div>
				{/if}
			</button>
		{/each}
	</div>

	{#if accountType === 'brand'}
		<div class="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
			<div class="flex gap-3">
				<ShieldCheck class="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
				<div class="text-sm">
					<p class="font-medium text-purple-900 mb-1">Brand Verification Required</p>
					<p class="text-purple-700">
						To maintain marketplace quality, brand accounts require verification through social media 
						authentication and manual approval by our team. This typically takes 1-2 business days.
					</p>
				</div>
			</div>
		</div>
	{/if}

	<div class="grid grid-cols-3 gap-4 pt-6 border-t">
		<div class="text-center">
			<div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
				<Globe class="w-6 h-6 text-gray-600" />
			</div>
			<p class="text-sm font-medium text-gray-900">Global Reach</p>
			<p class="text-xs text-gray-600">Connect with fashion lovers worldwide</p>
		</div>
		<div class="text-center">
			<div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
				<ShieldCheck class="w-6 h-6 text-gray-600" />
			</div>
			<p class="text-sm font-medium text-gray-900">Secure Platform</p>
			<p class="text-xs text-gray-600">Safe and trusted transactions</p>
		</div>
		<div class="text-center">
			<div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
				<TrendingUp class="w-6 h-6 text-gray-600" />
			</div>
			<p class="text-sm font-medium text-gray-900">Grow Your Business</p>
			<p class="text-xs text-gray-600">Tools to help you succeed</p>
		</div>
	</div>
</div>