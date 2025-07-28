import { z } from 'zod';
import type { ZodError, ZodIssue } from 'zod';

// Common validation rules
export const validationRules = {
  // Text validations
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    
  email: z.string()
    .email('Please enter a valid email address'),
    
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
    
  revtag: z.string()
    .regex(/^@[a-zA-Z0-9_]+$/, 'Revtag must start with @ and contain only letters, numbers, and underscores')
    .min(2, 'Revtag must be at least 2 characters')
    .max(20, 'Revtag must be less than 20 characters'),
    
  // Number validations
  price: z.number()
    .positive('Price must be a positive number')
    .multipleOf(0.01, 'Price must have at most 2 decimal places'),
    
  quantity: z.number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0'),
    
  percentage: z.number()
    .min(0, 'Percentage must be between 0 and 100')
    .max(100, 'Percentage must be between 0 and 100'),
    
  // String validations
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters')
    .trim(),
    
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be less than 5000 characters')
    .trim(),
    
  shortText: z.string()
    .max(255, 'Text must be less than 255 characters')
    .trim(),
    
  // Date validations
  futureDate: z.date()
    .refine(date => date > new Date(), 'Date must be in the future'),
    
  pastDate: z.date()
    .refine(date => date < new Date(), 'Date must be in the past'),
    
  birthDate: z.date()
    .refine(date => {
      const age = new Date().getFullYear() - date.getFullYear();
      return age >= 13 && age <= 120;
    }, 'You must be between 13 and 120 years old'),
    
  // File validations
  imageFile: z.instanceof(File)
    .refine(file => file.size <= 5 * 1024 * 1024, 'Image must be less than 5MB')
    .refine(
      file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'File must be a JPEG, PNG, or WebP image'
    ),
    
  // Common patterns
  phoneNumber: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'),
    
  zipCode: z.string()
    .regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
    
  url: z.string()
    .url('Please enter a valid URL')
    .optional(),
    
  hexColor: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Please enter a valid hex color'),
    
  // Array validations
  tags: z.array(z.string())
    .max(10, 'You can add up to 10 tags')
    .refine(
      tags => tags.every(tag => tag.length >= 2 && tag.length <= 20),
      'Each tag must be between 2 and 20 characters'
    ),
    
  // Enum validations
  condition: z.enum(['new', 'likenew', 'verygood', 'good', 'fair'], {
    errorMap: () => ({ message: 'Please select a valid condition' })
  }),
  
  size: z.enum(['xs', 's', 'm', 'l', 'xl', 'xxl', 'custom'], {
    errorMap: () => ({ message: 'Please select a valid size' })
  })
};

// Field-specific error messages
export interface FieldError {
  field: string;
  message: string;
  code?: string;
}

// Form validation result
export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: FieldError[];
  globalError?: string;
}

// Convert Zod errors to field errors
export function formatZodErrors(error: ZodError): FieldError[] {
  return error.issues.map((issue: ZodIssue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code
  }));
}

// Generic form validator
export function validateForm<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: formatZodErrors(error)
      };
    }
    return {
      success: false,
      globalError: 'An unexpected error occurred during validation'
    };
  }
}

// Safe form validator (doesn't throw)
export function safeValidateForm<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data
    };
  }
  
  return {
    success: false,
    errors: formatZodErrors(result.error)
  };
}

// Field-level validator for real-time validation
export function validateField(
  value: unknown,
  validator: z.ZodSchema,
  fieldName: string
): FieldError | null {
  const result = validator.safeParse(value);
  
  if (result.success) {
    return null;
  }
  
  return {
    field: fieldName,
    message: result.error.issues[0]?.message || 'Invalid value'
  };
}

