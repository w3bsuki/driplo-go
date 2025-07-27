<script lang="ts">
	import { cn } from '$lib/utils/cn';

	interface Props {
		password: string;
		class?: string;
	}

	let { password, class: className = '' }: Props = $props();

	const requirements = $derived([
		{ 
			label: 'At least 8 characters', 
			met: password.length >= 8 
		},
		{ 
			label: 'Contains uppercase letter', 
			met: /[A-Z]/.test(password) 
		},
		{ 
			label: 'Contains lowercase letter', 
			met: /[a-z]/.test(password) 
		},
		{ 
			label: 'Contains number', 
			met: /[0-9]/.test(password) 
		},
		{ 
			label: 'Contains special character', 
			met: /[!@#$%^&*(),.?":{}|<>]/.test(password) 
		}
	]);

	const strength = $derived.by(() => {
		const metCount = requirements.filter(req => req.met).length;
		if (metCount === 0) return { level: 0, label: 'Very Weak', color: 'bg-destructive' };
		if (metCount === 1) return { level: 1, label: 'Weak', color: 'bg-orange-500' };
		if (metCount === 2) return { level: 2, label: 'Fair', color: 'bg-yellow-500' };
		if (metCount === 3) return { level: 3, label: 'Good', color: 'bg-blue-500' };
		if (metCount === 4) return { level: 4, label: 'Strong', color: 'bg-green-500' };
		return { level: 5, label: 'Very Strong', color: 'bg-green-600' };
	});

	const strengthPercentage = $derived((strength.level / 5) * 100);
</script>

{#if password}
	<div class={cn('space-y-2', className)}>
		<div class="flex items-center justify-between text-xs">
			<span class="text-muted-foreground">Password strength:</span>
			<span class={cn(
				'font-medium',
				strength.level <= 1 && 'text-destructive',
				strength.level === 2 && 'text-yellow-600',
				strength.level === 3 && 'text-blue-600',
				strength.level >= 4 && 'text-green-600'
			)}>
				{strength.label}
			</span>
		</div>
		
		<div class="h-2 bg-muted rounded-full overflow-hidden">
			<div 
				class={cn('h-full transition-all duration-300', strength.color)}
				style="width: {strengthPercentage}%"
			/>
		</div>

		<div class="space-y-1 text-xs">
			{#each requirements as req}
				<div class="flex items-center gap-1.5">
					{#if req.met}
						<svg class="w-3 h-3 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					{:else}
						<svg class="w-3 h-3 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<circle cx="12" cy="12" r="10" stroke-width="2" />
						</svg>
					{/if}
					<span class={cn(
						'transition-colors',
						req.met ? 'text-green-600' : 'text-muted-foreground'
					)}>
						{req.label}
					</span>
				</div>
			{/each}
		</div>
	</div>
{/if}