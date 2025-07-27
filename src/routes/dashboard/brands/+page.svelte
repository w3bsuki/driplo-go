<script lang="ts">
	import { 
		Building2, 
		Search, 
		Filter, 
		CheckCircle, 
		XCircle, 
		Clock,
		ExternalLink,
		Calendar,
		AlertCircle
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import type { PageData } from './$types';

	interface Props {
		data: PageData
	}

	let { data }: Props = $props();

	let searchTerm = $state('');
	let filterStatus = $state('all');
	let selectedRequests = $state<Set<string>>(new Set());

	const filteredRequests = $derived(
		data.requests.filter(request => {
			const matchesSearch = request.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				request.brand_category.toLowerCase().includes(searchTerm.toLowerCase());
			
			const matchesFilter = filterStatus === 'all' || request.verification_status === filterStatus;
			
			return matchesSearch && matchesFilter;
		})
	);

	function toggleSelection(requestId: string) {
		const newSelection = new Set(selectedRequests);
		if (newSelection.has(requestId)) {
			newSelection.delete(requestId);
		} else {
			newSelection.add(requestId);
		}
		selectedRequests = newSelection;
	}

	function toggleAll() {
		if (selectedRequests.size === filteredRequests.length) {
			selectedRequests = new Set();
		} else {
			selectedRequests = new Set(filteredRequests.map(r => r.id));
		}
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'approved':
				return 'bg-green-100 text-green-700';
			case 'rejected':
				return 'bg-red-100 text-red-700';
			case 'more_info_needed':
				return 'bg-yellow-100 text-yellow-700';
			default:
				return 'bg-gray-100 text-gray-700';
		}
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'approved':
				return CheckCircle;
			case 'rejected':
				return XCircle;
			case 'more_info_needed':
				return AlertCircle;
			default:
				return Clock;
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Brand Verification Requests</h1>
			<p class="text-gray-600 mt-1">Review and approve brand account applications</p>
		</div>
		<div class="flex items-center gap-2">
			<span class="text-sm text-gray-600">
				{data.stats.pending} pending • {data.stats.approved} approved this month
			</span>
		</div>
	</div>

	<!-- Filters and Search -->
	<div class="bg-white rounded-lg shadow-sm p-4">
		<div class="flex flex-col sm:flex-row gap-4">
			<!-- Search -->
			<div class="flex-1 relative">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
				<input
					type="text"
					bind:value={searchTerm}
					placeholder="Search by brand name or category..."
					class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
						focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				/>
			</div>

			<!-- Status Filter -->
			<select
				bind:value={filterStatus}
				class="px-4 py-2 border border-gray-300 rounded-lg
					focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			>
				<option value="all">All Status</option>
				<option value="pending">Pending</option>
				<option value="approved">Approved</option>
				<option value="rejected">Rejected</option>
				<option value="more_info_needed">More Info Needed</option>
			</select>

			{#if selectedRequests.size > 0}
				<div class="flex items-center gap-2">
					<span class="text-sm text-gray-600">
						{selectedRequests.size} selected
					</span>
					<button
						class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700
							transition-colors text-sm font-medium"
					>
						Bulk Approve
					</button>
					<button
						class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700
							transition-colors text-sm font-medium"
					>
						Bulk Reject
					</button>
				</div>
			{/if}
		</div>
	</div>

	<!-- Requests Table -->
	<div class="bg-white rounded-lg shadow-sm overflow-hidden">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left">
						<input
							type="checkbox"
							checked={selectedRequests.size === filteredRequests.length && filteredRequests.length > 0}
							onchange={handleToggleAll}
							class="rounded"
						/>
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Brand Info
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Category
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Social Media
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
				{#if filteredRequests.length === 0}
					<tr>
						<td colspan="7" class="px-6 py-12 text-center text-gray-500">
							<Building2 class="w-12 h-12 text-gray-400 mx-auto mb-3" />
							<p>No brand verification requests found</p>
						</td>
					</tr>
				{:else}
					{#each filteredRequests as request}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4">
								<input
									type="checkbox"
									checked={selectedRequests.has(request.id)}
									onchange={() => toggleSelection(request.id)}
									class="rounded"
								/>
							</td>
							<td class="px-6 py-4">
								<div>
									<p class="font-medium text-gray-900">{request.brand_name}</p>
									<p class="text-sm text-gray-500">@{request.username}</p>
								</div>
							</td>
							<td class="px-6 py-4 text-sm text-gray-600">
								{request.brand_category}
							</td>
							<td class="px-6 py-4">
								{#if request.social_media_accounts && Object.keys(request.social_media_accounts).length > 0}
									<div class="flex gap-1">
										{#each Object.entries(request.social_media_accounts).slice(0, 3) as [platform, account]}
											<span class="text-xs bg-gray-100 px-2 py-1 rounded">
												{platform}
											</span>
										{/each}
										{#if Object.keys(request.social_media_accounts).length > 3}
											<span class="text-xs text-gray-500">
												+{Object.keys(request.social_media_accounts).length - 3}
											</span>
										{/if}
									</div>
								{:else}
									<span class="text-sm text-gray-400">No links</span>
								{/if}
							</td>
							<td class="px-6 py-4">
								<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
									{getStatusColor(request.verification_status)}">
									<svelte:component this={getStatusIcon(request.verification_status)} class="w-3 h-3" />
									{request.verification_status.replace('_', ' ')}
								</span>
							</td>
							<td class="px-6 py-4 text-sm text-gray-600">
								<div class="flex items-center gap-1">
									<Calendar class="w-3 h-3" />
									{formatDate(request.submitted_at)}
								</div>
							</td>
							<td class="px-6 py-4">
								<div class="flex items-center gap-2">
									<a
										href="/admin/brands/{request.id}"
										class="text-blue-600 hover:text-blue-700 font-medium text-sm"
									>
										Review
									</a>
									<a
										href="/profile/{request.username}"
										target="_blank"
										class="text-gray-500 hover:text-gray-700"
										title="View Profile"
									>
										<ExternalLink class="w-4 h-4" />
									</a>
								</div>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>