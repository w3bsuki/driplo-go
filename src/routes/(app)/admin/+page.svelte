<script lang="ts">
	import { Users, ShoppingBag, Package, Shield } from 'lucide-svelte'
	import type { PageData } from './$types'
	
	interface Props {
		data: PageData
	}
	
	let { data }: Props = $props()
	
	const statCards = [
		{ label: 'Total Users', value: data.stats.totalUsers, icon: Users, color: 'blue' },
		{ label: 'Total Listings', value: data.stats.totalListings, icon: ShoppingBag, color: 'green' },
		{ label: 'Total Orders', value: data.stats.totalOrders, icon: Package, color: 'purple' },
		{ label: 'Pending Verifications', value: data.stats.pendingVerifications, icon: Shield, color: 'orange' }
	]
</script>

<div>
	<h1 class="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
	
	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
		{#each statCards as stat}
			<div class="bg-white rounded-lg shadow p-6">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600">{stat.label}</p>
						<p class="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
					</div>
					<div class="bg-{stat.color}-100 p-3 rounded-lg">
						<svelte:component this={stat.icon} class="w-6 h-6 text-{stat.color}-600" />
					</div>
				</div>
			</div>
		{/each}
	</div>
	
	<!-- Recent Activity -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Recent Users -->
		<div class="bg-white rounded-lg shadow">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-lg font-semibold text-gray-900">Recent Users</h2>
			</div>
			<div class="p-6">
				{#if data.recentUsers.length > 0}
					<div class="space-y-4">
						{#each data.recentUsers as user}
							<div class="flex items-center justify-between">
								<div>
									<p class="font-medium text-gray-900">{user.username || 'No username'}</p>
									<p class="text-sm text-gray-600">{user.email}</p>
								</div>
								<p class="text-sm text-gray-500">
									{new Date(user.created_at).toLocaleDateString()}
								</p>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-gray-500">No recent users</p>
				{/if}
			</div>
		</div>
		
		<!-- Recent Orders -->
		<div class="bg-white rounded-lg shadow">
			<div class="px-6 py-4 border-b border-gray-200">
				<h2 class="text-lg font-semibold text-gray-900">Recent Orders</h2>
			</div>
			<div class="p-6">
				{#if data.recentOrders.length > 0}
					<div class="space-y-4">
						{#each data.recentOrders as order}
							<div class="flex items-center justify-between">
								<div>
									<p class="font-medium text-gray-900">Order #{order.id.slice(-6)}</p>
									<p class="text-sm text-gray-600">${order.total_amount}</p>
								</div>
								<span class="px-2 py-1 text-xs font-medium rounded-full bg-{order.status === 'completed' ? 'green' : 'yellow'}-100 text-{order.status === 'completed' ? 'green' : 'yellow'}-800">
									{order.status}
								</span>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-gray-500">No recent orders</p>
				{/if}
			</div>
		</div>
	</div>
</div>