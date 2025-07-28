<script lang="ts">
	import { page } from '$app/stores'
	import { Home, Users, ShoppingBag, Settings, Shield, BarChart } from 'lucide-svelte'
	
	let { children } = $props();
	
	const navItems = [
		{ href: '/admin', label: 'Dashboard', icon: Home },
		{ href: '/admin/users', label: 'Users', icon: Users },
		{ href: '/admin/brands', label: 'Brand Verification', icon: Shield },
		{ href: '/admin/listings', label: 'Listings', icon: ShoppingBag },
		{ href: '/admin/analytics', label: 'Analytics', icon: BarChart },
		{ href: '/admin/settings', label: 'Settings', icon: Settings }
	]
</script>

<div class="min-h-screen bg-background">
	<div class="flex">
		<!-- Sidebar -->
		<nav class="w-64 bg-card shadow-lg h-screen sticky top-0">
			<div class="p-6">
				<h2 class="text-2xl font-bold text-foreground">Admin Panel</h2>
			</div>
			<div class="px-4">
				{#each navItems as item}
					{@const Icon = item.icon}
					<a
						href={item.href}
						class="flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors {$page.url.pathname === item.href
							? 'bg-primary text-primary-foreground'
							: 'text-foreground hover:bg-muted'}"
					>
						<Icon class="w-5 h-5" />
						<span class="font-medium">{item.label}</span>
					</a>
				{/each}
			</div>
		</nav>
		
		<!-- Main content -->
		<main class="flex-1 p-8 bg-background">
			{@render children?.()}
		</main>
	</div>
</div>