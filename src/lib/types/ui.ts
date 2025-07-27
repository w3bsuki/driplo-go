/**
 * UI Component Variant Types
 * Design system types for consistent component variants
 * 
 * @fileoverview Provides type safety for all UI component variants and design tokens
 * @version 1.0.0
 * @created 2025-07-27
 */

// =============================================================================
// DESIGN SYSTEM TOKENS
// =============================================================================

/**
 * Component Size System
 * Standardized sizing across all components
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Color Variants
 * Semantic color system for components
 */
export type ColorVariant = 
  | 'primary'
  | 'secondary' 
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral';

/**
 * Visual Variants
 * Common visual treatment patterns
 */
export type VisualVariant = 
  | 'default'
  | 'outline'
  | 'ghost'
  | 'filled'
  | 'text';

/**
 * Border Radius Variants
 * Design system border radius values
 */
export type BorderRadius = 
  | 'none'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | 'full';

/**
 * Shadow Variants
 * Elevation and shadow system
 */
export type ShadowVariant = 
  | 'none'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | 'inner';

// =============================================================================
// BUTTON VARIANTS
// =============================================================================

/**
 * Button Variants
 * All possible button visual treatments
 */
export type ButtonVariant = 
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';

/**
 * Button Sizes
 * Button-specific size variants
 */
export type ButtonSize = 
  | 'xs'    // 28px height, compact
  | 'sm'    // 36px height, small
  | 'md'    // 40px height, default
  | 'lg'    // 44px height, large
  | 'xl'    // 48px height, extra large
  | 'icon'; // Square icon button

/**
 * Button States
 * Interactive button states
 */
export interface ButtonState {
  disabled: boolean;
  loading: boolean;
  pressed: boolean;
  focused: boolean;
  hovered: boolean;
}

// =============================================================================
// INPUT VARIANTS
// =============================================================================

/**
 * Input Variants
 * Input visual treatments
 */
export type InputVariant = 
  | 'default'
  | 'filled'
  | 'outline'
  | 'ghost';

/**
 * Input Sizes
 * Input-specific size variants
 */
export type InputSize = 
  | 'sm'  // 36px height
  | 'md'  // 40px height, default
  | 'lg'; // 44px height

/**
 * Input States
 * Input validation and interaction states
 */
export interface InputState {
  error: boolean;
  success: boolean;
  disabled: boolean;
  readonly: boolean;
  focused: boolean;
  required: boolean;
}

// =============================================================================
// BADGE VARIANTS
// =============================================================================

/**
 * Badge Variants
 * Badge visual treatments
 */
export type BadgeVariant = 
  | 'default'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'outline';

/**
 * Badge Sizes
 * Badge size variants
 */
export type BadgeSize = 
  | 'xs'  // 20px height
  | 'sm'  // 24px height
  | 'md'  // 28px height, default
  | 'lg'; // 32px height

// =============================================================================
// ALERT VARIANTS
// =============================================================================

/**
 * Alert Variants
 * Alert message types
 */
export type AlertVariant = 
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

/**
 * Alert Sizes
 * Alert size variants
 */
export type AlertSize = 
  | 'sm'
  | 'md'
  | 'lg';

// =============================================================================
// LOADING VARIANTS
// =============================================================================

/**
 * Loading Spinner Variants
 */
export type SpinnerVariant = 
  | 'default'
  | 'dots'
  | 'pulse'
  | 'bars';

/**
 * Loading Spinner Sizes
 */
export type SpinnerSize = 
  | 'xs'  // 16px
  | 'sm'  // 20px
  | 'md'  // 24px, default
  | 'lg'  // 32px
  | 'xl'; // 40px

/**
 * Skeleton Variants
 * Loading placeholder types
 */
export type SkeletonVariant = 
  | 'text'
  | 'rectangular'
  | 'circular'
  | 'rounded';

// =============================================================================
// MODAL AND OVERLAY VARIANTS
// =============================================================================

/**
 * Modal Sizes
 * Modal dialog size variants
 */
export type ModalSize = 
  | 'xs'   // 320px max width
  | 'sm'   // 480px max width
  | 'md'   // 640px max width, default
  | 'lg'   // 800px max width
  | 'xl'   // 1024px max width
  | 'full'; // Full screen

/**
 * Modal Variants
 * Modal visual treatments
 */
export type ModalVariant = 
  | 'default'
  | 'centered'
  | 'drawer'
  | 'fullscreen';

/**
 * Backdrop Variants
 * Overlay backdrop treatments
 */
export type BackdropVariant = 
  | 'blur'
  | 'dark'
  | 'light'
  | 'none';

// =============================================================================
// NAVIGATION VARIANTS
// =============================================================================

/**
 * Navigation Variants
 * Navigation component types
 */
export type NavigationVariant = 
  | 'horizontal'
  | 'vertical'
  | 'breadcrumb'
  | 'tabs'
  | 'pills';

/**
 * Navigation Item States
 */
export interface NavigationItemState {
  active: boolean;
  disabled: boolean;
  expanded: boolean;
  selected: boolean;
}

// =============================================================================
// TABLE VARIANTS
// =============================================================================

