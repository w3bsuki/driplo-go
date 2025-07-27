export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterGroup {
  type: string;
  label: string;
  options: FilterOption[];
}

export interface SelectedFilters {
  price?: string;
  size?: string[];
  color?: string[];
  brand?: string[];
  condition?: string[];
  style?: string[];
  material?: string[];
  type?: string[];
  gender?: string[];
  authentication?: string[];
  category?: string[];
}

export interface SortOption {
  value: string;
  label: string;
  field: string;
  order: 'asc' | 'desc';
}