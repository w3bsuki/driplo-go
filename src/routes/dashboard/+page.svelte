<script lang="ts">
	import { 
		Users, 
		Package, 
		DollarSign, 
		TrendingUp,
		Building2,
		ShieldCheck,
		AlertCircle,
		Clock
	} from 'lucide-svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData
	}

	let { data }: Props = $props();

	const stats = [
		{
			name: 'Total Users',
			value: data.stats.totalUsers.toLocaleString(),
			change: '+12%',
			changeType: 'positive',
			icon: Users,
			color: 'blue'
		},
		{
			name: 'Active Listings',
			value: data.stats.activeListings.toLocaleString(),
			change: '+5%',
			changeType: 'positive',
			icon: Package,
			color: 'green'
		},
		{
			name: 'Verified Brands',
			value: data.stats.verifiedBrands.toLocaleString(),
			change: '+23%',
			changeType: 'positive',
			icon: Building2,
			color: 'purple'
		},
		{
			name: 'Revenue (30d)',
			value: `$${data.stats.monthlyRevenue.toLocaleString()}`,
			change: '+18%',
			changeType: 'positive',
			icon: DollarSign,
			color: 'yellow'
		}
	];

	function getColorClasses(color: string) {
		const colors = {
			blue: 'bg-blue-100 text-blue-600',
			green: 'bg-green-100 text-green-600',
			purple: 'bg-purple-100 text-purple-600',
			yellow: 'bg-yellow-100 text-yellow-600'
		};
		return colors[color as keyof typeof colors] || colors.blue;
	}
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div>
		<h1 class="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
		<p class="text-gray-600 mt-1">Welcome back! Here's what's happening with your marketplace.</p>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
		{#each stats as stat}
			<div class="bg-white rounded-lg shadow-sm p-6">
				<div class="flex items-center justify-between mb-4">
					<div class={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
						<svelte:component this={stat.icon} class="w-6 h-6" />
					</div>
					<span class="text-sm font-medium {stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}">
						{stat.change}
					</span>
				</div>
				<h3 class="text-2xl font-bold text-gray-900">{stat.value}</h3>
				<p class="text-sm text-gray-600 mt-1">{stat.name}</p>
			</div>
		{/each}
	</div>

	<!-- Recent Activity -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Pending Brand Approvals -->
		<div class="bg-white rounded-lg shadow-sm">
			<div class="p-6 border-b">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-gray-900">Pending Brand Approvals</h2>
					{#if data.pendingBrands.length > 0}
						<span class="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full">
							{data.pendingBrands.length} pending
						</span>
					{/if}
				</div>
			</div>
			<div class="p-6">
				{#if data.pendingBrands.length === 0}
					<div class="text-center py-8">
						<ShieldCheck class="w-12 h-12 text-gray-400 mx-auto mb-3" />
						<p class="text-gray-500">No pending approvals</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each data.pendingBrands.slice(0, 5) as request}
							<div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
								<div>
									<h4 class="font-medium text-gray-900">{request.brand_name}</h4>
									<p class="text-sm text-gray-600">{request.brand_category}</p>
									<p class="text-xs text-gray-500 mt-1">
										<Clock class="w-3 h-3 inline mr-1" />
										{new Date(request.submitted_at).toLocaleDateString()}
									</p>
								</div>
								<a
									href="/dashboard/brands/{request.id}"
									class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg
										hover:bg-blue-700 transition-colors"
								>
									Review
								</a>
							</div>
						{/each}
						{#if data.pendingBrands.length > 5}
							<a 
								href="/dashboard/brands"
								class="block text-center text-blue-600 hover:text-blue-700 font-medium text-sm"
							>
								View all {data.pendingBrands.length} requests →
							</a>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<!-- Recent Reports -->
		<div class="bg-white rounded-lg shadow-sm">
			<div class="p-6 border-b">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-gray-900">Recent Reports</h2>
					{#if data.recentReports.length > 0}
						<span class="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-1 rounded-full">
							{data.recentReports.length} active
						</span>
					{/if}
				</div>
			</div>
			<div class="p-6">
				{#if data.recentReports.length === 0}
					<div class="text-center py-8">
						<AlertCircle class="w-12 h-12 text-gray-400 mx-auto mb-3" />
						<p class="text-gray-500">No active reports</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each data.recentReports as report}
							<div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
								<div>
									<h4 class="font-medium text-gray-900">{report.type}</h4>
									<p class="text-sm text-gray-600">{report.description}</p>
									<p class="text-xs text-gray-500 mt-1">
										Reported by @{report.reporter}
									</p>
								</div>
								<a
									href="/dashboard/reports/{report.id}"
									class="text-blue-600 hover:text-blue-700 font-medium text-sm"
								>
									View →
								</a>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Activity Chart Placeholder -->
	<div class="bg-white rounded-lg shadow-sm p-6">
		<h2 class="text-lg font-semibold text-gray-900 mb-4">Platform Activity (7 days)</h2>
		<div class="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
			<div class="text-center">
				<TrendingUp class="w-12 h-12 text-gray-400 mx-auto mb-3" />
				<p class="text-gray-500">Activity chart coming soon</p>
			</div>
		</div>
	</div>
</div>