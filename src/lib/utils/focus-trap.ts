// Focus trap utility for modals and dropdowns
export class FocusTrap {
  private element: HTMLElement
  private previouslyFocusedElement: HTMLElement | null = null
  private focusableElements: HTMLElement[] = []
  private firstFocusableElement: HTMLElement | null = null
  private lastFocusableElement: HTMLElement | null = null
  private _onKeyDown: (e: KeyboardEvent) => void
  
  constructor(element: HTMLElement, options: {
    initialFocus?: HTMLElement | string
    returnFocus?: boolean
    escapeDeactivates?: boolean
    onDeactivate?: () => void
  } = {}) {
    this.element = element
    const { 
      initialFocus, 
      returnFocus = true, 
      escapeDeactivates = true,
      onDeactivate 
    } = options
    
    // Store currently focused element
    if (returnFocus) {
      this.previouslyFocusedElement = document.activeElement as HTMLElement
    }
    
    // Find all focusable elements
    this.updateFocusableElements()
    
    // Set initial focus
    if (initialFocus) {
      const initialElement = typeof initialFocus === 'string'
        ? element.querySelector(initialFocus) as HTMLElement
        : initialFocus
      
      if (initialElement) {
        initialElement.focus()
      } else if (this.firstFocusableElement) {
        this.firstFocusableElement.focus()
      }
    } else if (this.firstFocusableElement) {
      this.firstFocusableElement.focus()
    }
    
    // Handle keyboard navigation
    this.handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        this.handleTab(e)
      } else if (e.key === 'Escape' && escapeDeactivates) {
        this.deactivate()
        if (onDeactivate) onDeactivate()
      }
    }
    
    document.addEventListener('keydown', this.handleKeyDown)
  }
  
  private updateFocusableElements(): void {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ]
    
    this.focusableElements = Array.from(
      this.element.querySelectorAll(focusableSelectors.join(','))
    ) as HTMLElement[]
    
    this.firstFocusableElement = this.focusableElements[0] || null
    this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1] || null
  }
  
  private handleTab(e: KeyboardEvent): void {
    if (!this.firstFocusableElement || !this.lastFocusableElement) return
    
    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === this.firstFocusableElement) {
        e.preventDefault()
        this.lastFocusableElement.focus()
      }
    } else {
      // Tab
      if (document.activeElement === this.lastFocusableElement) {
        e.preventDefault()
        this.firstFocusableElement.focus()
      }
    }
  }
  
  public deactivate(): void {
    document.removeEventListener('keydown', this.handleKeyDown)
    
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus()
    }
  }
  
  public pause(): void {
    document.removeEventListener('keydown', this.handleKeyDown)
  }
  
  public unpause(): void {
    document.addEventListener('keydown', this.handleKeyDown)
  }
  
  public updateElements(): void {
    this.updateFocusableElements()
  }
}

// Svelte action for focus trap
export function focusTrap(
  node: HTMLElement,
  options: {
    enabled?: boolean
    initialFocus?: HTMLElement | string
    returnFocus?: boolean
    escapeDeactivates?: boolean
    onDeactivate?: () => void
  } = {}
) {
  let trap: FocusTrap | null = null
  
  function update(newOptions: typeof options) {
    if (newOptions.enabled && !trap) {
      trap = new FocusTrap(node, newOptions)
    } else if (!newOptions.enabled && trap) {
      trap.deactivate()
      trap = null
    }
  }
  
  update(options)
  
  return {
    update,
    destroy() {
      if (trap) {
        trap.deactivate()
      }
    }
  }
}

// Roving tabindex for lists and menus
export class RovingTabIndex {
  private container: HTMLElement
  private items: HTMLElement[] = []
  private currentIndex = 0
  
  constructor(container: HTMLElement, itemSelector = '[role="menuitem"], [role="option"], li') {
    this.container = container
    this.updateItems(itemSelector)
    
    this.container.addEventListener('keydown', this.handleKeyDown.bind(this))
    this.container.addEventListener('click', this.handleClick.bind(this))
  }
  
  private updateItems(selector: string): void {
    this.items = Array.from(this.container.querySelectorAll(selector)) as HTMLElement[]
    
    // Set initial tabindex
    this.items.forEach((item, index) => {
      item.tabIndex = index === this.currentIndex ? 0 : -1
    })
  }
  
  private handleKeyDown(e: KeyboardEvent): void {
    const key = e.key
    let newIndex = this.currentIndex
    
    switch (key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault()
        newIndex = (this.currentIndex + 1) % this.items.length
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault()
        newIndex = (this.currentIndex - 1 + this.items.length) % this.items.length
        break
      case 'Home':
        e.preventDefault()
        newIndex = 0
        break
      case 'End':
        e.preventDefault()
        newIndex = this.items.length - 1
        break
      default:
        return
    }
    
    this.setActiveIndex(newIndex)
  }
  
  private handleClick(e: MouseEvent): void {
    const target = e.target as HTMLElement
    const index = this.items.indexOf(target)
    
    if (index !== -1) {
      this.setActiveIndex(index)
    }
  }
  
  private setActiveIndex(index: number): void {
    // Update tabindex
    this.items[this.currentIndex].tabIndex = -1
    this.items[index].tabIndex = 0
    
    // Focus the new item
    this.items[index].focus()
    
    this.currentIndex = index
  }
  
  public destroy(): void {
    this.container.removeEventListener('keydown', this.handleKeyDown.bind(this))
    this.container.removeEventListener('click', this.handleClick.bind(this))
  }
}

// Svelte action for roving tabindex
export function rovingTabIndex(
  node: HTMLElement,
  options: {
    itemSelector?: string
    enabled?: boolean
  } = {}
) {
  let roving: RovingTabIndex | null = null
  
  function update(newOptions: typeof options) {
    if (newOptions.enabled !== false && !roving) {
      roving = new RovingTabIndex(node, newOptions.itemSelector)
    } else if (newOptions.enabled === false && roving) {
      roving.destroy()
      roving = null
    }
  }
  
  update(options)
  
  return {
    update,
    destroy() {
      if (roving) {
        roving.destroy()
      }
    }
  }
}