<script lang="ts">
	import { Button } from '$lib/components/ui';
	import { ArrowRight } from 'lucide-svelte';
</script>

<section class="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
	<div class="container px-4 py-16 md:py-24">
		<div class="mx-auto max-w-2xl text-center">
			<h1 class="mb-4 text-4xl font-bold tracking-tight sm:text-6xl">
				Ready to declutter your wardrobe?
			</h1>
			<p class="mb-8 text-lg text-muted-foreground">
				Join millions buying and selling pre-loved fashion. List in seconds, ship with ease, and get paid fast.
			</p>
			<div class="flex flex-col sm:flex-row gap-4 justify-center">
				<Button size="lg" onclick={() => window.location.href='/sell'}>
					Start selling
					<ArrowRight class="ml-2 h-4 w-4" />
				</Button>
				<Button size="lg" variant="outline" onclick={() => window.location.href='/browse'}>
					Browse items
				</Button>
			</div>
		</div>
	</div>
	
	<!-- Decorative elements -->
	<div class="absolute inset-0 -z-10 overflow-hidden">
		<div class="absolute -top-1/2 right-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl"></div>
		<div class="absolute -bottom-1/2 left-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
	</div>
</section>