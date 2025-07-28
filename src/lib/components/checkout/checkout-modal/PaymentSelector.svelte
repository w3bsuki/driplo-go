<script lang="ts">
	import { CreditCard, Smartphone, Lock, Check } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages.js';

	interface Props {
		paymentProvider: 'stripe' | 'revolut_manual';
		onProviderChange: (provider: 'stripe' | 'revolut_manual') => void;
		disabled?: boolean;
	}

	let { paymentProvider, onProviderChange, disabled = false }: Props = $props();

	function selectProvider(provider: 'stripe' | 'revolut_manual') {
		if (!disabled) {
			onProviderChange(provider);
		}
	}
</script>

<!-- Payment Method Selection -->
<div class="space-y-4">
	<div class="flex items-center space-x-2">
		<Lock class="h-5 w-5 text-brand-500" />
		<h3 class="text-lg font-semibold text-gray-900">{m.payment_method()}</h3>
	</div>

	<div class="space-y-3">
		<!-- Stripe Payment Option -->
		<div 
			class="relative"
			onclick={() => selectProvider('stripe')}
			role="button"
			tabindex="0"
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					selectProvider('stripe');
				}
			}}
		>
			<div class={`
				border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
				${paymentProvider === 'stripe' 
					? 'border-brand-500 bg-brand-50' 
					: 'border-gray-200 hover:border-gray-300'
				}
				${disabled ? 'opacity-50 cursor-not-allowed' : ''}
			`}>
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-3">
						<div class={`
							flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
							${paymentProvider === 'stripe' ? 'bg-brand-100' : 'bg-gray-100'}
						`}>
							<CreditCard class={`w-5 h-5 ${paymentProvider === 'stripe' ? 'text-brand-600' : 'text-gray-600'}`} />
						</div>
						<div>
							<h4 class="text-sm font-medium text-gray-900">{m.card_payment()}</h4>
							<p class="text-xs text-gray-600">{m.stripe_card_description()}</p>
						</div>
					</div>
					{#if paymentProvider === 'stripe'}
						<div class="flex-shrink-0">
							<div class="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center">
								<Check class="w-4 h-4 text-white" />
							</div>
						</div>
					{:else}
						<div class="flex-shrink-0">
							<div class="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
						</div>
					{/if}
				</div>
				
				<!-- Card Brand Icons -->
				<div class="mt-3 flex items-center space-x-2">
					<div class="flex items-center space-x-1">
						<span class="text-xs text-gray-500">{m.accepted_cards()}:</span>
						<div class="flex space-x-1">
							<span class="text-xs font-medium text-gray-600">Visa</span>
							<span class="text-xs font-medium text-gray-600">MasterCard</span>
							<span class="text-xs font-medium text-gray-600">Maestro</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Revolut Manual Payment Option -->
		<div 
			class="relative"
			onclick={() => selectProvider('revolut_manual')}
			role="button"
			tabindex="0"
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					selectProvider('revolut_manual');
				}
			}}
		>
			<div class={`
				border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
				${paymentProvider === 'revolut_manual' 
					? 'border-brand-500 bg-brand-50' 
					: 'border-gray-200 hover:border-gray-300'
				}
				${disabled ? 'opacity-50 cursor-not-allowed' : ''}
			`}>
				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-3">
						<div class={`
							flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
							${paymentProvider === 'revolut_manual' ? 'bg-brand-100' : 'bg-gray-100'}
						`}>
							<Smartphone class={`w-5 h-5 ${paymentProvider === 'revolut_manual' ? 'text-brand-600' : 'text-gray-600'}`} />
						</div>
						<div>
							<h4 class="text-sm font-medium text-gray-900">{m.revolut_payment()}</h4>
							<p class="text-xs text-gray-600">{m.revolut_manual_description()}</p>
						</div>
					</div>
					{#if paymentProvider === 'revolut_manual'}
						<div class="flex-shrink-0">
							<div class="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center">
								<Check class="w-4 h-4 text-white" />
							</div>
						</div>
					{:else}
						<div class="flex-shrink-0">
							<div class="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Payment Method Details -->
	{#if paymentProvider === 'stripe'}
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
			<div class="flex items-start space-x-2">
				<Lock class="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
				<div>
					<h5 class="text-sm font-medium text-blue-900">{m.secure_payment()}</h5>
					<p class="text-xs text-blue-700 mt-1">{m.stripe_security_description()}</p>
				</div>
			</div>
		</div>
	{:else if paymentProvider === 'revolut_manual'}
		<div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
			<div class="flex items-start space-x-2">
				<Smartphone class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
				<div>
					<h5 class="text-sm font-medium text-amber-900">{m.manual_verification()}</h5>
					<p class="text-xs text-amber-700 mt-1">{m.revolut_manual_process_description()}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Security Notice -->
	<div class="bg-gray-50 rounded-lg p-3">
		<div class="flex items-center space-x-2">
			<Lock class="w-4 h-4 text-gray-600" />
			<p class="text-xs text-gray-600">
				{m.payment_security_notice()}
			</p>
		</div>
	</div>
</div>

<style>
	/* Focus styles for better accessibility */
	[role="button"]:focus {
		outline: 2px solid var(--color-brand-500);
		outline-offset: 2px;
	}

	/* Hover effects */
	[role="button"]:hover:not(.disabled) {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	/* Disabled state */
	.disabled {
		pointer-events: none;
	}
</style>