// Common form schemas
export const formSchemas = {
  // Login form
  login: z.object({
    email: validationRules.email,
    password: z.string().min(1, 'Password is required'),
    remember: z.boolean().optional()
  }),
  
  // Registration form
  register: z.object({
    email: validationRules.email,
    password: validationRules.password,
    confirmPassword: z.string(),
    username: validationRules.username,
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'You must accept the terms and conditions' })
    })
  }).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
  }),
  
  // Profile form
  profile: z.object({
    displayName: validationRules.username,
    revtag: validationRules.revtag,
    bio: validationRules.description.optional(),
    avatarUrl: validationRules.url,
    phoneNumber: validationRules.phoneNumber.optional()
  }),
  
  // Listing form
  listing: z.object({
    title: validationRules.title,
    description: validationRules.description,
    price: validationRules.price,
    condition: validationRules.condition,
    size: validationRules.size,
    tags: validationRules.tags,
    images: z.array(validationRules.url).min(1, 'At least one image is required').max(10)
  }),
  
  // Message form
  message: z.object({
    content: z.string()
      .min(1, 'Message cannot be empty')
      .max(1000, 'Message must be less than 1000 characters')
      .trim()
  }),
  
  // Payment form
  payment: z.object({
    cardNumber: z.string()
      .regex(/^\d{13,19}$/, 'Invalid card number'),
    expiryMonth: z.number().int().min(1).max(12),
    expiryYear: z.number().int().min(new Date().getFullYear()),
    cvc: z.string().regex(/^\d{3,4}$/, 'Invalid CVC'),
    billingZip: validationRules.zipCode
  })
};

// Custom validators for specific use cases
export const customValidators = {
  // Check if username is available (would need API call)
  uniqueUsername: (existingUsernames: string[]) => 
    z.string().refine(
      username => !existingUsernames.includes(username.toLowerCase()),
      'This username is already taken'
    ),
    
  // Password strength meter
  passwordStrength: (password: string): {
    score: number;
    feedback: string[];
  } => {
    let score = 0;
    const feedback: string[] = [];
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score < 3) feedback.push('Consider using a mix of letters, numbers, and symbols');
    if (password.length < 12) feedback.push('Longer passwords are more secure');
    if (!/[^A-Za-z0-9]/.test(password)) feedback.push('Add special characters for extra security');
    
    return { score: Math.min(score, 5), feedback };
  },
  
  // Profanity filter (basic example)
  noProfanity: (blockedWords: string[]) =>
    z.string().refine(
      text => {
        const lowerText = text.toLowerCase();
        return !blockedWords.some(word => lowerText.includes(word));
      },
      'This content contains inappropriate language'
    )
};

// Form state management helper
export interface FormState<T = any> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Create initial form state
export function createFormState<T>(initialValues: T): FormState<T> {
  return {
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true
  };
}

// Update form field
export function updateFormField<T>(
  state: FormState<T>,
  field: keyof T,
  value: unknown,
  validator?: z.ZodSchema
): FormState<T> {
  const newState = {
    ...state,
    values: {
      ...state.values,
      [field]: value
    },
    touched: {
      ...state.touched,
      [field]: true
    }
  };
  
  // Validate field if validator provided
  if (validator) {
    const error = validateField(value, validator, String(field));
    if (error) {
      newState.errors = {
        ...state.errors,
        [field]: error.message
      };
    } else {
      // Remove error if validation passes
      const { [field]: removed, ...remainingErrors } = state.errors;
      newState.errors = remainingErrors;
    }
  }
  
  // Update overall form validity
  newState.isValid = Object.keys(newState.errors).length === 0;
  
  return newState;
}

// Validation utilities for Svelte components
export function createFieldValidator(schema: z.ZodSchema) {
  return (value: unknown): string | null => {
    const result = schema.safeParse(value);
    return result.success ? null : result.error.issues[0]?.message || 'Invalid value';
  };
}

// Debounced validation for real-time feedback
export function createDebouncedValidator(
  validator: (value: unknown) => string | null,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout;
  
  return (value: unknown, callback: (error: string | null) => void) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const error = validator(value);
      callback(error);
    }, delay);
  };
}

// Export all schemas and validators
export default {
  rules: validationRules,
  schemas: formSchemas,
  custom: customValidators,
  validateForm,
  safeValidateForm,
  validateField,
  formatZodErrors,
  createFormState,
  updateFormField,
  createFieldValidator,
  createDebouncedValidator
};