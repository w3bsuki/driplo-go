
# Frontend Refactoring Plan: Driplo.bg

**Objective:** To resolve the critical UI/UX, styling, and architectural issues identified in the audit reports. This plan will guide the systematic refactoring of the application to create a consistent, maintainable, and accessible design system.

**Guiding Principles:**
- **Unify on `bits-ui`:** All custom UI components that duplicate `bits-ui` functionality will be replaced.
- **Strictly Tailwind CSS:** All inline styles and custom CSS will be migrated to Tailwind utility classes.
- **Componentization:** Large, monolithic components will be broken down into smaller, single-purpose components.
- **Accessibility First:** All components will be made fully accessible.

---

## Phase 1: Foundational Cleanup & Tooling (Est. 1-2 days)

*Goal: Establish a clean baseline and prevent new issues from being introduced.*

1.  **Fix CSS Debug Rule:**
    -   **File:** `src/app.css`
    -   **Task:** Modify the debug rule to be effective in development. The `@media (dev)` condition is non-standard and should be removed.
    -   **Implementation:**
        ```diff
        - @media (dev) {
        -   [style*="width:"],
        -   [style*="height:"] {
        -     outline: 2px solid red !important;
        -   }
        - }
        + /* For debugging inline styles during development */
        + .debug-inline-styles [style*="width:"],
        + .debug-inline-styles [style*="height:"] {
        +   outline: 2px solid red !important;
        + }
        ```
    -   **Note:** The `debug-inline-styles` class should be applied to the `<body>` tag conditionally during development.

2.  **Create `ProgressBar` Component:**
    -   **File:** `src/lib/components/ui/ProgressBar.svelte`
    -   **Task:** Create the `ProgressBar` component as specified in the `DESIGN_SYSTEM_FIX_REPORT.md`. This will be used to replace numerous inline `width` styles.
    -   **Implementation:** Use the code provided in the report to create this component.

3.  **Replace All Progress Bar Patterns:**
    -   **Task:** Search the codebase for the progress bar pattern (`<div style="width: {progress}%">`) and replace all instances with the new `<ProgressBar />` component.
    -   **Files to check:** `ProfileStats.svelte`, `CreateListingForm.svelte`, `BrandOnboardingWizard.svelte`, `ProfileSetupWizard.svelte`, `ProgressIndicator.svelte`, `CategoryLanding.svelte`, `brands/analytics/+page.svelte`.

---

## Phase 2: Component Standardization (Est. 3-5 days)

*Goal: Eliminate custom UI components and enforce the use of the `bits-ui` design system.*

1.  **Refactor `button.svelte` (High Priority):**
    -   **Task:** Replace the current custom button with a new implementation that wraps `bits-ui` and uses `cva` for variants.
    -   **Steps:**
        1.  Delete the existing `src/lib/components/ui/button.svelte`.
        2.  Create a new `button.svelte` that properly uses `bits-ui`'s `Button` component.
        3.  Update all usages of the old button to work with the new one.

2.  **Refactor Other Custom UI Components:**
    -   **Task:** Systematically replace the following custom components with `bits-ui` equivalents, as detailed in the report:
        -   `PasswordStrength.svelte` -> `bits-ui` Progress
        -   `RatingStars.svelte` -> `bits-ui` RadioGroup
        -   `ColorPicker.svelte` -> `bits-ui` Popover
        -   `Confetti.svelte` -> Extract to a utility function
        -   `InfiniteScroll.svelte` -> Use Intersection Observer API

---

## Phase 3: Structural Refactoring of Complex Components (Est. 3-5 days)

*Goal: Break down monolithic components into smaller, more manageable pieces.*

1.  **Refactor `ListingCard.svelte`:**
    -   **Task:** Decompose the `ListingCard.svelte` component into smaller, more focused components.
    -   **Steps:**
        1.  Create a new directory: `src/lib/components/listings/listing-card/`.
        2.  Create the following components in the new directory: `ListingCard.svelte` (presentation only), `ListingCardImage.svelte`, `ListingCardInfo.svelte`, and `ListingCardActions.svelte`.
        3.  Create a `useLikeToggle.ts` hook in the same directory to encapsulate the API logic.
        4.  Refactor the main `ListingCard.svelte` to use these new components and the hook.

2.  **Refactor `Header.svelte`:**
    -   **Task:** Decompose the `Header.svelte` component.
    -   **Steps:**
        1.  Create a new directory: `src/lib/components/layout/header/`.
        2.  Create the following components in the new directory: `DesktopNav.svelte`, `MobileNav.svelte`, `SearchBar.svelte`, `UserMenu.svelte`, and `NotificationBell.svelte`.
        3.  Refactor the main `Header.svelte` to be a container that uses these new components.

---

## Phase 4: Accessibility Overhaul (Est. 2-3 days)

*Goal: Ensure the application is fully accessible to all users.*

1.  **Add ARIA Attributes:**
    -   **Task:** Audit all interactive elements and ensure they have the correct ARIA attributes.
    -   **Checklist:**
        -   All icon-only buttons must have an `aria-label`.
        -   All interactive elements must have a `role` (e.g., `button`, `link`).
        -   All elements that toggle state must have `aria-pressed` or `aria-expanded`.

2.  **Fix Form Labeling:**
    -   **Task:** Ensure all form inputs have proper labels.
    -   **Checklist:**
        -   Every `input`, `textarea`, and `select` must have a corresponding `<label>`.
        -   Use the `for` attribute on the label to link it to the input's `id`.
        -   If a visible label is not present, use `aria-label` on the input.

3.  **Implement Live Regions:**
    -   **Task:** Add live regions for dynamic content.
    -   **Checklist:**
        -   All error messages should be in a container with `role="alert"` and `aria-live="polite"`.
        -   Any other dynamically updated content (e.g., search results) should also be in a live region.

---

## Phase 5: Final Polish and Documentation (Est. 2-3 days)

*Goal: Document the new design system and set up processes to maintain quality.*

1.  **Create Storybook Stories:**
    -   **Task:** Write Storybook stories for all of the new and refactored components.

2.  **Set Up Automated Accessibility Testing:**
    -   **Task:** Integrate `axe-core` into your Storybook setup and your Playwright end-to-end tests.

3.  **Create Migration Guide:**
    -   **Task:** Write a short Markdown document for the team that explains the changes and how to use the new design system.

This plan provides a clear roadmap for the refactoring effort. By following these steps, you can create a more consistent, maintainable, and accessible application.
