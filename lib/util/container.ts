/**
 * Container System Utilities
 * 
 * This file documents the container system used throughout the app for consistent spacing.
 * 
 * CONTAINER CLASSES:
 * 
 * 1. `.container-fluid` - Main container with max-width and padding
 *    - Max-width: screen-xl (1280px)
 *    - Padding: px-4 (16px horizontal)
 *    - Use: Main content wrapper in layouts and full-width sections
 * 
 * 2. `.container-fluid-no-padding` - Container without padding
 *    - Max-width: screen-xl
 *    - Padding: none
 *    - Use: When you need full-width content within a container-fluid parent
 * 
 * 3. `.container-content` - Content wrapper with padding
 *    - No max-width constraint
 *    - Padding: px-4
 *    - Use: Inner content within container-fluid when you need padding control
 * 
 * 4. `.container-full` - Full-width container
 *    - No max-width constraint
 *    - Padding: px-4
 *    - Use: Full-width sections that need horizontal padding
 * 
 * LAYOUT STRUCTURE:
 * 
 * DefaultLayout provides:
 * - Fixed TopBar (measured dynamically, includes QuickNav or MarketFilters)
 * - Main element with container-fluid class and marginTop equal to TopBar height
 * - Consistent padding-top: pt-4 for markets pages, pt-6 for others
 * 
 * Pages using DefaultLayout should NOT add:
 * - Additional container-fluid wrappers (already provided)
 * - Extra horizontal padding (container-fluid handles this)
 * - margin-top adjustments (layout handles this)
 * 
 * Pages CAN add:
 * - Vertical spacing (mt-*, mb-*, gap-*) for content flow
 * - Section-specific containers if breaking out of main container
 */

/**
 * Get the current top bar total height from CSS variable
 * Useful for components that need to position relative to the top bar
 */
export function getTopBarHeight(): number {
  if (typeof window === "undefined") return 52; // SSR fallback
  
  const height = getComputedStyle(document.documentElement)
    .getPropertyValue("--top-bar-total-height");
  
  return height ? parseInt(height.replace("px", ""), 10) : 52;
}

