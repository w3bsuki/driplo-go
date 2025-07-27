<script lang="ts">
	import { enhance } from '$app/forms'
	import { Check, X, Eye } from 'lucide-svelte'
	import type { PageData } from './$types'
	
	interface Props {
		data: PageData
	}
	
	let { data }: Props = $props()
	
	let selectedRequest = $state<any>(null)
	let showRejectModal = $state(false)
	let rejectingId = $state('')
</script>

<div>
	<h1 class="text-3xl font-bold text-gray-900 mb-8">Brand Verification Requests</h1>
	
	<div class="bg-white shadow rounded-lg">
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Brand Name
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							User
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Status
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Submitted
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Actions
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each data.requests as request}
						<tr>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm font-medium text-gray-900">
									{request.profiles.brand_name || 'N/A'}
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-900">{request.profiles.username}</div>
								<div class="text-sm text-gray-500">{request.profiles.email}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
									{request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
									{request.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
									{request.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}">
									{request.status}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{new Date(request.created_at).toLocaleDateString()}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
								<div class="flex gap-2">
									<button
										onclick={() => selectedRequest = request}
										class="text-blue-600 hover:text-blue-900"
									>
										<Eye class="w-5 h-5" />
									</button>
									{#if request.status === 'pending'}
										<form method="POST" action="?/approve" use:enhance>
											<input type="hidden" name="requestId" value={request.id} />
											<input type="hidden" name="userId" value={request.user_id} />
											<button
												type="submit"
												class="text-green-600 hover:text-green-900"
											>
												<Check class="w-5 h-5" />
											</button>
										</form>
										<button
											onclick={() => { rejectingId = request.id; showRejectModal = true }}
											class="text-red-600 hover:text-red-900"
										>
											<X class="w-5 h-5" />
										</button>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- Details Modal -->
{#if selectedRequest}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
			<h2 class="text-xl font-bold mb-4">Verification Request Details</h2>
			<div class="space-y-4">
				<div>
					<h3 class="font-semibold">Brand Name</h3>
					<p>{selectedRequest.profiles.brand_name}</p>
				</div>
				<div>
					<h3 class="font-semibold">Business Type</h3>
					<p>{selectedRequest.business_type}</p>
				</div>
				<div>
					<h3 class="font-semibold">Business Description</h3>
					<p>{selectedRequest.business_description}</p>
				</div>
				{#if selectedRequest.documents}
					<div>
						<h3 class="font-semibold">Submitted Documents</h3>
						<ul class="list-disc list-inside">
							{#each selectedRequest.documents as doc}
								<li>{doc}</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
			<button
				onclick={() => selectedRequest = null}
				class="mt-6 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
			>
				Close
			</button>
		</div>
	</div>
{/if}

<!-- Reject Modal -->
{#if showRejectModal}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 max-w-md w-full">
			<h2 class="text-xl font-bold mb-4">Reject Verification</h2>
			<form method="POST" action="?/reject" use:enhance={() => {
				return async ({ result }) => {
					if (result.type === 'success') {
						showRejectModal = false
					}
				}
			}}>
				<input type="hidden" name="requestId" value={rejectingId} />
				<div class="mb-4">
					<label for="reason" class="block text-sm font-medium text-gray-700 mb-2">
						Rejection Reason
					</label>
					<textarea
						name="reason"
						id="reason"
						rows="4"
						required
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="Please provide a reason for rejection..."
					></textarea>
				</div>
				<div class="flex gap-3 justify-end">
					<button
						type="button"
						onclick={() => showRejectModal = false}
						class="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
					>
						Reject
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}