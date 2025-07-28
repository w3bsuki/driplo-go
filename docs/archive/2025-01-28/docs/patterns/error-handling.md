# Error Handling Patterns

## Server-Side Error Handling

### Form Actions
```typescript
// +page.server.ts
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
  create: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();
    const title = formData.get('title');
    
    // Validation
    if (!title || typeof title !== 'string') {
      return fail(400, {
        errors: { title: 'Title is required' }
      });
    }
    
    // Database operation
    const { error } = await supabase
      .from('listings')
      .insert({ title });
      
    if (error) {
      console.error('Database error:', error);
      return fail(500, {
        message: 'Failed to create listing. Please try again.'
      });
    }
    
    return { success: true };
  }
};
```

### Load Function Errors
```typescript
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
  const { data, error: dbError } = await supabase
    .from('listings')
    .select('*')
    .eq('id', params.id)
    .single();
    
  if (dbError || !data) {
    console.error('Failed to load listing:', dbError);
    throw error(404, {
      message: 'Listing not found'
    });
  }
  
  return { listing: data };
};
```

## Client-Side Error Display

### Form Error Display
```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  
  export let form: ActionData;
</script>

{#if form?.message}
  <Alert variant="destructive" class="mb-4">
    <AlertDescription>{form.message}</AlertDescription>
  </Alert>
{/if}

<form method="POST" use:enhance>
  <!-- Form fields with inline errors -->
  <div>
    <Input name="title" />
    {#if form?.errors?.title}
      <p class="text-sm text-destructive mt-1">{form.errors.title}</p>
    {/if}
  </div>
</form>
```

### Global Error Boundary
```svelte
<!-- +error.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import { Button } from '$lib/components/ui/button';
</script>

<div class="container mx-auto px-4 py-16 text-center">
  <h1 class="text-4xl font-bold mb-4">
    {$page.status === 404 ? 'Page Not Found' : 'Something went wrong'}
  </h1>
  
  <p class="text-muted-foreground mb-8">
    {$page.error?.message || 'An unexpected error occurred'}
  </p>
  
  <Button href="/" variant="default">
    Go back home
  </Button>
</div>
```

### Try-Catch Pattern
```typescript
async function updateProfile(data: ProfileData) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userId);
      
    if (error) throw error;
    
    // Success handling
    showToast('Profile updated successfully');
  } catch (err) {
    console.error('Profile update failed:', err);
    showToast('Failed to update profile', 'error');
  }
}
```

## Supabase Error Handling

### Auth Errors
```typescript
const { data, error } = await supabase.auth.signIn({
  email,
  password
});

if (error) {
  switch (error.message) {
    case 'Invalid login credentials':
      return fail(400, {
        errors: { email: 'Invalid email or password' }
      });
    case 'Email not confirmed':
      return fail(400, {
        errors: { email: 'Please verify your email first' }
      });
    default:
      return fail(500, {
        message: 'Authentication failed. Please try again.'
      });
  }
}
```

### RLS Policy Errors
```typescript
const { data, error } = await supabase
  .from('user_listings')
  .select('*');
  
if (error) {
  if (error.code === 'PGRST301') {
    // RLS policy violation
    console.error('User not authorized to view listings');
    throw error(403, 'Access denied');
  }
  throw error(500, 'Failed to load listings');
}
```

## Best Practices
1. **Log errors server-side** but don't expose details to users
2. **Provide user-friendly error messages**
3. **Use proper HTTP status codes** (400 for client errors, 500 for server)
4. **Handle loading and error states** in all components
5. **Implement retry logic** for transient failures
6. **Show field-specific validation errors** inline
7. **Use toast notifications** for action feedback
8. **Create custom error pages** for 404 and 500 errors