<script lang="ts">
	import { Truck } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages.js';

	interface ShippingAddress {
		name: string;
		address_line1: string;
		address_line2: string;
		city: string;
		state: string;
		postal_code: string;
		country: string;
	}

	interface Props {
		shippingAddress: ShippingAddress;
		onAddressChange: (address: ShippingAddress) => void;
		disabled?: boolean;
	}

	let { shippingAddress, onAddressChange, disabled = false }: Props = $props();

	function updateField(field: keyof ShippingAddress, value: string) {
		const updatedAddress = { ...shippingAddress, [field]: value };
		onAddressChange(updatedAddress);
	}
</script>

<!-- Shipping Address Section -->
<div class="space-y-4">
	<div class="flex items-center space-x-2">
		<Truck class="h-5 w-5 text-brand-500" />
		<h3 class="text-lg font-semibold text-gray-900">{m.shipping_address()}</h3>
	</div>

	<div class="grid grid-cols-1 gap-4">
		<!-- Full Name -->
		<div>
			<label for="shipping-name" class="block text-sm font-medium text-gray-700 mb-1">
				{m.full_name()} <span class="text-red-500">*</span>
			</label>
			<input
				id="shipping-name"
				type="text"
				value={shippingAddress.name}
				oninput={(e) => updateField('name', e.currentTarget.value)}
				{disabled}
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
				placeholder="Enter your full name"
				required
			/>
		</div>

		<!-- Address Line 1 -->
		<div>
			<label for="shipping-address-1" class="block text-sm font-medium text-gray-700 mb-1">
				{m.address_line_1()} <span class="text-red-500">*</span>
			</label>
			<input
				id="shipping-address-1"
				type="text"
				value={shippingAddress.address_line1}
				oninput={(e) => updateField('address_line1', e.currentTarget.value)}
				{disabled}
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
				placeholder="Street address, P.O. box, company name"
				required
			/>
		</div>

		<!-- Address Line 2 -->
		<div>
			<label for="shipping-address-2" class="block text-sm font-medium text-gray-700 mb-1">
				{m.address_line_2()} <span class="text-gray-400">(Optional)</span>
			</label>
			<input
				id="shipping-address-2"
				type="text"
				value={shippingAddress.address_line2}
				oninput={(e) => updateField('address_line2', e.currentTarget.value)}
				{disabled}
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
				placeholder="Apartment, suite, unit, building, floor, etc."
			/>
		</div>

		<!-- City, State, Postal Code Row -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<!-- City -->
			<div>
				<label for="shipping-city" class="block text-sm font-medium text-gray-700 mb-1">
					{m.city()} <span class="text-red-500">*</span>
				</label>
				<input
					id="shipping-city"
					type="text"
					value={shippingAddress.city}
					oninput={(e) => updateField('city', e.currentTarget.value)}
					{disabled}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
					placeholder="City"
					required
				/>
			</div>

			<!-- State/Province -->
			<div>
				<label for="shipping-state" class="block text-sm font-medium text-gray-700 mb-1">
					{m.state_province()}
				</label>
				<input
					id="shipping-state"
					type="text"
					value={shippingAddress.state}
					oninput={(e) => updateField('state', e.currentTarget.value)}
					{disabled}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
					placeholder="State/Province"
				/>
			</div>

			<!-- Postal Code -->
			<div>
				<label for="shipping-postal" class="block text-sm font-medium text-gray-700 mb-1">
					{m.postal_code()} <span class="text-red-500">*</span>
				</label>
				<input
					id="shipping-postal"
					type="text"
					value={shippingAddress.postal_code}
					oninput={(e) => updateField('postal_code', e.currentTarget.value)}
					{disabled}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
					placeholder="Postal code"
					required
				/>
			</div>
		</div>

		<!-- Country -->
		<div>
			<label for="shipping-country" class="block text-sm font-medium text-gray-700 mb-1">
				{m.country()} <span class="text-red-500">*</span>
			</label>
			<select
				id="shipping-country"
				value={shippingAddress.country}
				onchange={(e) => updateField('country', e.currentTarget.value)}
				{disabled}
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
				required
			>
				<option value="BG">{m.bulgaria()}</option>
				<option value="RO">{m.romania()}</option>
				<option value="GR">{m.greece()}</option>
				<option value="RS">{m.serbia()}</option>
				<option value="MK">{m.north_macedonia()}</option>
				<option value="AL">{m.albania()}</option>
				<option value="TR">{m.turkey()}</option>
				<!-- Add more countries as needed -->
			</select>
		</div>
	</div>
</div>

<style>
	/* Custom focus styles for better accessibility */
	input:focus,
	select:focus {
		outline: none;
		box-shadow: 0 0 0 3px rgba(135, 206, 235, 0.1);
	}

	/* Error state styling (can be extended) */
	input:invalid,
	select:invalid {
		border-color: #ef4444;
	}
</style>