
export interface Notification {
	id: string;
	type: 'success' | 'error' | 'info' | 'warning';
	title: string;
	description?: string;
	duration?: number;
	action?: {
		label: string;
		callback: () => void;
	};
}

class NotificationStore {
	private notifications = $state<Notification[]>([]);
	private timeouts = new Map<string, number>();
	
	get all() {
		return this.notifications;
	}
	
	show(notification: Omit<Notification, 'id'>) {
		const id = crypto.randomUUID();
		const duration = notification.duration ?? 5000;
		
		this.notifications = [...this.notifications, { ...notification, id }];
		
		if (duration > 0) {
			const timeout = window.setTimeout(() => {
				this.dismiss(id);
			}, duration);
			
			this.timeouts.set(id, timeout);
		}
		
		return id;
	}
	
	dismiss(id: string) {
		this.notifications = this.notifications.filter(n => n.id !== id);
		
		const timeout = this.timeouts.get(id);
		if (timeout) {
			clearTimeout(timeout);
			this.timeouts.delete(id);
		}
	}
	
	clear() {
		this.notifications = [];
		this.timeouts.forEach(timeout => clearTimeout(timeout));
		this.timeouts.clear();
	}
	
	// Helper methods
	success(title: string, description?: string) {
		return this.show({ type: 'success', title, description });
	}
	
	error(title: string, description?: string) {
		return this.show({ type: 'error', title, description });
	}
	
	info(title: string, description?: string) {
		return this.show({ type: 'info', title, description });
	}
	
	warning(title: string, description?: string) {
		return this.show({ type: 'warning', title, description });
	}
}

export const notifications = new NotificationStore();

// Export helper functions for convenience
export const showSuccess = (title: string, description?: string) => 
	notifications.success(title, description);

export const showError = (title: string, description?: string) => 
	notifications.error(title, description);

export const showInfo = (title: string, description?: string) => 
	notifications.info(title, description);

export const showWarning = (title: string, description?: string) => 
	notifications.show({ type: 'warning', title, description });