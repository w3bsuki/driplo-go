import { onMount, onDestroy } from 'svelte';
import { 
	unreadCount, 
	initializeUnreadCount, 
	subscribeToUnreadUpdates, 
	unsubscribeFromUnreadUpdates 
} from '$lib/stores/messages';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';

/**
 * Notification management hook for real-time unread message counts
 * Handles subscription lifecycle and cleanup with improved error handling
 */
export function useNotifications(
	supabase: SupabaseClient<Database>,
	userId: string | undefined
) {
	let isSubscribed = false;
	let currentSupabase = supabase;
	let currentUserId = userId;
	
	/**
	 * Initialize notifications when user is available
	 * Includes debouncing and error handling
	 */
	function initialize() {
		if (!currentUserId || isSubscribed) return;
		
		try {
			// Clean up any existing subscription first
			cleanup();
			
			// Initialize fresh subscription with current supabase client
			initializeUnreadCount();
			subscribeToUnreadUpdates(currentUserId, currentSupabase);
			isSubscribed = true;
		} catch (error) {
			console.error('Failed to initialize notifications:', error);
			isSubscribed = false;
		}
	}
	
	/**
	 * Clean up subscriptions with error handling
	 */
	function cleanup() {
		if (isSubscribed && currentSupabase) {
			try {
				unsubscribeFromUnreadUpdates(currentSupabase);
			} catch (error) {
				console.error('Error cleaning up notifications:', error);
			} finally {
				isSubscribed = false;
			}
		}
	}
	
	/**
	 * Update the supabase client and user ID
	 * Called when reactive values change
	 */
	function updateContext(newSupabase: SupabaseClient<Database>, newUserId: string | undefined) {
		const hasChanged = currentSupabase !== newSupabase || currentUserId !== newUserId;
		
		if (hasChanged) {
			// Clean up with old client
			if (isSubscribed && currentSupabase) {
				try {
					unsubscribeFromUnreadUpdates(currentSupabase);
				} catch (error) {
					console.error('Error during context update cleanup:', error);
				}
				isSubscribed = false;
			}
			
			// Update references
			currentSupabase = newSupabase;
			currentUserId = newUserId;
		}
	}
	
	/**
	 * Reset unread count (when opening messages page)
	 */
	function resetUnreadCount() {
		unreadCount.set(0);
	}
	
	// Clean up on destroy
	onDestroy(() => {
		cleanup();
	});
	
	return {
		unreadCount,
		initialize,
		cleanup,
		resetUnreadCount,
		updateContext
	};
}