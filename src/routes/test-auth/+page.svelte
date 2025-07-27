<script lang="ts">
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
	import { createBrowserClient } from '@supabase/ssr'
	import { toast } from 'svelte-sonner'
	
	const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY)
	
	let testEmail = $state('test' + Date.now() + '@example.com')
	let testPassword = $state('testpassword123')
	let result = $state('')
	
	async function testSignup() {
		console.log('Testing direct Supabase signup...');
		result = 'Testing...';
		
		try {
			const { data, error } = await supabase.auth.signUp({
				email: testEmail,
				password: testPassword,
				options: {
					data: {
						username: 'testuser' + Date.now(),
						full_name: 'Test User'
					}
				}
			})
			
			console.log('Signup result:', { data, error });
			
			if (error) {
				result = `Error: ${error.message}\nCode: ${error.code}\nStatus: ${error.status}`;
				toast.error(error.message);
			} else {
				result = `Success: ${JSON.stringify(data, null, 2)}`;
				toast.success('Signup successful!');
			}
		} catch (err) {
			console.error('Caught error:', err);
			result = `Exception: ${err}`;
		}
	}
	
	async function testConnection() {
		console.log('Testing Supabase connection...');
		result = 'Testing connection...';
		
		try {
			const { data, error } = await supabase.from('profiles').select('count').limit(1);
			
			if (error) {
				result = `Connection Error: ${error.message}`;
				toast.error('Connection failed');
			} else {
				result = 'Connection successful!';
				toast.success('Connected to Supabase');
			}
		} catch (err) {
			console.error('Connection error:', err);
			result = `Exception: ${err}`;
		}
	}
	
	// Test connection on mount
	$effect(() => {
		testConnection();
	});
</script>

<div class="p-8 max-w-2xl mx-auto">
	<h1 class="text-2xl font-bold mb-4">Auth Debug Page</h1>
	
	<div class="space-y-4">
		<div>
			<h2 class="text-lg font-semibold">Environment Variables</h2>
			<pre class="bg-gray-100 p-2 rounded text-xs overflow-auto">
URL: {PUBLIC_SUPABASE_URL}
KEY: {PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...
			</pre>
		</div>
		
		<div>
			<h2 class="text-lg font-semibold">Test Connection</h2>
			<button 
				on:click={testConnection}
				class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
			>
				Test DB Connection
			</button>
		</div>
		
		<div>
			<h2 class="text-lg font-semibold">Test Signup</h2>
			<div class="space-y-2">
				<input 
					type="email" 
					bind:value={testEmail}
					placeholder="Test email"
					class="w-full px-3 py-2 border rounded"
				/>
				<input 
					type="password" 
					bind:value={testPassword}
					placeholder="Test password"
					class="w-full px-3 py-2 border rounded"
				/>
				<button 
					on:click={testSignup}
					class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
				>
					Test Signup
				</button>
			</div>
		</div>
		
		{#if result}
			<div>
				<h2 class="text-lg font-semibold">Result</h2>
				<pre class="bg-gray-100 p-4 rounded whitespace-pre-wrap text-sm">{result}</pre>
			</div>
		{/if}
	</div>
</div>