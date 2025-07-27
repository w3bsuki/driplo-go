<script lang="ts">
	import { onMount } from 'svelte'
	import { handleStreamedData } from '$lib/utils/streaming'
	import type { DashboardStats, StreamedData } from '$lib/utils/streaming'
	
	export let streamedDashboard: StreamedData<DashboardStats>
	
	let stats = $state<DashboardStats>({
		quickCounts: {},
		detailedData: {}
	})
	
	let loading = $state(true)
	let error = $state<Error | null>(null)
	
	onMount(() => {
		handleStreamedData(
			streamedDashboard,
			(data) => {
				stats = data
				loading = false
			},
			(err) => {
				error = err
				loading = false
			}
		)
	})
</script>

<div class="dashboard-container">
	<!-- Quick stats display immediately -->
	<div class="stats-grid">
		<div class="stat-card">
			<h3>Total Users</h3>
			<p class="stat-value">{stats.quickCounts.totalUsers ?? '—'}</p>
		</div>
		<div class="stat-card">
			<h3>Active Listings</h3>
			<p class="stat-value">{stats.quickCounts.activeListings ?? '—'}</p>
		</div>
		<div class="stat-card">
			<h3>Verified Brands</h3>
			<p class="stat-value">{stats.quickCounts.verifiedBrands ?? '—'}</p>
		</div>
		<div class="stat-card">
			<h3>Monthly Revenue</h3>
			<p class="stat-value">
				{#if stats.detailedData.monthlyRevenue !== undefined}
					£{stats.detailedData.monthlyRevenue.toLocaleString()}
				{:else}
					<span class="loading-placeholder">Loading...</span>
				{/if}
			</p>
		</div>
	</div>
	
	<!-- Detailed sections stream in -->
	<div class="detailed-sections">
		{#if stats.detailedData.pendingBrands}
			<section class="pending-brands">
				<h2>Pending Brand Verifications</h2>
				<div class="brands-list">
					{#each stats.detailedData.pendingBrands as request}
						<div class="brand-request">
							<img src={request.profile?.avatar_url || '/default-avatar.png'} alt={request.profile?.username}>
							<div>
								<h4>{request.profile?.full_name || request.profile?.username}</h4>
								<p>Submitted {new Date(request.submitted_at).toLocaleDateString()}</p>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{:else}
			<section class="pending-brands skeleton">
				<h2>Pending Brand Verifications</h2>
				<div class="skeleton-loader">Loading...</div>
			</section>
		{/if}
		
		{#if stats.detailedData.topSellers}
			<section class="top-sellers">
				<h2>Top Sellers</h2>
				<div class="sellers-grid">
					{#each stats.detailedData.topSellers as seller}
						<div class="seller-card">
							<img src={seller.avatar_url || '/default-avatar.png'} alt={seller.username}>
							<h4>{seller.shop_name || seller.username}</h4>
							<p>{seller.total_orders} sales</p>
							<p>⭐ {seller.seller_rating?.toFixed(1) || '—'}</p>
						</div>
					{/each}
				</div>
			</section>
		{:else}
			<section class="top-sellers skeleton">
				<h2>Top Sellers</h2>
				<div class="skeleton-loader">Loading...</div>
			</section>
		{/if}
		
		{#if stats.detailedData.popularProducts}
			<section class="popular-products">
				<h2>Trending Products</h2>
				<div class="products-grid">
					{#each stats.detailedData.popularProducts as product}
						<div class="product-card">
							<img src={product.images?.[0] || '/placeholder.jpg'} alt={product.title}>
							<h4>{product.title}</h4>
							<p>£{product.price}</p>
							<p>{product.order_count} sold</p>
						</div>
					{/each}
				</div>
			</section>
		{:else}
			<section class="popular-products skeleton">
				<h2>Trending Products</h2>
				<div class="skeleton-loader">Loading...</div>
			</section>
		{/if}
	</div>
	
	{#if error}
		<div class="error-message">
			Error loading dashboard data: {error.message}
		</div>
	{/if}
</div>

<style>
	.dashboard-container {
		padding: 2rem;
	}
	
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
		margin-bottom: 3rem;
	}
	
	.stat-card {
		background: var(--color-surface-primary);
		padding: 1.5rem;
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-sm);
	}
	
	.stat-card h3 {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		margin-bottom: 0.5rem;
	}
	
	.stat-value {
		font-size: 2rem;
		font-weight: 600;
		color: var(--color-text-primary);
	}
	
	.loading-placeholder {
		color: var(--color-text-placeholder);
		font-size: 1rem;
		animation: pulse 2s infinite;
	}
	
	.detailed-sections {
		display: grid;
		gap: 2rem;
	}
	
	section {
		background: var(--color-surface-primary);
		padding: 1.5rem;
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-sm);
	}
	
	section h2 {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1rem;
	}
	
	.skeleton .skeleton-loader {
		height: 100px;
		background: linear-gradient(90deg, var(--color-gray-100) 25%, var(--color-gray-200) 50%, var(--color-gray-100) 75%);
		background-size: 200% 100%;
		animation: loading 1.5s infinite;
		border-radius: var(--radius-xs);
	}
	
	.brands-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.brand-request {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		border: 1px solid var(--color-border-primary);
		border-radius: var(--radius-sm);
	}
	
	.brand-request img {
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		object-fit: cover;
	}
	
	.sellers-grid,
	.products-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 1rem;
	}
	
	.seller-card,
	.product-card {
		text-align: center;
		padding: 1rem;
		border: 1px solid var(--color-border-primary);
		border-radius: var(--radius-sm);
	}
	
	.seller-card img,
	.product-card img {
		width: 4rem;
		height: 4rem;
		border-radius: 50%;
		object-fit: cover;
		margin: 0 auto 0.5rem;
	}
	
	.product-card img {
		border-radius: var(--radius-sm);
	}
	
	.error-message {
		background: var(--color-error-50);
		color: var(--color-error-600);
		padding: 1rem;
		border-radius: var(--radius-sm);
		margin-top: 1rem;
	}
	
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
	
	@keyframes loading {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>