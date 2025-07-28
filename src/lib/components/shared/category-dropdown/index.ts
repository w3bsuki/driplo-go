/**
 * Category Dropdown Components - Re-exports
 * 
 * This file provides clean re-exports for all category dropdown components
 * and utilities, enabling easy imports throughout the application.
 */

// Main container component
export { default as CategoryDropdown } from '../CategoryDropdown.svelte';

// UI Components
export { default as CategorySection } from './CategorySection.svelte';
// TODO: Add remaining components as they are created
// export { default as CategoryDropdownMobile } from './CategoryDropdownMobile.svelte';
// export { default as CategoryDropdownDesktop } from './CategoryDropdownDesktop.svelte';

// State Management Hook
export { useCategoryDropdown } from './hooks/useCategoryDropdown.svelte';

// Data Layer
export {
	popularBrands,
	getConditionOptions,
	getPopularCollections,
	getCategoryHierarchy,
	getCategoryData,
	findCategoryBySlug,
	findSubcategoryBySlug,
	getAllSubcategories,
	getCategoryBreadcrumb
} from './data/categoryData';

// Type exports
export type {
	CategoryData,
	CategoryHierarchyItem,
	SubcategoryItem,
	BrandItem,
	ConditionItem,
	CollectionItem
} from './data/categoryData';

export type { CategoryDropdownState } from './hooks/useCategoryDropdown.svelte';