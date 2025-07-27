<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { onboarding } from '$lib/stores/onboarding.svelte';
	import { Dialog, DialogContent } from '$lib/components/ui/Dialog';
	import Button from '$lib/components/ui/button.svelte';
	import * as m from '$lib/paraglide/messages';
	import type { User } from '@supabase/supabase-js';
	
	export let user: User;
	
	let currentSlide = 0;
	
	const slides = [
		{
			title: "Welcome to Driplo! 👋",
			description: "Your sustainable fashion marketplace",
			emoji: "🎉"
		},
		{
			title: "Buy & Sell with Confidence",
			description: "Secure payments, buyer protection, and verified sellers",
			emoji: "🔒"
		},
		{
			title: "Join Our Community",
			description: "Connect with fashion lovers and build your sustainable wardrobe",
			emoji: "💚"
		}
	];
	
	function nextSlide() {
		if (currentSlide < slides.length - 1) {
			currentSlide++;
		} else {
			completeOnboarding();
		}
	}
	
	function previousSlide() {
		if (currentSlide > 0) {
			currentSlide--;
		}
	}
	
	async function completeOnboarding() {
		await onboarding.completeStep('hasSeenWelcome');
		onboarding.showWelcomeModal = false;
		
		// Profile completion check moved to profile page
		// The profile page will check if profile is complete
		// and redirect to edit page if needed
		goto('/profile?onboarding=true');
	}
	
	function skip() {
		onboarding.completeStep('hasSeenWelcome');
		onboarding.showWelcomeModal = false;
	}
</script>

<Dialog bind:open={onboarding.showWelcomeModal}>
	<DialogContent class="max-w-md bg-white border-2 border-blue-100">
		<div class="text-center">
			<!-- Progress Dots -->
			<div class="flex justify-center gap-2 mb-6">
				{#each slides as _, index}
					<div 
						class="w-2 h-2 rounded-full transition-colors duration-300"
						class:bg-blue-400={index === currentSlide}
						class:bg-blue-200={index !== currentSlide}
					/>
				{/each}
			</div>
			
			<!-- Slide Content -->
			<div class="mb-6 min-h-[200px] flex flex-col items-center justify-center">
				<div class="text-6xl mb-4">{slides[currentSlide].emoji}</div>
				<h2 class="text-2xl font-bold mb-2">{slides[currentSlide].title}</h2>
				<p class="text-muted-foreground">{slides[currentSlide].description}</p>
			</div>
			
			<!-- Actions -->
			<div class="flex gap-2">
				{#if currentSlide === 0}
					<Button variant="ghost" class="flex-1 hover:bg-blue-50" onclick={skip}>
						Skip
					</Button>
				{:else}
					<Button variant="ghost" class="flex-1 hover:bg-blue-50" onclick={previousSlide}>
						Back
					</Button>
				{/if}
				<Button 
					class="flex-1 bg-blue-400 hover:bg-blue-500 text-white" 
					onclick={nextSlide}
				>
					{currentSlide === slides.length - 1 ? "Get Started" : "Next"}
				</Button>
			</div>
		</div>
	</DialogContent>
</Dialog>