<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { Check, User, AlertCircle, CreditCard, Building, Mail } from 'lucide-svelte';
	import { fade } from 'svelte/transition';

	const dispatch = createEventDispatcher();

	let payoutMethod = $state('bank_transfer');
	let isSubmitting = $state(false);
	let isValid = $state(false);

	// Form fields
	let revtag = $state('@');
	let bankAccountName = $state('');
	let bankAccountNumber = $state('');
	let bankRoutingNumber = $state('');
	let bankName = $state('');
	let paypalEmail = $state('');

	// Validation functions
	function validateRevtag(value: string) {
		const regex = /^@[a-zA-Z0-9_]+$/;
		return regex.test(value) && value.length > 1;
	}

	function validateBankAccount() {
		return bankAccountName.trim() && 
			   bankAccountNumber.trim() && 
			   bankRoutingNumber.trim() && 
			   bankName.trim();
	}

	function validatePaypalEmail(email: string) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	// Update validation when form changes
	$effect(() => {
		if (payoutMethod === 'revolut') {
			isValid = validateRevtag(revtag);
		} else if (payoutMethod === 'bank_transfer') {
			isValid = validateBankAccount();
		} else if (payoutMethod === 'paypal') {
			isValid = validatePaypalEmail(paypalEmail);
		}
	});

	async function handleSubmit(event: Event) {
		event.preventDefault();
		if (!isValid || isSubmitting) return;

		isSubmitting = true;

		try {
			const payload: any = { payout_method: payoutMethod };

			if (payoutMethod === 'revolut') {
				payload.revtag = revtag;
			} else if (payoutMethod === 'bank_transfer') {
				payload.bank_account_name = bankAccountName;
				payload.bank_account_number = bankAccountNumber;
				payload.bank_routing_number = bankRoutingNumber;
				payload.bank_name = bankName;
			} else if (payoutMethod === 'paypal') {
				payload.paypal_email = paypalEmail;
			}

			const response = await fetch('/api/payment/account/setup', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			});

			const data = await response.json();

			if (!response.ok) {
				toast.error(data.error || 'Failed to set up payment account');
				return;
			}

			toast.success(data.message || 'Payment account set up successfully!');
			dispatch('success', data.payment_account);
		} catch (error) {
			console.error('Payment account setup error:', error);
			toast.error('Failed to set up payment account');
		} finally {
			isSubmitting = false;
		}
	}

	function handleRevtagInput(event: Event) {
		const target = event.target as HTMLInputElement;
		let value = target.value;

		// Ensure it starts with @
		if (!value.startsWith('@')) {
			value = '@' + value;
		}

		// Remove invalid characters
		value = value.replace(/[^a-zA-Z0-9_@]/g, '');

		// Ensure only one @ at the beginning
		if (value.indexOf('@') !== value.lastIndexOf('@')) {
			value = '@' + value.replace(/@/g, '');
		}

		revtag = value;
	}
</script>

