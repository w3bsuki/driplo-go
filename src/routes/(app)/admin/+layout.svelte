<script lang="ts">
	import { page } from '$app/stores'
	import { Home, Users, ShoppingBag, Settings, Shield, BarChart } from 'lucide-svelte'
	
	const navItems = [
		{ href: '/admin', label: 'Dashboard', icon: Home },
		{ href: '/admin/users', label: 'Users', icon: Users },
		{ href: '/admin/brands', label: 'Brand Verification', icon: Shield },
		{ href: '/admin/listings', label: 'Listings', icon: ShoppingBag },
		{ href: '/admin/analytics', label: 'Analytics', icon: BarChart },
		{ href: '/admin/settings', label: 'Settings', icon: Settings }
	]
</script>

<div class="min-h-screen bg-gray-50">
	<div class="flex">
		<!-- Sidebar -->
		<nav class="w-64 bg-white shadow-lg h-screen sticky top-0">
			<div class="p-6">
				<h2 class="text-2xl font-bold text-gray-900">Admin Panel</h2>
			</div>
			<div class="px-4">
				{#each navItems as item}
					<a
						href={item.href}
						class="flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors {$page.url.pathname === item.href
							? 'bg-blue-600 text-white'
							: 'text-gray-700 hover:bg-gray-100'}"
					>
						<svelte:component this={item.icon} class="w-5 h-5" />
						<span class="font-medium">{item.label}</span>
					</a>
				{/each}
			</div>
		</nav>
		
		<!-- Main content -->
		<main class="flex-1 p-8">
			<slot />
		</main>
	</div>
</div>