import { describe, it, expect, vi } from 'vitest';
import { 
	apiSuccess, 
	apiError, 
	ApiErrorType,
	requireAuth,
	validateRequest,
	getPagination,
	ApiError
} from './api-utils';
import { z } from 'zod';

vi.mock('@sveltejs/kit', () => ({
	json: vi.fn((data, init) => ({ data, init }))
}));

describe('apiSuccess', () => {
	it('should return success response with data', () => {
		const data = { message: 'Test' };
		const result = apiSuccess(data, 200, 'test-123');

		expect(result).toEqual({
			data: {
				data: { message: 'Test' },
				timestamp: expect.any(String),
				requestId: 'test-123'
			},
			init: { status: 200 }
		});
	});

	it('should generate requestId if not provided', () => {
		const result = apiSuccess({ test: true });
		expect(result.data.requestId).toBeDefined();
		expect(result.data.requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
	});
});

describe('apiError', () => {
	it('should return error response', () => {
		const result = apiError('Test error', 400, ApiErrorType.VALIDATION, { field: 'test' }, 'error-123');

		expect(result).toEqual({
			data: {
				error: 'Test error',
				timestamp: expect.any(String),
				requestId: 'error-123',
				details: { field: 'test' }
			},
			init: { status: 400 }
		});
	});

	it('should use default error type', () => {
		const result = apiError('Error', 500);
		expect(result.data.error).toBe('Error');
		expect(result.init.status).toBe(500);
	});
});

describe('requireAuth', () => {
	it('should return auth info for authenticated user', async () => {
		const mockSession = {
			user: { id: 'user-123', email: 'test@example.com' },
			expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
		};
		
		const mockLocals = {
			supabase: {
				auth: {
					getSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
					getUser: vi.fn().mockResolvedValue({ data: { user: mockSession.user }, error: null })
				}
			}
		};

		const result = await requireAuth(mockLocals as any);
		expect(result).toEqual({
			session: mockSession,
			userId: 'user-123'
		});
	});

	it('should return null for unauthenticated user', async () => {
		const mockLocals = {
			supabase: {
				auth: {
					getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
					getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null })
				}
			}
		};
		const result = await requireAuth(mockLocals as any);
		expect(result).toBeNull();
	});
});

describe('validateRequest', () => {
	it('should parse and validate JSON request', async () => {
		const schema = z.object({
			name: z.string(),
			age: z.number()
		});

		const mockRequest = {
			json: vi.fn().mockResolvedValue({ name: 'John', age: 30 })
		};

		const result = await validateRequest(mockRequest as any, schema);
		expect(result).toEqual({ name: 'John', age: 30 });
	});

	it('should throw ApiError for invalid data', async () => {
		const schema = z.object({
			email: z.string().email()
		});

		const mockRequest = {
			json: vi.fn().mockResolvedValue({ email: 'invalid' })
		};

		await expect(validateRequest(mockRequest as any, schema))
			.rejects
			.toThrow(ApiError);
	});

	it('should handle JSON parse errors', async () => {
		const schema = z.object({ test: z.string() });
		const mockRequest = {
			json: vi.fn().mockRejectedValue(new SyntaxError('Invalid JSON'))
		};

		await expect(validateRequest(mockRequest as any, schema))
			.rejects
			.toThrow(ApiError);
	});
});

describe('getPagination', () => {
	it('should return default pagination values', () => {
		const mockUrl = new URL('http://example.com/api/test');
		const result = getPagination(mockUrl);

		expect(result).toEqual({
			page: 1,
			limit: 20,
			offset: 0
		});
	});

	it('should parse pagination from URL params', () => {
		const mockUrl = new URL('http://example.com/api/test?page=3&limit=50');
		const result = getPagination(mockUrl);

		expect(result).toEqual({
			page: 3,
			limit: 50,
			offset: 100 // (3-1) * 50
		});
	});

	it('should enforce maximum limit', () => {
		const mockUrl = new URL('http://example.com/api/test?limit=200');
		const result = getPagination(mockUrl);

		expect(result.limit).toBe(100); // max limit
	});

	it('should handle invalid values', () => {
		const mockUrl = new URL('http://example.com/api/test?page=0&limit=-5');
		const result = getPagination(mockUrl);

		expect(result).toEqual({
			page: 1,
			limit: 1, // Math.max(1, -5) = 1
			offset: 0
		});
	});
});

describe('ApiError', () => {
	it('should create error with all properties', () => {
		const error = new ApiError('Test error', 400, ApiErrorType.VALIDATION, { field: 'test' });

		expect(error.message).toBe('Test error');
		expect(error.status).toBe(400);
		expect(error.type).toBe(ApiErrorType.VALIDATION);
		expect(error.details).toEqual({ field: 'test' });
	});

	it('should require all constructor parameters', () => {
		// ApiError requires all parameters, no defaults
		const error = new ApiError('Error', 500, ApiErrorType.INTERNAL);

		expect(error.status).toBe(500);
		expect(error.type).toBe(ApiErrorType.INTERNAL);
		expect(error.details).toBeUndefined();
	});
});