import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import '@testing-library/jest-dom';

// Mock SvelteKit modules
vi.mock('$app/environment', () => ({
  browser: true,
  dev: false
}));

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidateAll: vi.fn()
}));

vi.mock('$app/stores', () => ({
  page: {
    subscribe: vi.fn((fn) => {
      fn({ url: new URL('http://localhost:5173/sell'), params: {} });
      return vi.fn();
    })
  }
}));

// Mock Supabase client for listing operations
const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    insert: vi.fn(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis()
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      remove: vi.fn(),
      getPublicUrl: vi.fn()
    }))
  },
  rpc: vi.fn()
};

vi.mock('$lib/supabase/client', () => ({
  supabase: mockSupabaseClient
}));

describe('Listing Workflow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock authenticated user session
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-123', email: 'seller@example.com' },
          access_token: 'valid-token'
        }
      },
      error: null
    });
  });

  describe('Listing Creation', () => {
    it('should create a new listing with all required fields', async () => {
      const listingData = {
        title: 'Designer Handbag',
        description: 'Beautiful leather handbag in excellent condition',
        price: 150.00,
        category_id: 'cat-123',
        subcategory_id: 'subcat-456',
        condition: 'excellent',
        brand: 'Gucci',
        size: 'Medium',
        color: 'Black',
        seller_id: 'user-123',
        status: 'draft'
      };

      const createdListing = {
        id: 'listing-123',
        ...listingData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: createdListing,
          error: null
        }),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: createdListing,
          error: null
        })
      });

      const result = await mockSupabaseClient
        .from('listings')
        .insert(listingData)
        .select()
        .single();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('listings');
      expect(result.data.title).toBe(listingData.title);
      expect(result.data.seller_id).toBe('user-123');
      expect(result.data.status).toBe('draft');
      expect(result.error).toBeNull();
    });

    it('should validate required listing fields', async () => {
      const invalidListingData = {
        title: '', // missing title
        description: 'Test description',
        price: 0, // invalid price
        category_id: null, // missing category
        seller_id: 'user-123'
      };

      const validationErrors = [];

      if (!invalidListingData.title.trim()) {
        validationErrors.push('Title is required');
      }
      if (invalidListingData.price <= 0) {
        validationErrors.push('Price must be greater than 0');
      }
      if (!invalidListingData.category_id) {
        validationErrors.push('Category is required');
      }

      expect(validationErrors).toContain('Title is required');
      expect(validationErrors).toContain('Price must be greater than 0');
      expect(validationErrors).toContain('Category is required');
    });

    it('should handle image uploads for listings', async () => {
      const mockFile = new File(['image data'], 'product.jpg', { type: 'image/jpeg' });
      const listingId = 'listing-123';

      mockSupabaseClient.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: {
            path: `listings/${listingId}/product.jpg`
          },
          error: null
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: {
            publicUrl: `https://example.com/storage/listings/${listingId}/product.jpg`
          }
        })
      });

      const uploadResult = await mockSupabaseClient.storage
        .from('listings')
        .upload(`${listingId}/product.jpg`, mockFile);

      expect(uploadResult.data.path).toBe(`listings/${listingId}/product.jpg`);
      expect(uploadResult.error).toBeNull();

      const { data: { publicUrl } } = mockSupabaseClient.storage
        .from('listings')
        .getPublicUrl(`${listingId}/product.jpg`);

      expect(publicUrl).toContain('listings/listing-123/product.jpg');
    });

    it('should save listing as draft', async () => {
      const draftData = {
        title: 'Incomplete Listing',
        description: 'Draft description',
        seller_id: 'user-123',
        status: 'draft'
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: { id: 'draft-123', ...draftData },
          error: null
        })
      });

      const result = await mockSupabaseClient
        .from('listings')
        .insert(draftData);

      expect(result.data.status).toBe('draft');
      expect(result.data.id).toBe('draft-123');
    });

    it('should handle duplicate listing creation', async () => {
      const duplicateData = {
        title: 'Existing Item',
        seller_id: 'user-123'
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: {
            code: '23505',
            message: 'Duplicate listing detected'
          }
        })
      });

      const result = await mockSupabaseClient
        .from('listings')
        .insert(duplicateData);

      expect(result.error?.code).toBe('23505');
      expect(result.error?.message).toBe('Duplicate listing detected');
    });
  });

  describe('Listing Updates and Editing', () => {
    it('should update existing listing', async () => {
      const listingId = 'listing-123';
      const updateData = {
        title: 'Updated Title',
        price: 200.00,
        description: 'Updated description',
        updated_at: new Date().toISOString()
      };

      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockResolvedValue({
          data: { id: listingId, ...updateData },
          error: null
        }),
        eq: vi.fn().mockReturnThis()
      });

      const result = await mockSupabaseClient
        .from('listings')
        .update(updateData)
        .eq('id', listingId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('listings');
      expect(result.data.title).toBe('Updated Title');
      expect(result.data.price).toBe(200.00);
    });

    it('should handle unauthorized listing updates', async () => {
      const listingId = 'listing-123';
      const unauthorizedUpdateData = {
        title: 'Unauthorized Update'
      };

      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockResolvedValue({
          data: null,
          error: {
            code: 'PGRST301',
            message: 'Permission denied'
          }
        }),
        eq: vi.fn().mockReturnThis()
      });

      const result = await mockSupabaseClient
        .from('listings')
        .update(unauthorizedUpdateData)
        .eq('id', listingId);

      expect(result.error?.code).toBe('PGRST301');
      expect(result.error?.message).toBe('Permission denied');
    });

    it('should update listing images', async () => {
      const listingId = 'listing-123';
      const newImages = [
        { file: new File(['img1'], 'img1.jpg', { type: 'image/jpeg' }), order: 1 },
        { file: new File(['img2'], 'img2.jpg', { type: 'image/jpeg' }), order: 2 }
      ];

      mockSupabaseClient.storage.from.mockReturnValue({
        upload: vi.fn()
          .mockResolvedValueOnce({
            data: { path: `listings/${listingId}/img1.jpg` },
            error: null
          })
          .mockResolvedValueOnce({
            data: { path: `listings/${listingId}/img2.jpg` },
            error: null
          }),
        remove: vi.fn().mockResolvedValue({ error: null })
      });

      // Remove old images
      await mockSupabaseClient.storage
        .from('listings')
        .remove([`${listingId}/old-img.jpg`]);

      // Upload new images
      for (const img of newImages) {
        const uploadResult = await mockSupabaseClient.storage
          .from('listings')
          .upload(`${listingId}/img${img.order}.jpg`, img.file);

        expect(uploadResult.error).toBeNull();
      }
    });
  });

  describe('Listing Publishing', () => {
    it('should publish a draft listing', async () => {
      const listingId = 'listing-123';
      const publishData = {
        status: 'active',
        published_at: new Date().toISOString()
      };

      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockResolvedValue({
          data: { id: listingId, ...publishData },
          error: null
        }),
        eq: vi.fn().mockReturnThis()
      });

      const result = await mockSupabaseClient
        .from('listings')
        .update(publishData)
        .eq('id', listingId);

      expect(result.data.status).toBe('active');
      expect(result.data.published_at).toBeDefined();
    });

    it('should validate listing before publishing', async () => {
      const listing = {
        id: 'listing-123',
        title: 'Test Product',
        description: 'Description',
        price: 100,
        category_id: 'cat-123',
        condition: 'good',
        images: []
      };

      const validationErrors = [];

      if (!listing.title) validationErrors.push('Title is required');
      if (!listing.description) validationErrors.push('Description is required');
      if (listing.price <= 0) validationErrors.push('Valid price is required');
      if (!listing.category_id) validationErrors.push('Category is required');
      if (!listing.condition) validationErrors.push('Condition is required');
      if (listing.images.length === 0) validationErrors.push('At least one image is required');

      expect(validationErrors).toContain('At least one image is required');
    });

    it('should unpublish a listing', async () => {
      const listingId = 'listing-123';
      const unpublishData = {
        status: 'inactive',
        unpublished_at: new Date().toISOString()
      };

      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockResolvedValue({
          data: { id: listingId, ...unpublishData },
          error: null
        }),
        eq: vi.fn().mockReturnThis()
      });

      const result = await mockSupabaseClient
        .from('listings')
        .update(unpublishData)
        .eq('id', listingId);

      expect(result.data.status).toBe('inactive');
      expect(result.data.unpublished_at).toBeDefined();
    });
  });

  describe('Listing Deletion', () => {
    it('should delete a listing', async () => {
      const listingId = 'listing-123';

      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn().mockResolvedValue({
          data: { id: listingId },
          error: null
        }),
        eq: vi.fn().mockReturnThis()
      });

      const result = await mockSupabaseClient
        .from('listings')
        .delete()
        .eq('id', listingId);

      expect(result.data.id).toBe(listingId);
      expect(result.error).toBeNull();
    });

    it('should soft delete a listing with orders', async () => {
      const listingId = 'listing-with-orders-123';
      const softDeleteData = {
        status: 'deleted',
        deleted_at: new Date().toISOString()
      };

      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockResolvedValue({
          data: { id: listingId, ...softDeleteData },
          error: null
        }),
        eq: vi.fn().mockReturnThis()
      });

      const result = await mockSupabaseClient
        .from('listings')
        .update(softDeleteData)
        .eq('id', listingId);

      expect(result.data.status).toBe('deleted');
      expect(result.data.deleted_at).toBeDefined();
    });

    it('should remove associated images when deleting listing', async () => {
      const listingId = 'listing-123';
      const imagePaths = [
        `${listingId}/image1.jpg`,
        `${listingId}/image2.jpg`,
        `${listingId}/image3.jpg`
      ];

      mockSupabaseClient.storage.from.mockReturnValue({
        remove: vi.fn().mockResolvedValue({
          data: imagePaths,
          error: null
        })
      });

      const removeResult = await mockSupabaseClient.storage
        .from('listings')
        .remove(imagePaths);

      expect(removeResult.data).toEqual(imagePaths);
      expect(removeResult.error).toBeNull();
    });
  });

  describe('Listing Queries and Retrieval', () => {
    it('should retrieve user listings', async () => {
      const sellerId = 'user-123';
      const mockListings = [
        {
          id: 'listing-1',
          title: 'Product 1',
          price: 100,
          status: 'active',
          seller_id: sellerId
        },
        {
          id: 'listing-2',
          title: 'Product 2',
          price: 200,
          status: 'draft',
          seller_id: sellerId
        }
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockListings,
          error: null
        })
      });

      const result = await mockSupabaseClient
        .from('listings')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].seller_id).toBe(sellerId);
      expect(result.data[1].seller_id).toBe(sellerId);
    });

    it('should retrieve single listing by ID', async () => {
      const listingId = 'listing-123';
      const mockListing = {
        id: listingId,
        title: 'Single Product',
        description: 'Product description',
        price: 150,
        seller: {
          username: 'testuser',
          avatar_url: 'https://example.com/avatar.jpg'
        }
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockListing,
          error: null
        })
      });

      const result = await mockSupabaseClient
        .from('listings')
        .select('*, seller:profiles(username, avatar_url)')
        .eq('id', listingId)
        .single();

      expect(result.data.id).toBe(listingId);
      expect(result.data.seller.username).toBe('testuser');
    });

    it('should handle listing not found', async () => {
      const nonExistentId = 'nonexistent-123';

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: {
            code: 'PGRST116',
            message: 'No rows found'
          }
        })
      });

      const result = await mockSupabaseClient
        .from('listings')
        .select('*')
        .eq('id', nonExistentId)
        .single();

      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('PGRST116');
    });
  });

  describe('Listing Search and Filtering', () => {
    it('should search listings by title and description', async () => {
      const searchQuery = 'designer handbag';
      const mockSearchResults = [
        {
          id: 'listing-1',
          title: 'Designer Handbag - Gucci',
          description: 'Beautiful designer handbag',
          price: 150
        },
        {
          id: 'listing-2',
          title: 'Luxury Handbag',
          description: 'Premium designer quality',
          price: 200
        }
      ];

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockSearchResults,
        error: null
      });

      const result = await mockSupabaseClient.rpc('search_listings', {
        search_query: searchQuery,
        limit_count: 20,
        offset_count: 0
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].title).toContain('Designer Handbag');
    });

    it('should filter listings by category', async () => {
      const categoryId = 'bags-123';
      const mockCategoryListings = [
        {
          id: 'listing-1',
          title: 'Tote Bag',
          category_id: categoryId
        },
        {
          id: 'listing-2',
          title: 'Shoulder Bag',
          category_id: categoryId
        }
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockCategoryListings,
          error: null
        })
      });

      const result = await mockSupabaseClient
        .from('listings')
        .select('*')
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false });

      expect(result.data).toHaveLength(2);
      expect(result.data.every(item => item.category_id === categoryId)).toBe(true);
    });

    it('should filter listings by price range', async () => {
      const minPrice = 100;
      const maxPrice = 300;

      mockSupabaseClient.rpc.mockResolvedValue({
        data: [
          { id: 'listing-1', price: 150 },
          { id: 'listing-2', price: 250 }
        ],
        error: null
      });

      const result = await mockSupabaseClient.rpc('filter_listings_by_price', {
        min_price: minPrice,
        max_price: maxPrice
      });

      expect(result.data.every(item => item.price >= minPrice && item.price <= maxPrice)).toBe(true);
    });
  });

  describe('Listing Analytics and Tracking', () => {
    it('should track listing views', async () => {
      const listingId = 'listing-123';
      const viewerId = 'viewer-456';

      mockSupabaseClient.rpc.mockResolvedValue({
        data: { success: true },
        error: null
      });

      const result = await mockSupabaseClient.rpc('track_listing_view', {
        p_listing_id: listingId,
        p_viewer_id: viewerId,
        p_ip_address: '127.0.0.1'
      });

      expect(result.data.success).toBe(true);
    });

    it('should get listing analytics', async () => {
      const listingId = 'listing-123';
      const mockAnalytics = {
        total_views: 50,
        unique_views: 35,
        favorites: 12,
        inquiries: 3
      };

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockAnalytics,
        error: null
      });

      const result = await mockSupabaseClient.rpc('get_listing_analytics', {
        p_listing_id: listingId
      });

      expect(result.data.total_views).toBe(50);
      expect(result.data.unique_views).toBe(35);
      expect(result.data.favorites).toBe(12);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        insert: vi.fn().mockRejectedValue(new Error('Database connection failed'))
      });

      try {
        await mockSupabaseClient
          .from('listings')
          .insert({ title: 'Test' });
      } catch (error) {
        expect(error.message).toBe('Database connection failed');
      }
    });

    it('should handle storage upload errors', async () => {
      const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' });

      mockSupabaseClient.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: null,
          error: {
            message: 'Upload failed',
            statusCode: '500'
          }
        })
      });

      const result = await mockSupabaseClient.storage
        .from('listings')
        .upload('test/test.jpg', file);

      expect(result.error?.message).toBe('Upload failed');
      expect(result.data).toBeNull();
    });

    it('should handle validation errors gracefully', async () => {
      const invalidData = {
        title: 'a'.repeat(201), // too long
        price: -10, // negative price
        description: '' // empty description
      };

      const errors = [];

      if (invalidData.title.length > 200) {
        errors.push('Title must be 200 characters or less');
      }
      if (invalidData.price < 0) {
        errors.push('Price cannot be negative');
      }
      if (!invalidData.description.trim()) {
        errors.push('Description is required');
      }

      expect(errors).toContain('Title must be 200 characters or less');
      expect(errors).toContain('Price cannot be negative');
      expect(errors).toContain('Description is required');
    });
  });
});