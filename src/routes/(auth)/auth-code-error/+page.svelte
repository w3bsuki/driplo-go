<script>
	import { Button } from '$lib/components/ui'
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'
	import { AlertCircle } from 'lucide-svelte'
</script>

<svelte:head>
	<title>Authentication Error | Threadly</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
	<div class="w-full max-w-md">
		<Card>
			<CardHeader class="text-center">
				<div class="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
					<AlertCircle class="w-6 h-6 text-red-600" />
				</div>
				<CardTitle class="text-xl font-bold text-gray-900">Authentication Error</CardTitle>
				<p class="text-gray-600">There was a problem signing you in</p>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="text-center text-sm text-gray-600">
					<p>The authentication process encountered an error. This could be due to:</p>
					<ul class="mt-2 space-y-1 text-left">
						<li>• Expired or invalid authentication code</li>
						<li>• Network connectivity issues</li>
						<li>• Third-party authentication service problems</li>
					</ul>
				</div>
				
				<div class="space-y-2">
					<Button href="/login" class="w-full">
						Try Again
					</Button>
					<Button href="/" variant="outline" class="w-full">
						Return Home
					</Button>
				</div>
			</CardContent>
		</Card>
	</div>
</div>