<script lang="ts">
	import { cn } from '$lib/utils';
	import Button from '$lib/components/ui/button.svelte';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
		SelectValue
	} from '$lib/components/ui/select';
	import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-svelte';

	interface Props {
		page: number;
		pageSize: number;
		totalItems: number;
		onPageChange: (page: number) => void;
		onPageSizeChange: (pageSize: number) => void;
		pageSizeOptions?: number[];
		class?: string;
	}

	let {
		page,
		pageSize,
		totalItems,
		onPageChange,
		onPageSizeChange,
		pageSizeOptions = [10, 20, 30, 40, 50],
		class: className
	}: Props = $props();

	let totalPages = $derived(Math.ceil(totalItems / pageSize));
	let startItem = $derived((page - 1) * pageSize + 1);
	let endItem = $derived(Math.min(page * pageSize, totalItems));

	function handlePageSizeChange(value: string) {
		const newPageSize = parseInt(value);
		onPageSizeChange(newPageSize);
		// Reset to first page when page size changes
		if (page > 1) {
			onPageChange(1);
		}
	}
</script>

<div class={cn('flex items-center justify-between px-2', className)}>
	<div class="flex-1 text-sm text-gray-600">
		{#if totalItems > 0}
			Showing {startItem} to {endItem} of {totalItems} results
		{:else}
			No results
		{/if}
	</div>
	<div class="flex items-center space-x-6 lg:space-x-8">
		<div class="flex items-center space-x-2">
			<p class="text-sm font-medium">Rows per page</p>
			<Select
				value={pageSize.toString()}
				onValueChange={handlePageSizeChange}
			>
				<SelectTrigger class="h-8 w-[70px]">
					<SelectValue placeholder={pageSize.toString()} />
				</SelectTrigger>
				<SelectContent side="top">
					{#each pageSizeOptions as option}
						<SelectItem value={option.toString()}>
							{option}
						</SelectItem>
					{/each}
				</SelectContent>
			</Select>
		</div>
		<div class="flex w-[100px] items-center justify-center text-sm font-medium">
			Page {page} of {totalPages}
		</div>
		<div class="flex items-center space-x-2">
			<Button
				variant="outline"
				class="h-8 w-8 p-0"
				onclick={() => onPageChange(1)}
				disabled={page === 1}
			>
				<span class="sr-only">Go to first page</span>
				<ChevronsLeft class="h-4 w-4" />
			</Button>
			<Button
				variant="outline"
				class="h-8 w-8 p-0"
				onclick={() => onPageChange(page - 1)}
				disabled={page === 1}
			>
				<span class="sr-only">Go to previous page</span>
				<ChevronLeft class="h-4 w-4" />
			</Button>
			<Button
				variant="outline"
				class="h-8 w-8 p-0"
				onclick={() => onPageChange(page + 1)}
				disabled={page === totalPages}
			>
				<span class="sr-only">Go to next page</span>
				<ChevronRight class="h-4 w-4" />
			</Button>
			<Button
				variant="outline"
				class="h-8 w-8 p-0"
				onclick={() => onPageChange(totalPages)}
				disabled={page === totalPages}
			>
				<span class="sr-only">Go to last page</span>
				<ChevronsRight class="h-4 w-4" />
			</Button>
		</div>
	</div>
</div>