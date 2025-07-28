export const LISTING_CONDITIONS = {
	NEW_WITH_TAGS: 'new_with_tags',
	NEW_WITHOUT_TAGS: 'new_without_tags',
	VERY_GOOD: 'very_good',
	GOOD: 'good',
	FAIR: 'fair'
} as const;

export type ListingCondition = typeof LISTING_CONDITIONS[keyof typeof LISTING_CONDITIONS];

export interface ConditionConfig {
	value: ListingCondition;
	label: string;
	labelKey: string;
	color: string;
	textColor: string;
	borderColor: string;
	bgColor: string;
	priority: number;
}

export const CONDITION_CONFIG: Record<ListingCondition, ConditionConfig> = {
	[LISTING_CONDITIONS.NEW_WITH_TAGS]: {
		value: LISTING_CONDITIONS.NEW_WITH_TAGS,
		label: 'New with tags',
		labelKey: 'condition_new_with_tags',
		color: 'emerald',
		textColor: 'text-white',
		borderColor: 'border-emerald-500',
		bgColor: 'bg-emerald-500',
		priority: 1
	},
	[LISTING_CONDITIONS.NEW_WITHOUT_TAGS]: {
		value: LISTING_CONDITIONS.NEW_WITHOUT_TAGS,
		label: 'New without tags',
		labelKey: 'condition_new_without_tags',
		color: 'blue',
		textColor: 'text-white',
		borderColor: 'border-blue-500',
		bgColor: 'bg-blue-500',
		priority: 2
	},
	[LISTING_CONDITIONS.VERY_GOOD]: {
		value: LISTING_CONDITIONS.VERY_GOOD,
		label: 'Very good',
		labelKey: 'condition_very_good',
		color: 'violet',
		textColor: 'text-white',
		borderColor: 'border-violet-500',
		bgColor: 'bg-violet-500',
		priority: 3
	},
	[LISTING_CONDITIONS.GOOD]: {
		value: LISTING_CONDITIONS.GOOD,
		label: 'Good',
		labelKey: 'condition_good',
		color: 'amber',
		textColor: 'text-gray-900',
		borderColor: 'border-amber-500',
		bgColor: 'bg-amber-500',
		priority: 4
	},
	[LISTING_CONDITIONS.FAIR]: {
		value: LISTING_CONDITIONS.FAIR,
		label: 'Fair',
		labelKey: 'condition_fair',
		color: 'red',
		textColor: 'text-white',
		borderColor: 'border-red-500',
		bgColor: 'bg-red-500',
		priority: 5
	}
};

export const CONDITION_VALUES = Object.values(LISTING_CONDITIONS) as ListingCondition[];

// All conditions are now the simplified set
export const SIMPLIFIED_CONDITIONS: ListingCondition[] = CONDITION_VALUES;

export function getConditionConfig(condition: string | null | undefined): ConditionConfig | null {
	if (!condition) return null;
	return CONDITION_CONFIG[condition as ListingCondition] || null;
}

export function getConditionBadgeClasses(condition: string | null | undefined): string {
	const config = getConditionConfig(condition);
	if (!config) return '';
	return `${config.bgColor} ${config.textColor} ${config.borderColor}`;
}