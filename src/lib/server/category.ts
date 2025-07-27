import { error } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';

export async function loadCategoryPage(categorySlug: string, supabase: SupabaseClient<Database>) {
  // Get category info
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', categorySlug)
    .is('parent_id', null)
    .single();

  if (categoryError || !category) {
    throw error(404, 'Category not found');
  }

  // Get subcategories
  const { data: subcategories } = await supabase
    .from('categories')
    .select('*')
    .eq('parent_id', category.id)
    .eq('is_active', true)
    .order('sort_order')
    .order('name');

  // Get all products for this category
  const { data: products } = await supabase
    .from('listings')
    .select(`
      *,
      seller:profiles!seller_id(username, avatar_url)
    `)
    .eq('category_id', category.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  // Get top sellers for this category
  const { data: topSellers } = await supabase
    .rpc('get_top_category_sellers', { 
      category_uuid: category.id
    });

  return {
    category,
    subcategories: subcategories || [],
    products: products || [],
    topSellers: topSellers || []
  };
}

export async function loadSubcategoryPage(categorySlug: string, subcategorySlug: string, url: URL, supabase: SupabaseClient<Database>) {
  // Get category info
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', categorySlug)
    .is('parent_id', null)
    .single();

  if (!category) {
    throw error(404, 'Category not found');
  }

  // Get subcategory info
  const { data: subcategory } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', subcategorySlug)
    .eq('parent_id', category.id)
    .single();

  if (!subcategory) {
    throw error(404, 'Subcategory not found');
  }

  // Build filters from URL params
  const filters = Object.fromEntries(url.searchParams);
  
  // Build query
  let query = supabase
    .from('listings')
    .select(`
      *,
      seller:profiles!seller_id(username, avatar_url),
      category:categories!category_id(name, slug),
      subcategory:categories!subcategory_id(name, slug)
    `, { count: 'exact' })
    .eq('category_id', category.id)
    .eq('subcategory_id', subcategory.id)
    .eq('status', 'active');

  // Apply filters
  if (filters['min_price']) query = query.gte('price', parseFloat(filters['min_price']));
  if (filters['max_price']) query = query.lte('price', parseFloat(filters['max_price']));
  if (filters['brand']) query = query.eq('brand', filters['brand']);
  if (filters['condition']) query = query.eq('condition', filters['condition']);
  if (filters['size']) query = query.eq('size', filters['size']);
  if (filters['color']) query = query.eq('color', filters['color']);

  // Apply sorting
  const sortBy = filters['sort'] || 'newest';
  switch (sortBy) {
    case 'price_low':
      query = query.order('price', { ascending: true });
      break;
    case 'price_high':
      query = query.order('price', { ascending: false });
      break;
    case 'popular':
      query = query.order('view_count', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  // Pagination
  const page = parseInt(filters['page'] || '1');
  const limit = 24;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  query = query.range(from, to);

  const { data: products, count } = await query;

  return {
    category,
    subcategory,
    products: products || [],
    totalCount: count || 0,
    filters,
    currentPage: page,
    totalPages: Math.ceil((count || 0) / limit)
  };
}