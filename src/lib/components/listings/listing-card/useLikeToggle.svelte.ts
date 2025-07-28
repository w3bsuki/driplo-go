import * as m from '$lib/paraglide/messages.js';

// Constants
const API_RETRY_DELAY = 1000;
const API_MAX_RETRIES = 2;

export interface UseLikeToggleOptions {
	id: string;
	initialLiked?: boolean;
	initialLikes?: number;
	onError?: (error: string) => void;
}

export interface UseLikeToggleReturn {
	liked: boolean;
	likeCount: number;
	likeLoading: boolean;
	apiError: string | null;
	handleToggleLike: (e: MouseEvent) => Promise<void>;
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 0): Promise<Response> {
	try {
		return await fetch(url, options);
	} catch (error) {
		if (retries < API_MAX_RETRIES) {
			await new Promise(resolve => setTimeout(resolve, API_RETRY_DELAY));
			return fetchWithRetry(url, options, retries + 1);
		}
		throw error;
	}
}

export function useLikeToggle(options: UseLikeToggleOptions): UseLikeToggleReturn {
	const { id, initialLiked = false, initialLikes = 0, onError } = options;
	
	// State
	let liked = $state(initialLiked);
	let likeCount = $state(initialLikes);
	let likeLoading = $state(false);
	let apiError = $state<string | null>(null);
	
	async function handleToggleLike(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		
		if (likeLoading) return;
		
		likeLoading = true;
		apiError = null;
		
		// Store original state for rollback
		const originalLiked = liked;
		const originalCount = likeCount;
		
		// Optimistic update
		liked = !liked;
		likeCount = liked ? likeCount + 1 : likeCount - 1;
		
		try {
			const response = await fetchWithRetry('/api/wishlist', {
				method: liked ? 'POST' : 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					listing_id: id
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || m.listing_favorite_error());
			}
		} catch (error) {
			// Revert on error
			liked = originalLiked;
			likeCount = originalCount;
			
			const errorMessage = error instanceof Error ? error.message : m.listing_favorite_error();
			apiError = errorMessage;
			
			if (onError) {
				onError(errorMessage);
			}
			
			console.error('Error toggling like:', error);
		} finally {
			likeLoading = false;
		}
	}
	
	return {
		get liked() { return liked; },
		get likeCount() { return likeCount; },
		get likeLoading() { return likeLoading; },
		get apiError() { return apiError; },
		handleToggleLike
	};
}