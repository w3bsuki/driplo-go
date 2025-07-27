# Preview of app.css Changes - Task 9.1.1

## Lines to be REMOVED (69-159):

```css
/* Legacy shadcn mappings for compatibility */
@layer base {
	:root {
	/* Map to shadcn conventions */
	--background: 0 0% 100%; /* white */
	--foreground: 0 0% 6%; /* near black */

	--card: 0 0% 100%;
	--card-foreground: 0 0% 6%;

	--popover: 0 0% 100%;
	--popover-foreground: 0 0% 6%;

	/* Baby Blue primary */
	--primary: 197 71% 73%; /* #87CEEB */
	--primary-foreground: 0 0% 0%;

	/* Mocha secondary */
	--secondary: 22 22% 55%; /* #A47764 */
	--secondary-foreground: 0 0% 100%;

	--muted: 0 0% 96%;
	--muted-foreground: 0 0% 45%;

	/* Baby Blue accent */
	--accent: 197 71% 73%;
	--accent-foreground: 0 0% 0%;

	/* Semantic colors */
	--destructive: 0 84% 60%; /* red */
	--destructive-foreground: 0 0% 100%;

	/* Additional semantic tokens for badges */
	--success: 152 69% 42%; /* green */
	--success-foreground: 0 0% 100%;
	--warning: 61 95% 66%; /* yellow */
	--warning-foreground: 0 0% 6%;

	/* Condition colors for badges */
	--color-condition-new: 152 69% 42%; /* green */
	--color-condition-new-with-tags: 152 69% 38%; /* darker green */
	--color-condition-new-without-tags: 152 60% 35%; /* darkest green */
	--color-condition-very-good: 61 95% 66%; /* yellow */
	--color-condition-good: 35 85% 55%; /* orange */
	--color-condition-fair: 0 84% 60%; /* red */

	--border: 0 0% 90%;
	--input: 0 0% 90%;
	--ring: 197 71% 73%; /* baby blue */

	--radius: 0.5rem;
	--radius-sm: 0.25rem;
	--radius-md: 0.375rem;
		--radius-lg: 0.5rem;
	}

	/* Dark mode */
	.dark {
	--background: 0 0% 5%; /* #0D0D0D */
	--foreground: 0 0% 98%;

	--card: 0 0% 8%;
	--card-foreground: 0 0% 98%;

	--popover: 0 0% 8%;
	--popover-foreground: 0 0% 98%;

	/* Adjusted baby blue for dark mode */
	--primary: 197 71% 65%; /* #6BB6D8 */
	--primary-foreground: 0 0% 100%;

	/* Adjusted mocha for dark mode */
	--secondary: 22 18% 40%; /* #7A5D4E */
	--secondary-foreground: 0 0% 98%;

	--muted: 0 0% 15%;
	--muted-foreground: 0 0% 65%;

	--accent: 197 71% 65%;
	--accent-foreground: 0 0% 100%;

	--destructive: 0 62% 30%;
	--destructive-foreground: 0 0% 98%;

	--success: 152 69% 35%;
	--warning: 61 95% 55%;

	--border: 0 0% 15%;
	--input: 0 0% 15%;
		--ring: 197 71% 65%;
	}
}
```

## Classes that currently depend on these HSL values:

### In the same file (app.css lines 162-289):
```css
/* Custom legacy utilities for backward compatibility */
@layer utilities {
	/* Background utilities with opacity support */
.bg-background {
	background-color: hsl(var(--background));
}

.bg-muted {
	background-color: hsl(var(--muted));
}

.bg-muted\/50 {
	background-color: hsl(var(--muted) / 0.5);
}

/* ... more utilities using hsl() ... */

/* Semantic color utilities */
.bg-success {
	background-color: hsl(var(--success));
}

.text-success-foreground {
	color: hsl(var(--success-foreground));
}

.bg-warning {
	background-color: hsl(var(--warning));
}

.text-warning-foreground {
	color: hsl(var(--warning-foreground));
}
```

## Components using these classes (partial list):
1. **Button.svelte**: Uses bg-primary, text-destructive-foreground
2. **Badge.svelte**: Uses bg-secondary, text-secondary-foreground, bg-destructive
3. **Input.svelte**: Uses border-input, bg-background
4. **Card components**: Use bg-card, text-card-foreground
5. **Alert components**: Use bg-destructive, text-destructive-foreground
6. **Header.svelte**: Uses bg-background, border-border
7. **Many more...**

## CRITICAL: What will break if we remove these now:
- ALL color classes that depend on HSL values will stop working
- Components will lose their colors entirely
- The site will look completely broken

## Safe Migration Path:
1. **DO NOT REMOVE YET** - First create the mapping
2. Create temporary compatibility classes that map old names to new tokens
3. Update components one by one
4. Only then remove the HSL layer

## Recommendation:
**STOP** - We need to create the mapping FIRST before removing anything!