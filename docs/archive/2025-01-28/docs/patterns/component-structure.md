# Component Structure Patterns

## Basic Component Template
```svelte
<script lang="ts">
  import type { ComponentProps } from 'svelte';
  
  interface Props {
    data: SomeType;
    variant?: 'default' | 'primary' | 'secondary';
    class?: string;
  }
  
  let { 
    data, 
    variant = 'default',
    class: className = '',
    ...restProps
  }: Props = $props();
</script>

<div class="component-base {variant} {className}" {...restProps}>
  <!-- Component content -->
</div>
```

## Component with Loading States
```svelte
<script lang="ts">
  import { Alert } from '$lib/components/ui/alert';
  import { Skeleton } from '$lib/components/ui/skeleton';
  
  interface Props {
    data: PageData;
    loading?: boolean;
    error?: Error | null;
  }
  
  let { data, loading = false, error = null }: Props = $props();
</script>

{#if loading}
  <div class="space-y-4">
    <Skeleton class="h-4 w-3/4" />
    <Skeleton class="h-4 w-1/2" />
  </div>
{:else if error}
  <Alert variant="destructive">
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{error.message}</AlertDescription>
  </Alert>
{:else if !data || data.items.length === 0}
  <div class="text-center py-12 text-muted-foreground">
    No items found
  </div>
{:else}
  <div class="grid gap-4">
    {#each data.items as item}
      <ItemCard {item} />
    {/each}
  </div>
{/if}
```

## Form Component Pattern
```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  
  interface Props {
    form?: ActionData;
  }
  
  let { form }: Props = $props();
  let submitting = $state(false);
</script>

<form 
  method="POST" 
  use:enhance={() => {
    submitting = true;
    return async ({ update }) => {
      await update();
      submitting = false;
    };
  }}
>
  <div class="space-y-4">
    <div>
      <Label for="title">Title</Label>
      <Input 
        id="title"
        name="title"
        required
        disabled={submitting}
      />
      {#if form?.errors?.title}
        <p class="text-sm text-destructive mt-1">{form.errors.title}</p>
      {/if}
    </div>
    
    <Button type="submit" disabled={submitting}>
      {submitting ? 'Saving...' : 'Save'}
    </Button>
  </div>
</form>
```

## Responsive Component Pattern
```svelte
<script lang="ts">
  import { cn } from '$lib/utils/cn';
  
  interface Props {
    items: Item[];
    class?: string;
  }
  
  let { items, class: className = '' }: Props = $props();
</script>

<div class={cn(
  "grid gap-4",
  "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  className
)}>
  {#each items as item}
    <div class="flex flex-col space-y-2">
      <!-- Mobile-first design -->
      <img 
        src={item.image} 
        alt={item.title}
        class="w-full aspect-square object-cover rounded-lg"
      />
      <h3 class="font-medium truncate">{item.title}</h3>
      <p class="text-sm text-muted-foreground">{item.price}</p>
    </div>
  {/each}
</div>
```

## Component Best Practices
1. **Use TypeScript interfaces** for all props
2. **Provide default values** for optional props
3. **Use $props() rune** for Svelte 5 compatibility
4. **Import from $lib paths** never relative paths
5. **Handle all states**: loading, error, empty, success
6. **Mobile-first responsive design**
7. **Use existing UI components** from shadcn-ui
8. **Apply consistent spacing** using Tailwind classes