/**
 * Category Dropdown State Management Hook
 * Centralizes state, navigation logic, and event handling for the category dropdown
 */

import { goto } from '$app/navigation';
import type { CategoryHierarchyItem, SubcategoryItem } from '../data/categoryData';

interface CategoryDropdownState {
	activeMainCategory: string;
	hoveredCategory: string;
	activeSection: 'categories' | 'brands' | 'filters';
}

export function useCategoryDropdown(initialCategory?: string | null) {
	// Internal state
	let state = $state<CategoryDropdownState>({
		activeMainCategory: initialCategory || '',
		hoveredCategory: '',
		activeSection: 'categories'
	});

	// Update active category when initialCategory changes
	$effect(() => {
		if (initialCategory) {
			state.activeMainCategory = initialCategory;
		}
	});

	// Navigation and state management methods
	function handleMainCategoryClick(categorySlug: string) {
		if (categorySlug === state.activeMainCategory) {
			// If clicking the same category, toggle it off
			state.activeMainCategory = '';
		} else {
			// Set new active category
			state.activeMainCategory = categorySlug;
		}
	}

	function handleSubcategoryClick(mainCategory: string, subcategory: string, onClose?: () => void) {
		// Close dropdown when navigating
		if (onClose) {
			onClose();
		}
		
		if (mainCategory === '' && subcategory === 'all') {
			// Browse all categories
			goto('/browse');
		} else if (mainCategory === '') {
			// Special categories like new, sale, collections
			goto(`/browse?filter=${subcategory}`);
		} else {
			// Regular category navigation
			goto(`/browse/${mainCategory}/${subcategory}`);
		}
	}

	function handleCategoryNavigation(categorySlug: string, onClose?: () => void) {
		// Navigate to main category page
		if (onClose) {
			onClose();
		}
		
		if (categorySlug === '') {
			goto('/browse');
		} else {
			goto(`/browse/${categorySlug}`);
		}
	}

	function handleBrandClick(brandName: string, onClose?: () => void) {
		// Navigate to brand-specific listings
		if (onClose) {
			onClose();
		}
		
		const brandSlug = brandName.toLowerCase().replace(/\s+/g, '-');
		goto(`/browse?brand=${brandSlug}`);
	}

	function handleConditionClick(conditionValue: string, onClose?: () => void) {
		// Navigate to condition-filtered listings
		if (onClose) {
			onClose();
		}
		
		goto(`/browse?condition=${conditionValue}`);
	}

	function handleCollectionClick(collectionSlug: string, onClose?: () => void) {
		// Navigate to collection-specific listings
		if (onClose) {
			onClose();
		}
		
		goto(`/browse?collection=${collectionSlug}`);
	}

	// Section management for mobile tabs
	function setActiveSection(section: 'categories' | 'brands' | 'filters') {
		state.activeSection = section;
	}

	// Hover state management for desktop
	function setHoveredCategory(categorySlug: string) {
		state.hoveredCategory = categorySlug;
	}

	function clearHoveredCategory() {
		state.hoveredCategory = '';
	}

	// Utility methods
	function isMainCategoryActive(categorySlug: string): boolean {
		return state.activeMainCategory === categorySlug;
	}

	function isMainCategoryHovered(categorySlug: string): boolean {
		return state.hoveredCategory === categorySlug;
	}

	function isCategoryExpanded(categorySlug: string): boolean {
		return isMainCategoryActive(categorySlug) || isMainCategoryHovered(categorySlug);
	}

	function resetDropdownState() {
		state.activeMainCategory = '';
		state.hoveredCategory = '';
		state.activeSection = 'categories';
	}
	
	function resetCategory() {
		state.activeMainCategory = '';
		state.hoveredCategory = '';
	}

	// Keyboard navigation support
	function handleKeyboardNavigation(event: KeyboardEvent, categorySlug: string) {
		switch (event.key) {
			case 'Enter':
			case ' ':
				event.preventDefault();
				handleMainCategoryClick(categorySlug);
				break;
			case 'Escape':
				resetDropdownState();
				break;
			case 'ArrowDown':
				event.preventDefault();
				// Focus next category (implementation depends on DOM structure)
				break;
			case 'ArrowUp':
				event.preventDefault();
				// Focus previous category (implementation depends on DOM structure)
				break;
		}
	}

	// URL generation helpers
	function generateCategoryUrl(mainCategory: string, subcategory?: string): string {
		if (mainCategory === '' && subcategory === 'all') {
			return '/browse';
		} else if (mainCategory === '') {
			return `/browse?filter=${subcategory}`;
		} else if (subcategory) {
			return `/browse/${mainCategory}/${subcategory}`;
		} else {
			return `/browse/${mainCategory}`;
		}
	}

	function generateBrandUrl(brandName: string): string {
		const brandSlug = brandName.toLowerCase().replace(/\s+/g, '-');
		return `/browse?brand=${brandSlug}`;
	}

	function generateConditionUrl(conditionValue: string): string {
		return `/browse?condition=${conditionValue}`;
	}

	function generateCollectionUrl(collectionSlug: string): string {
		return `/browse?collection=${collectionSlug}`;
	}

	// Analytics and tracking helpers
	function trackCategoryClick(categorySlug: string, subcategorySlug?: string) {
		// Track category interactions for analytics
		const eventData = {
			category: categorySlug,
			subcategory: subcategorySlug,
			timestamp: new Date().toISOString()
		};
		
		// Send to analytics service (placeholder)
		console.debug('Category interaction tracked:', eventData);
	}

	function trackSectionSwitch(newSection: string) {
		// Track mobile section switching for UX analytics
		const eventData = {
			section: newSection,
			timestamp: new Date().toISOString()
		};
		
		console.debug('Section switch tracked:', eventData);
	}

	return {
		// State (read-only access)
		get activeMainCategory() { return state.activeMainCategory; },
		get hoveredCategory() { return state.hoveredCategory; },
		get activeSection() { return state.activeSection; },

		// Navigation handlers
		handleMainCategoryClick,
		handleSubcategoryClick,
		handleCategoryNavigation,
		handleBrandClick,
		handleConditionClick,
		handleCollectionClick,

		// Section management
		setActiveSection,

		// Hover management
		setHoveredCategory,
		clearHoveredCategory,

		// State queries
		isMainCategoryActive,
		isMainCategoryHovered,
		isCategoryExpanded,

		// Utility methods
		resetDropdownState,
		resetCategory,
		handleKeyboardNavigation,

		// URL generators
		generateCategoryUrl,
		generateBrandUrl,
		generateConditionUrl,
		generateCollectionUrl,

		// Analytics
		trackCategoryClick,
		trackSectionSwitch
	};
}

export type { CategoryDropdownState };