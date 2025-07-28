<script lang="ts">
	import { Search, Shield, Ban } from 'lucide-svelte'
	import type { PageData } from './$types'
	
	interface Props {
		data: PageData
	}
	
	let { data }: Props = $props()
	
	let searchQuery = $state('')
	
	const filteredUsers = $derived(
		data.users.filter(user => 
			user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
		)
	)
</script>

<div>
	<h1 class="text-3xl font-bold text-gray-900 mb-8">Users Management</h1>
	
	<!-- Search -->
	<div class="mb-6">
		<div class="relative max-w-md">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search users..."
				class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>
	</div>
	
	<!-- Users Table -->
	<div class="bg-white shadow rounded-lg overflow-hidden">
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							User
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Type
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Status
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Joined
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Actions
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each filteredUsers as user}
						<tr>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex items-center">
									<div class="flex-shrink-0 h-10 w-10">
										{#if user.avatar_url}
											<img class="h-10 w-10 rounded-full" src={user.avatar_url} alt="">
										{:else}
											<div class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
												<span class="text-gray-600 font-medium">
													{(user.username || user.email).charAt(0).toUpperCase()}
												</span>
											</div>
										{/if}
									</div>
									<div class="ml-4">
										<div class="text-sm font-medium text-gray-900">
											{user.username || 'No username'}
										</div>
										<div class="text-sm text-gray-500">
											{user.email}
										</div>
									</div>
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
									{user.account_type === 'brand' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}">
									{user.account_type || 'personal'}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex gap-2">
									{#if user.is_admin}
										<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
											Admin
										</span>
									{/if}
									{#if user.is_verified}
										<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
											Verified
										</span>
									{/if}
									{#if user.is_seller}
										<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
											Seller
										</span>
									{/if}
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{new Date(user.created_at).toLocaleDateString()}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
								<div class="flex gap-2">
									<button
										class="text-blue-600 hover:text-blue-900"
										title="View Profile"
									>
										View
									</button>
									{#if !user.is_admin}
										<button
											class="text-yellow-600 hover:text-yellow-900"
											title="Make Admin"
										>
											<Shield class="w-4 h-4" />
										</button>
									{/if}
									<button
										class="text-red-600 hover:text-red-900"
										title="Ban User"
									>
										<Ban class="w-4 h-4" />
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>