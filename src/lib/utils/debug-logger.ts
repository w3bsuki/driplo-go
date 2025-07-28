// Debug logger utility for development
// Enable by setting DEBUG=true in environment or localStorage

interface LogContext {
  component?: string;
  data?: any;
  timestamp?: boolean;
}

class DebugLogger {
  private enabled: boolean;
  private enabledComponents: Set<string>;

  constructor() {
    // Check multiple sources for debug flag
    this.enabled = this.checkDebugEnabled();
    this.enabledComponents = this.getEnabledComponents();
    
    if (this.enabled) {
      console.log('%c🐛 Debug Logging Enabled', 'color: #10b981; font-weight: bold; font-size: 14px');
      console.log('Enabled components:', Array.from(this.enabledComponents).join(', ') || 'ALL');
    }
  }

  private checkDebugEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check localStorage
    const localDebug = localStorage.getItem('DEBUG');
    if (localDebug === 'true' || localDebug === '*') return true;
    
    // Check URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === 'true') return true;
    
    // Check environment (for dev builds) - DISABLED
    // if (import.meta.env.DEV) return true;
    
    return false;
  }

  private getEnabledComponents(): Set<string> {
    if (typeof window === 'undefined') return new Set(['*']);
    
    const components = localStorage.getItem('DEBUG_COMPONENTS');
    if (!components || components === '*') return new Set(['*']);
    
    return new Set(components.split(',').map(c => c.trim()));
  }

  private shouldLog(component?: string): boolean {
    if (!this.enabled) return false;
    if (this.enabledComponents.has('*')) return true;
    if (component && this.enabledComponents.has(component)) return true;
    return false;
  }

  private formatMessage(message: string, context?: LogContext): string {
    const parts = [];
    
    if (context?.timestamp !== false) {
      parts.push(`[${new Date().toISOString()}]`);
    }
    
    if (context?.component) {
      parts.push(`[${context.component}]`);
    }
    
    parts.push(message);
    
    return parts.join(' ');
  }

  log(message: string, context?: LogContext) {
    if (!this.shouldLog(context?.component)) return;
    
    const formattedMessage = this.formatMessage(message, context);
    
    if (context?.data) {
      console.log(`%c${formattedMessage}`, 'color: #3b82f6', context.data);
    } else {
      console.log(`%c${formattedMessage}`, 'color: #3b82f6');
    }
  }

  warn(message: string, context?: LogContext) {
    if (!this.shouldLog(context?.component)) return;
    
    const formattedMessage = this.formatMessage(message, context);
    
    if (context?.data) {
      console.warn(`%c${formattedMessage}`, 'color: #f59e0b', context.data);
    } else {
      console.warn(`%c${formattedMessage}`, 'color: #f59e0b');
    }
  }

  error(message: string, context?: LogContext) {
    if (!this.shouldLog(context?.component)) return;
    
    const formattedMessage = this.formatMessage(message, context);
    
    if (context?.data) {
      console.error(`%c${formattedMessage}`, 'color: #ef4444', context.data);
    } else {
      console.error(`%c${formattedMessage}`, 'color: #ef4444');
    }
  }

  group(label: string, fn: () => void) {
    if (!this.enabled) {
      fn();
      return;
    }
    
    console.group(`%c${label}`, 'color: #8b5cf6; font-weight: bold');
    fn();
    console.groupEnd();
  }

  table(data: any, columns?: string[]) {
    if (!this.enabled) return;
    console.table(data, columns);
  }

  // Helper to enable debug mode programmatically
  enable(components: string = '*') {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('DEBUG', 'true');
    localStorage.setItem('DEBUG_COMPONENTS', components);
    this.enabled = true;
    this.enabledComponents = components === '*' ? new Set(['*']) : new Set(components.split(','));
    
    console.log('%c🐛 Debug Logging Enabled', 'color: #10b981; font-weight: bold; font-size: 14px');
  }

  // Helper to disable debug mode
  disable() {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('DEBUG');
    localStorage.removeItem('DEBUG_COMPONENTS');
    this.enabled = false;
    this.enabledComponents.clear();
    
    console.log('%c🐛 Debug Logging Disabled', 'color: #ef4444; font-weight: bold; font-size: 14px');
  }
}

// Export singleton instance
export const debug = new DebugLogger();

// Export for console access
if (typeof window !== 'undefined') {
  (window as any).debug = debug;
}