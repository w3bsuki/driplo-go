/**
 * Category Data Definitions
 * Static category hierarchy, brands, and filter options for the dropdown
 */

import * as m from '$lib/paraglide/messages.js';

// TypeScript Interfaces
export interface SubcategoryItem {
	name: string;
	slug: string;
	icon: string;
}

export interface CategoryHierarchyItem {
	slug: string;
	name: string;
	icon: string;
	subcategories: SubcategoryItem[];
}

export interface BrandItem {
	name: string;
	emoji: string;
}

export interface ConditionItem {
	value: string;
	label: string;
	emoji: string;
}

export interface CollectionItem {
	slug: string;
	name: string;
	icon: string;
}

export interface CategoryData {
	categoryHierarchy: CategoryHierarchyItem[];
	popularBrands: BrandItem[];
	conditionOptions: ConditionItem[];
	popularCollections: CollectionItem[];
}

// Static Data Definitions

/**
 * Popular fashion brands with emoji indicators
 */
export const popularBrands: BrandItem[] = [
	{ name: 'Nike', emoji: '👟' },
	{ name: 'Adidas', emoji: '⚡' },
	{ name: 'Zara', emoji: '👗' },
	{ name: 'H&M', emoji: '🛍️' },
	{ name: 'Gucci', emoji: '💎' },
	{ name: 'Prada', emoji: '👜' },
	{ name: 'Versace', emoji: '✨' },
	{ name: 'Balenciaga', emoji: '🔥' },
	{ name: 'Louis Vuitton', emoji: '💼' },
	{ name: 'Chanel', emoji: '🌹' },
	{ name: 'Dior', emoji: '💐' },
	{ name: 'Burberry', emoji: '🧥' }
];

/**
 * Item condition options with internationalized labels
 */
export const getConditionOptions = (): ConditionItem[] => [
	{ value: 'new_with_tags', label: m.condition_new_with_tags(), emoji: '🏷️' },
	{ value: 'like_new', label: m.condition_like_new(), emoji: '✨' },
	{ value: 'good', label: m.condition_good(), emoji: '👍' },
	{ value: 'fair', label: m.condition_fair(), emoji: '👌' },
	{ value: 'poor', label: m.condition_poor(), emoji: '🔧' }
];

/**
 * Popular cross-category collections
 */
export const getPopularCollections = (): CollectionItem[] => [
	{ slug: 'shoes', name: m.subcategory_shoes_all(), icon: '👟' },
	{ slug: 'bags', name: m.subcategory_bags(), icon: '👜' },
	{ slug: 'jewelry', name: m.subcategory_jewelry(), icon: '💍' },
	{ slug: 'vintage', name: m.designer_vintage_pieces(), icon: '🕰️' },
	{ slug: 'sale', name: m.category_sale_items(), icon: '🔥' },
	{ slug: 'new', name: m.category_new_arrivals(), icon: '✨' }
];

/**
 * Main category hierarchy with internationalized names and subcategories
 * Returns a reactive array that updates when language changes
 */
