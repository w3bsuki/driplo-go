<script lang="ts">
	import { goto } from '$app/navigation'
	import { getAuthContext } from '$lib/stores/auth-context.svelte'
	import CreateListingForm from '$lib/components/listings/CreateListingForm/CreateListingForm.svelte'
	import { onMount } from 'svelte'
	import * as m from '$lib/paraglide/messages.js'
	import { page } from '$app/stores'
	import type { PageData } from './$types'
	
	let { data }: { data: PageData } = $props()
	
	// Get auth context
	const authContext = getAuthContext()
	
	onMount(() => {
		// Double-check auth on mount
		if (!authContext?.user) {
			goto('/login?redirect=/sell')
		}
	})
</script>

<svelte:head>
	<title>{m.sell_page_title()}</title>
	<meta name="description" content={m.sell_page_description()} />
</svelte:head>

{#if authContext?.user && data.user}
	<CreateListingForm 
		data={data.form} 
		categories={data.categories}
		hasPaymentAccount={data.hasPaymentAccount}
	/>
{:else}
	<div class="min-h-screen flex items-center justify-center bg-gray-50">
		<div class="text-center px-4">
			<div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
				<span class="text-3xl">🔒</span>
			</div>
			<h2 class="text-xl font-semibold mb-2 text-gray-900">{m.sell_login_required()}</h2>
			<p class="text-gray-600 mb-6">{m.sell_need_account()}</p>
			<a 
				href="/login?redirect=/sell" 
				class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
			>
				Sign in to continue
			</a>
		</div>
	</div>
{/if}