import { error } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';

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

  // Execute optimized queries in parallel
  const [subcategoriesResult, productsResult, topSellersResult] = await Promise.all([
    // Get subcategories
    supabase
      .from('categories')
      .select('*')
      .eq('parent_id', category.id)
      .eq('is_active', true)
      .order('sort_order')
      .order('name'),

    // Get products using optimized RPC function
    supabase.rpc('get_category_listings', {
      p_category_id: category.id,
      p_limit: 50,
      p_offset: 0
    }),

    // Get top sellers for this category
    supabase.rpc('get_top_category_sellers', { 
      category_uuid: category.id
    })
  ]);

  if (productsResult.error) {
    console.error('Error loading category products:', productsResult.error);
  }

  // Transform RPC result to match expected format
  const products = (productsResult.data || []).map((item: any) => ({
    ...item.listing_data,
    seller: item.listing_data.seller
  }));

  return {
    category,
    subcategories: subcategoriesResult.data || [],
    products,
    topSellers: topSellersResult.data || []
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
  
  // Map sorting options
  let sortBy = 'created_at';
  let sortOrder = 'desc';
  
  switch (filters['sort']) {
    case 'price_low':
      sortBy = 'price';
      sortOrder = 'asc';
      break;
    case 'price_high':
      sortBy = 'price';
      sortOrder = 'desc';
      break;
    case 'popular':
      sortBy = 'view_count';
      sortOrder = 'desc';
      break;
  }

  // Pagination
  const page = parseInt(filters['page'] || '1');
  const limit = 24;
  const offset = (page - 1) * limit;

  // Use optimized RPC function for subcategory listings
  const { data: productsData, error: productsError } = await supabase.rpc('get_category_listings', {
    p_category_id: category.id,
    p_subcategory_id: subcategory.id,
    p_limit: limit,
    p_offset: offset,
    p_sort_by: sortBy,
    p_sort_order: sortOrder,
    p_min_price: filters['min_price'] ? parseFloat(filters['min_price']) : null,
    p_max_price: filters['max_price'] ? parseFloat(filters['max_price']) : null,
    p_brands: filters['brand'] ? [filters['brand']] : null,
    p_sizes: filters['size'] ? [filters['size']] : null,
    p_conditions: filters['condition'] ? [filters['condition']] : null,
    p_colors: filters['color'] ? [filters['color']] : null
  });

  if (productsError) {
    console.error('Error loading subcategory products:', productsError);
  }

  // Extract products and count from RPC result
  const products = (productsData || []).map((item: any) => ({
    ...item.listing_data,
    seller: item.listing_data.seller,
    category: item.listing_data.category,
    subcategory: item.listing_data.subcategory
  }));

  const totalCount = productsData?.[0]?.total_count || 0;

  return {
    category,
    subcategory,
    products,
    totalCount,
    filters,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit)
  };
}