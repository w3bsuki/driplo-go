<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';
	import { CheckCircle, Mail, User } from 'lucide-svelte';
	
	let { data }: { data: PageData } = $props();
	
	let verifying = $state<string | null>(null);
</script>

<svelte:head>
	<title>Verify User Emails - Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="container mx-auto px-4">
		<div class="max-w-4xl mx-auto">
			<h1 class="text-3xl font-bold text-gray-900 mb-8">Verify User Emails</h1>
			
			{#if data.unverifiedUsers.length === 0}
				<div class="bg-white rounded-lg shadow p-8 text-center">
					<CheckCircle class="w-16 h-16 text-green-500 mx-auto mb-4" />
					<p class="text-gray-600">All users have verified emails!</p>
				</div>
			{:else}
				<div class="bg-white rounded-lg shadow overflow-hidden">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									User
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Email
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Registered
								</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Action
								</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each data.unverifiedUsers as user}
								<tr>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="flex items-center">
											<User class="w-5 h-5 text-gray-400 mr-2" />
											<div>
												<div class="text-sm font-medium text-gray-900">
													{user.full_name || user.username || 'Unknown'}
												</div>
												{#if user.username}
													<div class="text-sm text-gray-500">@{user.username}</div>
												{/if}
											</div>
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap">
										<div class="flex items-center">
											<Mail class="w-4 h-4 text-gray-400 mr-2" />
											<span class="text-sm text-gray-900">{user.email || 'N/A'}</span>
										</div>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{new Date(user.created_at).toLocaleDateString()}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
										<form
											method="POST"
											action="?/verifyEmail"
											use:enhance={() => {
												verifying = user.id;
												return async ({ result }) => {
													verifying = null;
													if (result.type === 'success') {
														toast.success('Email verified successfully!');
														// Remove from list
														data.unverifiedUsers = data.unverifiedUsers.filter(u => u.id !== user.id);
													} else {
														toast.error('Failed to verify email');
													}
												};
											}}
										>
											<input type="hidden" name="userId" value={user.id} />
											<button
												type="submit"
												disabled={verifying === user.id}
												class="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
											>
												{#if verifying === user.id}
													Verifying...
												{:else}
													Verify Email
												{/if}
											</button>
										</form>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</div>