export const getCategoryHierarchy = (): CategoryHierarchyItem[] => [
	{
		slug: '',
		name: m.category_all(),
		icon: '🔍',
		subcategories: []
	},
	{
		slug: 'women',
		name: m.category_women(),
		icon: '👩',
		subcategories: [
			{ name: m.subcategory_dresses(), slug: 'dresses', icon: '👗' },
			{ name: m.women_tops_blouses(), slug: 'tops', icon: '👚' },
			{ name: m.women_skirts(), slug: 'skirts', icon: '👗' },
			{ name: m.women_pants_jeans(), slug: 'pants', icon: '👖' },
			{ name: m.women_jackets_coats(), slug: 'jackets', icon: '🧥' },
			{ name: m.women_shoes(), slug: 'shoes', icon: '👠' },
			{ name: m.women_bags_accessories(), slug: 'bags', icon: '👜' },
			{ name: m.subcategory_jewelry(), slug: 'jewelry', icon: '💍' },
			{ name: m.women_lingerie(), slug: 'lingerie', icon: '👙' },
			{ name: m.women_activewear(), slug: 'activewear', icon: '🏃‍♀️' }
		]
	},
	{
		slug: 'men',
		name: m.category_men(),
		icon: '👨',
		subcategories: [
			{ name: m.men_tshirts(), slug: 'tshirts', icon: '👕' },
			{ name: m.men_shirts(), slug: 'shirts', icon: '👔' },
			{ name: m.men_pants_jeans(), slug: 'pants', icon: '👖' },
			{ name: m.men_jackets_coats(), slug: 'jackets', icon: '🧥' },
			{ name: m.men_hoodies_sweatshirts(), slug: 'hoodies', icon: '👕' },
			{ name: m.men_shoes(), slug: 'shoes', icon: '👞' },
			{ name: m.men_accessories(), slug: 'accessories', icon: '⌚' },
			{ name: m.men_suits_formal(), slug: 'suits', icon: '🤵' },
			{ name: m.men_activewear(), slug: 'activewear', icon: '🏃‍♂️' },
			{ name: m.men_underwear(), slug: 'underwear', icon: '🩲' }
		]
	},
	{
		slug: 'kids',
		name: m.category_kids(),
		icon: '👶',
		subcategories: [
			{ name: m.kids_baby(), slug: 'baby', icon: '👶' },
			{ name: m.kids_girls(), slug: 'girls', icon: '👧' },
			{ name: m.kids_boys(), slug: 'boys', icon: '👦' },
			{ name: m.kids_shoes(), slug: 'shoes', icon: '👟' },
			{ name: m.kids_school_uniforms(), slug: 'school', icon: '🎒' },
			{ name: m.kids_toys_games(), slug: 'toys', icon: '🧸' },
			{ name: m.kids_maternity(), slug: 'maternity', icon: '🤱' }
		]
	},
	{
		slug: 'designer',
		name: m.category_designer(),
		icon: '💎',
		subcategories: [
			{ name: m.designer_luxury_handbags(), slug: 'handbags', icon: '👜' },
			{ name: m.designer_shoes(), slug: 'shoes', icon: '👠' },
			{ name: m.designer_dresses(), slug: 'dresses', icon: '👗' },
			{ name: m.designer_luxury_watches(), slug: 'watches', icon: '⌚' },
			{ name: m.designer_fine_jewelry(), slug: 'jewelry', icon: '💍' },
			{ name: m.designer_sunglasses(), slug: 'sunglasses', icon: '🕶️' },
			{ name: m.designer_vintage_pieces(), slug: 'vintage', icon: '🕰️' }
		]
	},
	{
		slug: 'home',
		name: m.category_home(),
		icon: '🏠',
		subcategories: [
			{ name: m.home_furniture(), slug: 'furniture', icon: '🪑' },
			{ name: m.home_decor(), slug: 'decor', icon: '🖼️' },
			{ name: m.home_kitchen(), slug: 'kitchen', icon: '🍽️' },
			{ name: m.home_bedding(), slug: 'bedding', icon: '🛏️' },
			{ name: m.home_lighting(), slug: 'lighting', icon: '💡' }
		]
	}
];

/**
 * Get complete category data bundle
 * Useful for passing to components that need all category data
 */
export const getCategoryData = (): CategoryData => ({
	categoryHierarchy: getCategoryHierarchy(),
	popularBrands,
	conditionOptions: getConditionOptions(),
	popularCollections: getPopularCollections()
});

/**
 * Utility functions for category operations
 */

/**
 * Find a category by slug in the hierarchy
 */
export const findCategoryBySlug = (slug: string): CategoryHierarchyItem | undefined => {
	const hierarchy = getCategoryHierarchy();
	return hierarchy.find(category => category.slug === slug);
};

/**
 * Find a subcategory by slug within a main category
 */
export const findSubcategoryBySlug = (mainCategorySlug: string, subcategorySlug: string): SubcategoryItem | undefined => {
	const mainCategory = findCategoryBySlug(mainCategorySlug);
	return mainCategory?.subcategories.find(sub => sub.slug === subcategorySlug);
};

/**
 * Get all subcategories across all main categories
 */
export const getAllSubcategories = (): SubcategoryItem[] => {
	const hierarchy = getCategoryHierarchy();
	return hierarchy.flatMap(category => category.subcategories);
};

/**
 * Get category breadcrumb trail for navigation
 */
export const getCategoryBreadcrumb = (mainCategorySlug: string, subcategorySlug?: string): { main?: CategoryHierarchyItem; sub?: SubcategoryItem } => {
	const main = findCategoryBySlug(mainCategorySlug);
	const sub = subcategorySlug ? findSubcategoryBySlug(mainCategorySlug, subcategorySlug) : undefined;
	
	return { main, sub };
};