<div class="max-w-lg mx-auto bg-white rounded-xl shadow-sm p-4">
	<div class="text-center mb-4">
		<div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
			<CreditCard class="h-6 w-6 text-white" />
		</div>
		<h2 class="text-xl font-bold text-gray-900 mb-1">Set up Payment Account</h2>
		<p class="text-sm text-gray-600">Choose how you'd like to receive payments</p>
	</div>

	<form onsubmit={handleSubmit} class="space-y-4">
		<!-- Payment Method Selection -->
		<div class="space-y-2">
			<label class="block text-sm font-medium text-gray-700">
				Select your payout method
			</label>
			<div class="grid grid-cols-1 gap-2">
				<label class="relative cursor-pointer">
					<input
						type="radio"
						name="payout_method"
						value="bank_transfer"
						bind:group={selectedPayoutMethod}
						class="sr-only"
					/>
					<div class="flex items-center p-3 border-2 rounded-lg transition-all {payoutMethod === 'bank_transfer' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}">
						<Building class="h-4 w-4 text-gray-600 mr-3" />
						<div>
							<div class="font-medium text-gray-900 text-sm">Bank Transfer (IBAN)</div>
							<div class="text-xs text-gray-600">Direct to your bank account</div>
						</div>
						{#if payoutMethod === 'bank_transfer'}
							<Check class="h-4 w-4 text-blue-500 ml-auto" />
						{/if}
					</div>
				</label>

				<label class="relative cursor-pointer">
					<input
						type="radio"
						name="payout_method"
						value="paypal"
						bind:group={selectedPayoutMethod}
						class="sr-only"
					/>
					<div class="flex items-center p-3 border-2 rounded-lg transition-all {payoutMethod === 'paypal' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}">
						<Mail class="h-4 w-4 text-gray-600 mr-3" />
						<div>
							<div class="font-medium text-gray-900 text-sm">PayPal</div>
							<div class="text-xs text-gray-600">Through PayPal</div>
						</div>
						{#if payoutMethod === 'paypal'}
							<Check class="h-4 w-4 text-blue-500 ml-auto" />
						{/if}
					</div>
				</label>

				<label class="relative cursor-pointer">
					<input
						type="radio"
						name="payout_method"
						value="revolut"
						bind:group={selectedPayoutMethod}
						class="sr-only"
					/>
					<div class="flex items-center p-3 border-2 rounded-lg transition-all {payoutMethod === 'revolut' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}">
						<div class="w-4 h-4 bg-black rounded-full flex items-center justify-center mr-3">
							<span class="text-white font-bold text-xs">R</span>
						</div>
						<div>
							<div class="font-medium text-gray-900 text-sm">Revolut</div>
							<div class="text-xs text-gray-600">Through Revolut</div>
						</div>
						{#if payoutMethod === 'revolut'}
							<Check class="h-4 w-4 text-blue-500 ml-auto" />
						{/if}
					</div>
				</label>
			</div>
		</div>

		<!-- Bank Transfer Fields -->
		{#if payoutMethod === 'bank_transfer'}
			<div class="space-y-3" transition:fade={{ duration: 200 }}>
				<div class="grid grid-cols-1 gap-3">
					<div>
						<label for="bank_account_name" class="block text-sm font-medium text-gray-700 mb-1">
							Account Holder Name
						</label>
						<input
							id="bank_account_name"
							type="text"
							bind:value={bankAccountName}
							placeholder="John Doe"
							class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
							required
						/>
					</div>
					<div>
						<label for="bank_account_number" class="block text-sm font-medium text-gray-700 mb-1">
							IBAN / Account Number
						</label>
						<input
							id="bank_account_number"
							type="text"
							bind:value={bankAccountNumber}
							placeholder="GB29 NWBK 6016 1331 9268 19"
							class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
							required
						/>
					</div>
					<div>
						<label for="bank_routing_number" class="block text-sm font-medium text-gray-700 mb-1">
							Sort Code / Routing Number
						</label>
						<input
							id="bank_routing_number"
							type="text"
							bind:value={bankRoutingNumber}
							placeholder="60-16-13"
							class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
							required
						/>
					</div>
					<div>
						<label for="bank_name" class="block text-sm font-medium text-gray-700 mb-1">
							Bank Name
						</label>
						<input
							id="bank_name"
							type="text"
							bind:value={bankName}
							placeholder="NatWest Bank"
							class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
							required
						/>
					</div>
				</div>
			</div>
		{/if}

		<!-- PayPal Fields -->
		{#if payoutMethod === 'paypal'}
			<div class="space-y-3" transition:fade={{ duration: 200 }}>
				<div>
					<label for="paypal_email" class="block text-sm font-medium text-gray-700 mb-1">
						PayPal Email Address
					</label>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<Mail class="h-4 w-4 text-gray-400" />
						</div>
						<input
							id="paypal_email"
							type="email"
							bind:value={paypalEmail}
							placeholder="your@email.com"
							class="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
							required
						/>
						{#if paypalEmail && validatePaypalEmail(paypalEmail)}
							<div class="absolute inset-y-0 right-0 pr-3 flex items-center" transition:fade={{ duration: 150 }}>
								<Check class="h-4 w-4 text-green-500" />
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Revolut Fields -->
		{#if payoutMethod === 'revolut'}
			<div class="space-y-3" transition:fade={{ duration: 200 }}>
				<div>
					<label for="revtag" class="block text-sm font-medium text-gray-700 mb-1">
						Revolut Username (Revtag)
					</label>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<User class="h-4 w-4 text-gray-400" />
						</div>
						<input
							id="revtag"
							type="text"
							bind:value={revtag}
							oninput={handleRevtagInput}
							placeholder="@yourusername"
							class="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
							required
						/>
						{#if revtag && revtag !== '@' && validateRevtag(revtag)}
							<div class="absolute inset-y-0 right-0 pr-3 flex items-center" transition:fade={{ duration: 150 }}>
								<Check class="h-4 w-4 text-green-500" />
							</div>
						{/if}
					</div>
					{#if revtag && revtag !== '@' && !validateRevtag(revtag)}
						<p class="text-xs text-red-600 flex items-center gap-1 mt-1" transition:fade={{ duration: 150 }}>
							<AlertCircle class="h-3 w-3" />
							Invalid format. Use only letters, numbers, and underscores after @
						</p>
					{/if}
				</div>

				<div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
					<h3 class="font-semibold text-blue-900 mb-2 text-sm">How to find your Revtag:</h3>
					<ol class="text-xs text-blue-800 space-y-1">
						<li>1. Open your Revolut app</li>
						<li>2. Tap your profile icon (top-left)</li>
						<li>3. Your Revtag appears under your name</li>
						<li>4. Copy and paste it here (e.g., @tin1017)</li>
					</ol>
				</div>
			</div>
		{/if}

		<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
			<div class="flex items-center gap-2 text-yellow-800">
				<AlertCircle class="h-4 w-4" />
				<span class="font-medium text-sm">Important</span>
			</div>
			<p class="text-xs text-yellow-800 mt-1">
				Your payment details will only be shared with buyers during checkout and remain private otherwise.
			</p>
		</div>

		<button
			type="submit"
			disabled={!isValid || isSubmitting}
			class="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
		>
			{#if isSubmitting}
				Setting up...
			{:else}
				Set up Payment Account
			{/if}
		</button>
	</form>
</div>