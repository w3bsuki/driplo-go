<script lang="ts" generics="T">
	import { cn } from '$lib/utils';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import type { Snippet } from 'svelte';

	interface Column<T> {
		key: keyof T | string;
		header: string;
		cell?: (item: T) => string;
		className?: string;
	}

	interface Props<T> {
		data: T[];
		columns: Column<T>[];
		class?: string;
		onRowClick?: (item: T) => void;
		getRowKey?: (item: T) => string;
		emptyMessage?: string;
	}

	let {
		data,
		columns,
		class: className,
		onRowClick,
		getRowKey = (item, index) => index.toString(),
		emptyMessage = 'No data available'
	}: Props<T> = $props();

	function getCellValue(item: T, column: Column<T>): string {
		if (column.cell) {
			return column.cell(item);
		}
		const value = item[column.key as keyof T];
		return value != null ? String(value) : '';
	}
</script>

<div class={cn('w-full', className)}>
	<Table>
		<TableHeader>
			<TableRow>
				{#each columns as column}
					<TableHead class={column.className}>
						{column.header}
					</TableHead>
				{/each}
			</TableRow>
		</TableHeader>
		<TableBody>
			{#if data.length === 0}
				<TableRow>
					<TableCell
						colspan={columns.length}
						class="h-24 text-center text-gray-500"
					>
						{emptyMessage}
					</TableCell>
				</TableRow>
			{:else}
				{#each data as item, index}
					<TableRow
						class={cn(
							onRowClick && 'cursor-pointer'
						)}
						onclick={() => onRowClick?.(item)}
					>
						{#each columns as column}
							<TableCell class={column.className}>
								{getCellValue(item, column)}
							</TableCell>
						{/each}
					</TableRow>
				{/each}
			{/if}
		</TableBody>
	</Table>
</div>