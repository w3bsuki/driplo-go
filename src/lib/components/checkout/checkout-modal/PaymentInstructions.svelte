<script lang="ts">
	import { ExternalLink, Check, Clock, AlertCircle } from 'lucide-svelte';
	import { formatCurrency } from '$lib/utils/currency';
	import * as m from '$lib/paraglide/messages.js';

	interface ManualPaymentData {
		order_id: string;
		amount: number;
		currency: string;
		payment_reference: string;
		revolut_link?: string;
		instructions?: string;
		expires_at?: string;
	}

	interface Props {
		manualPaymentData: ManualPaymentData;
		onConfirmPayment: () => void;
		onOpenRevolutLink: () => void;
		isProcessing: boolean;
		isExpired?: boolean;
	}

	let { 
		manualPaymentData, 
		onConfirmPayment, 
		onOpenRevolutLink, 
		isProcessing,
		isExpired = false 
	}: Props = $props();

	function getFormattedAmount(): string {
		const formatter = new Intl.NumberFormat('bg-BG', {
			style: 'currency',
			currency: manualPaymentData.currency
		});
		return formatter.format(manualPaymentData.amount);
	}

	function getFormattedExpiry(): string {
		if (!manualPaymentData.expires_at) return '';
		
		const expiryDate = new Date(manualPaymentData.expires_at);
		return expiryDate.toLocaleString('bg-BG', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<!-- Payment Instructions Section -->
<div class="space-y-6">
	<div class="text-center">
		<div class="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
			<ExternalLink class="w-6 h-6 text-blue-600" />
		</div>
		<h3 class="text-lg font-medium text-gray-900">{m.manual_payment_instructions()}</h3>
		<p class="mt-2 text-sm text-gray-600">{m.complete_payment_via_revolut()}</p>
	</div>

	<!-- Payment Details Card -->
	<div class="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
		<h4 class="font-medium text-blue-900">{m.payment_details()}</h4>
		
		<div class="space-y-3">
			<div class="flex justify-between">
				<span class="text-sm text-blue-700">{m.amount_to_pay()}:</span>
				<span class="font-medium text-blue-900">{getFormattedAmount()}</span>
			</div>
			
			<div class="flex justify-between">
				<span class="text-sm text-blue-700">{m.payment_reference()}:</span>
				<span class="font-mono text-sm font-medium text-blue-900">{manualPaymentData.payment_reference}</span>
			</div>
			
			<div class="flex justify-between">
				<span class="text-sm text-blue-700">{m.order_id()}:</span>
				<span class="font-mono text-xs text-blue-700">{manualPaymentData.order_id}</span>
			</div>

			{#if manualPaymentData.expires_at && !isExpired}
				<div class="flex justify-between items-center">
					<span class="text-sm text-blue-700">{m.expires_at()}:</span>
					<div class="flex items-center space-x-1">
						<Clock class="w-4 h-4 text-blue-600" />
						<span class="text-xs text-blue-700">{getFormattedExpiry()}</span>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Expiry Warning -->
	{#if isExpired}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
			<AlertCircle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
			<div>
				<h4 class="text-sm font-medium text-red-900">{m.payment_expired()}</h4>
				<p class="mt-1 text-xs text-red-700">{m.payment_expired_message()}</p>
			</div>
		</div>
	{/if}

	<!-- Instructions -->
	{#if manualPaymentData.instructions}
		<div class="bg-gray-50 rounded-lg p-4">
			<h4 class="text-sm font-medium text-gray-900 mb-2">{m.payment_instructions()}:</h4>
			<p class="text-sm text-gray-700">{manualPaymentData.instructions}</p>
		</div>
	{/if}

	<!-- Action Buttons -->
	<div class="space-y-3">
		<!-- Open Revolut Link Button -->
		{#if manualPaymentData.revolut_link && !isExpired}
			<button
				onclick={onOpenRevolutLink}
				disabled={isProcessing}
				class="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				<ExternalLink class="w-4 h-4 mr-2" />
				{m.pay_with_revolut()}
			</button>
		{/if}

		<!-- Confirm Payment Button -->
		<button
			onclick={onConfirmPayment}
			disabled={isProcessing || isExpired}
			class="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
		>
			{#if isProcessing}
				<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
				{m.confirming_payment()}
			{:else}
				<Check class="w-4 h-4 mr-2" />
				{m.i_have_completed_payment()}
			{/if}
		</button>
	</div>

	<!-- Security Notice -->
	<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
		<div class="flex">
			<AlertCircle class="w-5 h-5 text-yellow-600 flex-shrink-0" />
			<div class="ml-3">
				<h4 class="text-sm font-medium text-yellow-800">{m.important_notice()}</h4>
				<p class="mt-1 text-xs text-yellow-700">
					{m.manual_payment_security_notice()}
				</p>
			</div>
		</div>
	</div>

	<!-- Payment Reference Copy Notice -->
	<div class="text-center">
		<p class="text-xs text-gray-500">
			{m.include_payment_reference_notice()}
		</p>
	</div>
</div>

<style>
	/* Loading spinner animation */
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>