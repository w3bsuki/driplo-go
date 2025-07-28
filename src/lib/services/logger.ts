export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
	level: LogLevel;
	message: string;
	data?: any;
	timestamp: number;
}

class Logger {
	private static instance: Logger;
	private logQueue: LogEntry[] = [];
	private isProduction = !import.meta.env['DEV'];
	
	private constructor() {}
	
	static getInstance(): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger();
		}
		return Logger.instance;
	}
	
	private log(level: LogLevel, message: string, data?: any): void {
		const entry: LogEntry = {
			level,
			message,
			data,
			timestamp: Date.now()
		};
		
		if (this.isProduction) {
			// In production, queue logs for batch sending
			this.logQueue.push(entry);
			
			// TODO: Implement batch sending to monitoring service
			// For now, just limit queue size
			if (this.logQueue.length > 100) {
				this.logQueue.shift();
			}
		} else {
			// In development, use console
			const consoleMethod = level === 'debug' ? 'log' : level;
			console[consoleMethod](`[${level.toUpperCase()}] ${message}`, data || '');
		}
	}
	
	debug(message: string, data?: any): void {
		this.log('debug', message, data);
	}
	
	info(message: string, data?: any): void {
		this.log('info', message, data);
	}
	
	warn(message: string, data?: any): void {
		this.log('warn', message, data);
	}
	
	error(message: string, error?: Error | any): void {
		const errorData = error instanceof Error ? {
			message: error.message,
			stack: error.stack,
			name: error.name
		} : error;
		
		this.log('error', message, errorData);
	}
	
	// Get queued logs (useful for debugging or manual sending)
	getQueuedLogs(): LogEntry[] {
		return [...this.logQueue];
	}
	
	// Clear queued logs
	clearQueue(): void {
		this.logQueue = [];
	}
}

// Export singleton instance
export const logger = Logger.getInstance();