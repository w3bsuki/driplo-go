<script lang="ts">
	import { AtSign, AlertCircle, CheckCircle } from 'lucide-svelte';
	import { getAuthContext } from '$lib/stores/auth-context.svelte';
	
	interface Props {
		username: string;
		isAvailable?: boolean;
		isChecking?: boolean;
		error?: string;
	}
	
	let { 
		username = $bindable(''), 
		isAvailable = $bindable(false),
		isChecking = $bindable(false),
		error = $bindable('')
	}: Props = $props();
	
	const auth = getAuthContext();
	let checkTimeout: NodeJS.Timeout;
	
	// Username validation rules
	const isValidUsername = $derived(() => {
		if (!username) return false;
		if (username.length < 3 || username.length > 30) return false;
		return /^[a-zA-Z0-9_]+$/.test(username);
	});
	
	const showError = $derived(() => {
		if (!username) return false;
		if (username.length < 3) return 'Username must be at least 3 characters';
		if (username.length > 30) return 'Username must be less than 30 characters';
		if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores';
		if (error) return error;
		return false;
	});
	
	async function checkUsernameAvailability() {
		if (!isValidUsername()) {
			isAvailable = false;
			return;
		}
		
		isChecking = true;
		error = '';
		
		try {
			const { data, error: checkError } = await auth.supabase
				.from('profiles')
				.select('id')
				.eq('username', username.toLowerCase())
				.neq('id', auth.user?.id)
				.single();
			
			if (checkError && checkError.code === 'PGRST116') {
				// No rows found - username is available
				isAvailable = true;
			} else if (data) {
				// Username taken
				isAvailable = false;
				error = 'This username is already taken';
			} else if (checkError) {
				throw checkError;
			}
		} catch (err) {
			error = 'Failed to check username availability';
			isAvailable = false;
		} finally {
			isChecking = false;
		}
	}
	
	// Debounced username check
	function handleUsernameInput() {
		isAvailable = false;
		error = '';
		
		if (checkTimeout) clearTimeout(checkTimeout);
		
		if (isValidUsername()) {
			checkTimeout = setTimeout(() => {
				checkUsernameAvailability();
			}, 500);
		}
	}
	
	$effect(() => {
		// Cleanup timeout on unmount
		return () => {
			if (checkTimeout) clearTimeout(checkTimeout);
		};
	});
</script>

<div class="space-y-6">
	<div class="text-center">
		<div class="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
			<AtSign class="w-8 h-8 text-blue-600" />
		</div>
		<h3 class="text-xl font-semibold mb-2">Choose your username</h3>
		<p class="text-gray-600 text-sm">This is how other users will find and recognize you</p>
	</div>
	
	<div class="space-y-4">
		<div>
			<label for="username" class="block text-sm font-medium text-gray-700 mb-2">
				Username
			</label>
			<div class="relative">
				<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					<span class="text-gray-500">@</span>
				</div>
				<input
					id="username"
					type="text"
					bind:value={username}
					oninput={handleUsernameInput}
					placeholder="johndoe"
					maxlength="30"
					class="w-full pl-8 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base
						{showError() ? 'border-red-300' : isAvailable ? 'border-green-300' : 'border-gray-300'}"
				/>
				<div class="absolute inset-y-0 right-0 pr-3 flex items-center">
					{#if isChecking}
						<div class="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
					{:else if isAvailable}
						<CheckCircle class="w-5 h-5 text-green-500" />
					{:else if showError()}
						<AlertCircle class="w-5 h-5 text-red-500" />
					{/if}
				</div>
			</div>
			
			{#if showError()}
				<p class="mt-2 text-sm text-red-600 flex items-center gap-1">
					<AlertCircle class="w-4 h-4" />
					{showError()}
				</p>
			{:else if isAvailable}
				<p class="mt-2 text-sm text-green-600 flex items-center gap-1">
					<CheckCircle class="w-4 h-4" />
					This username is available!
				</p>
			{/if}
			
			<div class="mt-2 text-xs text-gray-500">
				<ul class="space-y-1">
					<li class="flex items-center gap-1">
						<span class="{username.length >= 3 ? 'text-green-600' : ''}">•</span>
						3-30 characters
					</li>
					<li class="flex items-center gap-1">
						<span class="{username && /^[a-zA-Z0-9_]+$/.test(username) ? 'text-green-600' : ''}">•</span>
						Letters, numbers, and underscores only
					</li>
				</ul>
			</div>
		</div>
		
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
			<p class="text-sm text-blue-700">
				<strong>Tip:</strong> Choose a username that represents you or your style. 
				You won't be able to change it later without contacting support.
			</p>
		</div>
	</div>
</div>