<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { 
		LayoutDashboard, 
		Building2, 
		Users, 
		Package, 
		FileText, 
		Settings,
		LogOut,
		Shield,
		TrendingUp,
		AlertCircle
	} from 'lucide-svelte';
	import { Toaster } from 'svelte-sonner';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();

	const navigation = [
		{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
		{ name: 'Brand Approvals', href: '/dashboard/brands', icon: Building2 },
		{ name: 'Users', href: '/dashboard/users', icon: Users },
		{ name: 'Listings', href: '/dashboard/listings', icon: Package },
		{ name: 'Reports', href: '/dashboard/reports', icon: FileText },
		{ name: 'Settings', href: '/dashboard/settings', icon: Settings }
	];

	// Check if current path matches nav item
	function isActive(href: string): boolean {
		if (href === '/dashboard') {
			return $page.url.pathname === '/dashboard';
		}
		return $page.url.pathname.startsWith(href);
	}

	async function handleLogout() {
		await data.supabase.auth.signOut();
		goto('/');
	}
</script>

<svelte:head>
	<title>Admin Dashboard | Driplo</title>
</svelte:head>

{#if !data.isAdmin}
	<!-- Not Authorized -->
	<div class="min-h-screen bg-gray-50 flex items-center justify-center">
		<div class="text-center">
			<Shield class="w-16 h-16 text-red-500 mx-auto mb-4" />
			<h1 class="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
			<p class="text-gray-600 mb-4">You don't have permission to access this area.</p>
			<a href="/" class="text-blue-600 hover:text-blue-700 font-medium">
				Return to Home
			</a>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-gray-100">
		<!-- Admin Header -->
		<header class="bg-white shadow-sm border-b">
			<div class="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
				<div class="flex items-center gap-4">
					<Shield class="w-8 h-8 text-blue-600" />
					<div>
						<h1 class="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
						<p class="text-xs text-gray-500">Manage your marketplace</p>
					</div>
				</div>

				<div class="flex items-center gap-4">
					<span class="text-sm text-gray-600">
						{data.profile?.full_name || data.user?.email}
					</span>
					<button
						onclick={handleLogout}
						class="p-2 text-gray-500 hover:text-gray-700 transition-colors"
						title="Logout"
					>
						<LogOut class="w-5 h-5" />
					</button>
				</div>
			</div>
		</header>

		<div class="flex h-[calc(100vh-4rem)]">
			<!-- Sidebar Navigation -->
			<nav class="w-64 bg-white shadow-sm">
				<div class="p-4 space-y-1">
					{#each navigation as item}
						<a
							href={item.href}
							class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
								{isActive(item.href)
									? 'bg-blue-50 text-blue-700 font-medium'
									: 'text-gray-700 hover:bg-gray-50'}"
						>
							<svelte:component this={item.icon} class="w-5 h-5" />
							<span>{item.name}</span>
							
							{#if item.name === 'Brand Approvals' && data.pendingBrands > 0}
								<span class="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
									{data.pendingBrands}
								</span>
							{/if}
						</a>
					{/each}
				</div>

				<!-- Admin Stats -->
				<div class="mt-8 p-4 border-t">
					<h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
						Quick Stats
					</h3>
					<div class="space-y-3">
						<div class="flex justify-between items-center">
							<span class="text-sm text-gray-600">Total Users</span>
							<span class="text-sm font-medium">{data.stats?.totalUsers || 0}</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-sm text-gray-600">Active Listings</span>
							<span class="text-sm font-medium">{data.stats?.activeListings || 0}</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-sm text-gray-600">Today's Sales</span>
							<span class="text-sm font-medium">${data.stats?.todaySales || 0}</span>
						</div>
					</div>
				</div>
			</nav>

			<!-- Main Content -->
			<main class="flex-1 overflow-y-auto">
				<div class="p-4 sm:p-6 lg:p-8">
					{@render children()}
				</div>
			</main>
		</div>
	</div>
{/if}

<Toaster position="top-right" />