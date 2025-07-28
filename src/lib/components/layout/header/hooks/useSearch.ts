import { goto } from '$app/navigation';
import { writable } from 'svelte/store';

/**
 * Search functionality hook for the header search bar
 * Provides search state management and navigation
 */
export function useSearch() {
	const searchQuery = writable('');
	let debounceTimer: NodeJS.Timeout;
	
	/**
	 * Handle search execution
	 * Navigates to browse page with search query
	 */
	function handleSearch(query: string) {
		const trimmedQuery = query.trim();
		if (trimmedQuery) {
			goto(`/browse?q=${encodeURIComponent(trimmedQuery)}`);
		} else {
			goto('/browse');
		}
	}
	
	/**
	 * Handle search with debouncing
	 * Useful for search-as-you-type functionality
	 */
	function handleDebouncedSearch(query: string, delay: number = 300) {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			handleSearch(query);
		}, delay);
	}
	
	/**
	 * Clear search and navigate to browse
	 */
	function clearSearch() {
		searchQuery.set('');
		goto('/browse');
	}
	
	/**
	 * Clean up timers on component destroy
	 */
	function cleanup() {
		clearTimeout(debounceTimer);
	}
	
	return {
		searchQuery,
		handleSearch,
		handleDebouncedSearch,
		clearSearch,
		cleanup
	};
}