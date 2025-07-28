<script lang="ts">
	import { MapPin, User, FileText, AlertCircle } from 'lucide-svelte';

	interface Props {
		fullName: string;
		bio: string;
		location: string;
	}

	let { fullName = $bindable(''), bio = $bindable(''), location = $bindable('') }: Props = $props();

	const maxBioLength = 160;
	const bioLength = $derived(bio.length);
	const bioPercentage = $derived((bioLength / maxBioLength) * 100);

	// Popular cities for quick selection
	const popularLocations = [
		'Sofia, Bulgaria',
		'London, UK',
		'New York, USA',
		'Paris, France',
		'Milan, Italy',
		'Tokyo, Japan',
		'Berlin, Germany',
		'Barcelona, Spain'
	];

	let showLocationSuggestions = $state(false);
	let locationInput = $state(location);

	const filteredLocations = $derived(
		popularLocations.filter(loc => 
			loc.toLowerCase().includes(locationInput.toLowerCase())
		)
	);

	function selectLocation(loc: string) {
		location = loc;
		locationInput = loc;
		showLocationSuggestions = false;
	}

	function handleLocationInput(e: Event) {
		const target = e.target as HTMLInputElement;
		locationInput = target.value;
		location = target.value;
		showLocationSuggestions = true;
	}

	function handleLocationBlur() {
		// Delay to allow click on suggestions
		setTimeout(() => {
			showLocationSuggestions = false;
		}, 200);
	}
</script>

<div class="space-y-6">
	<div class="text-center mb-8">
		<h2 class="text-3xl font-bold text-gray-900 mb-3">Tell Us About Yourself</h2>
		<p class="text-lg text-gray-600 max-w-2xl mx-auto">
			Add some personal details to help others get to know you better.
		</p>
	</div>

	<div class="space-y-6 max-w-xl mx-auto">
		<!-- Full Name -->
		<div>
			<label for="fullName" class="block text-sm font-medium text-gray-700 mb-2">
				<div class="flex items-center gap-2">
					<User class="w-4 h-4" />
					Display Name
				</div>
			</label>
			<input
				id="fullName"
				type="text"
				bind:value={fullName}
				placeholder="How should we call you?"
				class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
					focus:ring-blue-500 focus:border-transparent transition-all duration-200
					placeholder-gray-400"
				maxlength="50"
			/>
			<p class="mt-1 text-xs text-gray-500">
				This is how other users will see your name
			</p>
		</div>

		<!-- Bio -->
		<div>
			<label for="bio" class="block text-sm font-medium text-gray-700 mb-2">
				<div class="flex items-center gap-2">
					<FileText class="w-4 h-4" />
					Bio
				</div>
			</label>
			<div class="relative">
				<textarea
					id="bio"
					bind:value={bio}
					placeholder="Tell us a bit about yourself and your style..."
					rows="4"
					maxlength={maxBioLength}
					class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
						focus:ring-blue-500 focus:border-transparent transition-all duration-200
						placeholder-gray-400 resize-none"
				></textarea>
				
				<!-- Character count indicator -->
				<div class="absolute bottom-2 right-2 flex items-center gap-2">
					<div class="relative w-8 h-8">
						<svg class="w-8 h-8 transform -rotate-90">
							<circle
								cx="16"
								cy="16"
								r="14"
								stroke="currentColor"
								stroke-width="2"
								fill="none"
								class="text-gray-200"
							/>
							<circle
								cx="16"
								cy="16"
								r="14"
								stroke="currentColor"
								stroke-width="2"
								fill="none"
								stroke-dasharray={`${2 * Math.PI * 14}`}
								stroke-dashoffset={`${2 * Math.PI * 14 * (1 - bioPercentage / 100)}`}
								class="text-blue-500 transition-all duration-300"
							/>
						</svg>
						<span class="absolute inset-0 flex items-center justify-center text-xs font-medium
							{bioLength > maxBioLength * 0.9 ? 'text-orange-600' : 'text-gray-600'}">
							{maxBioLength - bioLength}
						</span>
					</div>
				</div>
			</div>
			<p class="mt-1 text-xs text-gray-500">
				A short bio helps others connect with you
			</p>
		</div>

		<!-- Location -->
		<div>
			<label for="location" class="block text-sm font-medium text-gray-700 mb-2">
				<div class="flex items-center gap-2">
					<MapPin class="w-4 h-4" />
					Location (Optional)
				</div>
			</label>
			<div class="relative">
				<input
					id="location"
					type="text"
					value={locationInput}
					oninput={handleLocationInput}
					onblur={handleLocationBlur}
					onfocus={() => showLocationSuggestions = true}
					placeholder="Where are you based?"
					class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
						focus:ring-blue-500 focus:border-transparent transition-all duration-200
						placeholder-gray-400"
				/>
				
				{#if showLocationSuggestions && filteredLocations.length > 0}
					<div class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
						{#each filteredLocations as loc}
							<button
								onclick={() => selectLocation(loc)}
								class="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors
									first:rounded-t-lg last:rounded-b-lg"
							>
								<div class="flex items-center gap-2">
									<MapPin class="w-4 h-4 text-gray-400" />
									<span class="text-gray-700">{loc}</span>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>
			<p class="mt-1 text-xs text-gray-500">
				Helps connect you with local fashion communities
			</p>
		</div>

		<!-- Tips -->
		<div class="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
			<div class="flex gap-3">
				<AlertCircle class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
				<div class="text-sm">
					<p class="font-medium text-blue-900 mb-2">Profile Tips:</p>
					<ul class="space-y-1 text-blue-800">
						<li>• Use your real name or a name you're comfortable with</li>
						<li>• Share your fashion interests in your bio</li>
						<li>• Adding a location helps with local connections</li>
						<li>• You can update these details anytime</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</div>