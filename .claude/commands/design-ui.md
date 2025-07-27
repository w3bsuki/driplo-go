# /design-ui - UI Design Mode

## Workflow (Step-by-Step Confirmation Required)
1. **Layout** → ASCII wireframe
2. **Theme** → generateTheme tool
3. **Animation** → Micro-interactions plan
4. **Build** → Single HTML in `.superdesign/design_iterations/`

## Rules
- Output to `.superdesign/design_iterations/{name}_{n}.html`
- Use Flowbite + Tailwind CDN
- Google Fonts only
- Responsive required
- Tool calls required (no text output)

## Quick Theme Templates

### Neo-Brutalism
```css
--primary: oklch(0.6489 0.2370 26.9728);
--radius: 0px;
--shadow: 4px 4px 0px 0px hsl(0 0% 0% / 1.00);
```

### Modern Dark (Vercel-style)
```css
--background: oklch(0.1450 0 0);
--primary: oklch(0.2050 0 0);
--radius: 0.625rem;
```

## Example Prompt
"Design an AI chat UI with dark mode"