/**
 * Table Variants
 * Table visual treatments
 */
export type TableVariant = 
  | 'default'
  | 'striped'
  | 'bordered'
  | 'minimal';

/**
 * Table Sizes
 * Table density variants
 */
export type TableSize = 
  | 'sm'   // Compact
  | 'md'   // Default
  | 'lg';  // Spacious

// =============================================================================
// CARD VARIANTS
// =============================================================================

/**
 * Card Variants
 * Card component visual treatments
 */
export type CardVariant = 
  | 'default'
  | 'outline'
  | 'elevated'
  | 'filled'
  | 'minimal';

/**
 * Card Sizes
 * Card padding and sizing variants
 */
export type CardSize = 
  | 'sm'
  | 'md'
  | 'lg';

// =============================================================================
// LISTING SPECIFIC VARIANTS
// =============================================================================

/**
 * Listing Card Variants
 * Marketplace-specific card treatments
 */
export type ListingCardVariant = 
  | 'default'   // Standard grid card
  | 'compact'   // Smaller card for dense grids
  | 'featured'  // Highlighted featured listing
  | 'minimal'   // Clean minimal design
  | 'list';     // Horizontal list item

/**
 * Condition Badge Variants
 * Product condition indicators
 */
export type ConditionVariant = 
  | 'new'
  | 'like_new'
  | 'good'
  | 'fair'
  | 'worn';

/**
 * Brand Badge Variants
 * Brand verification indicators
 */
export type BrandBadgeVariant = 
  | 'verified'
  | 'partner'
  | 'premium'
  | 'basic';

// =============================================================================
// ANIMATION VARIANTS
// =============================================================================

/**
 * Animation Timing
 * Standardized animation durations
 */
export type AnimationTiming = 
  | 'fast'     // 100ms
  | 'normal'   // 200ms
  | 'slow'     // 300ms
  | 'slower';  // 500ms

/**
 * Animation Easing
 * Animation easing curves
 */
export type AnimationEasing = 
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'spring';

/**
 * Transition Types
 * Component transition patterns
 */
export type TransitionType = 
  | 'fade'
  | 'slide'
  | 'scale'
  | 'flip'
  | 'bounce';

// =============================================================================
// RESPONSIVE VARIANTS
// =============================================================================

/**
 * Breakpoint Types
 * Responsive design breakpoints
 */
export type Breakpoint = 
  | 'xs'    // 0px+
  | 'sm'    // 640px+
  | 'md'    // 768px+
  | 'lg'    // 1024px+
  | 'xl'    // 1280px+
  | '2xl';  // 1536px+

/**
 * Responsive Property
 * Properties that can be responsive
 */
export type ResponsiveProperty<T> = T | Partial<Record<Breakpoint, T>>;

// =============================================================================
// THEME VARIANTS
// =============================================================================

/**
 * Theme Mode
 * Light/dark theme support
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Color Scheme
 * Brand color schemes
 */
export type ColorScheme = 
  | 'blue'
  | 'purple'
  | 'green'
  | 'orange'
  | 'red'
  | 'gray';

// =============================================================================
// ACCESSIBILITY VARIANTS
// =============================================================================

/**
 * Screen Reader Text
 * Accessible text for screen readers
 */
export interface ScreenReaderText {
  text: string;
  hidden?: boolean;
}

/**
 * Focus Visible
 * Focus indicator configuration
 */
export interface FocusVisible {
  enabled: boolean;
  variant: 'ring' | 'outline' | 'background';
  color: ColorVariant;
}

/**
 * Reduced Motion
 * Animation preferences
 */
export interface ReducedMotion {
  respectUserPreference: boolean;
  fallback: 'none' | 'fade' | 'instant';
}

// =============================================================================
// LAYOUT VARIANTS
// =============================================================================

/**
 * Flex Direction
 */
export type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';

/**
 * Flex Alignment
 */
export type FlexAlign = 'start' | 'end' | 'center' | 'stretch' | 'baseline';

/**
 * Flex Justify
 */
export type FlexJustify = 
  | 'start'
  | 'end'
  | 'center'
  | 'between'
  | 'around'
  | 'evenly';

/**
 * Grid Template
 */
export type GridTemplate = 
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '12'
  | 'auto'
  | 'none';

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Component Props Base
 * Common props for all UI components
 */
export interface ComponentPropsBase {
  /** Additional CSS classes */
  class?: string;
  /** Component ID */
  id?: string;
  /** Data test ID for testing */
  'data-testid'?: string;
  /** ARIA label */
  'aria-label'?: string;
  /** ARIA described by */
  'aria-describedby'?: string;
}

/**
 * Interactive Component Props
 * Common props for interactive components
 */
export interface InteractiveComponentProps extends ComponentPropsBase {
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Tab index */
  tabindex?: number;
}

/**
 * Style Props
 * Common styling props
 */
export interface StyleProps {
  /** Component variant */
  variant?: string;
  /** Component size */
  size?: ComponentSize;
  /** Color variant */
  color?: ColorVariant;
  /** Border radius */
  radius?: BorderRadius;
  /** Shadow variant */
  shadow?: ShadowVariant;
}
