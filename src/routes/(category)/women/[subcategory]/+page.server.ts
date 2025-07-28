import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const categorySlug = 'women';
  const subcategorySlug = params.subcategory;
  
  // Get category info
  const { data: category } = await locals.supabase
    .from('categories')
    .select('*')
    .eq('slug', categorySlug)
    .is('parent_id', null)
    .single();

  if (!category) {
    throw error(404, 'Category not found');
  }

  // Get subcategory info
  const { data: subcategory } = await locals.supabase
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
  let query = locals.supabase
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
  if (filters.min_price) query = query.gte('price', parseFloat(filters.min_price));
  if (filters.max_price) query = query.lte('price', parseFloat(filters.max_price));
  if (filters.brand) query = query.eq('brand', filters.brand);
  if (filters.condition) query = query.eq('condition', filters.condition);
  if (filters.size) query = query.eq('size', filters.size);
  if (filters.color) query = query.eq('color', filters.color);

  // Apply sorting
  const sortBy = filters.sort || 'newest';
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
  const page = parseInt(filters.page || '1');
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
};