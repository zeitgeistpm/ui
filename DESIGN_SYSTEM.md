# Zeitgeist UI Design System

## Overview

This document outlines the glass morphism design system implemented across the Zeitgeist prediction markets platform. The design emphasizes transparency, depth, and modern aesthetics through frosted glass effects, soft backgrounds, and consistent color theming.

## Design Philosophy

### Core Principles

1. **Glass Morphism**: Use of translucent backgrounds with backdrop blur to create layered, modern interfaces
2. **Sky Color Palette**: Consistent use of sky-based colors (sky-50 through sky-950) for cohesive theming
3. **Subtle Depth**: Soft shadows and borders instead of harsh outlines
4. **Visual Hierarchy**: Clear distinction between interactive and static elements through transparency and color
5. **Mobile-First Responsiveness**: Solid backgrounds on mobile, glass effects on desktop where appropriate

## Color Palette

### Primary Colors

- **Sky-950**: `#0c4a6e` - Primary navigation backgrounds (dark)
- **Sky-900**: `#0369a1` - Primary text, headings, strong emphasis
- **Sky-700**: `#0284c7` - Secondary text, descriptions
- **Sky-600**: `#0ea5e9` - Icons, accents, primary buttons
- **Sky-200**: `#bae6fd` - Borders, subtle accents
- **Sky-100**: `#e0f2fe` - Hover states (with opacity)
- **Sky-50**: `#f0f9ff` - Light backgrounds, menu backgrounds

### Supporting Colors

- **White**: Base for glass morphism effects
  - `bg-white/95` - Desktop glass panels
  - `bg-white/80` - Hover states on light backgrounds
  - `bg-white` - Solid mobile backgrounds

- **Gradients**: Used for progress indicators and dynamic elements
  - Emerald: `from-emerald-400/80 to-emerald-500/80` (success, active states)
  - Yellow: `from-yellow-400/80 to-yellow-500/80` (warnings, pending)
  - Purple: `from-purple-400/80 to-purple-500/80` (reporting, special states)
  - Orange: `from-orange-400/80 to-orange-500/80` (disputes, alerts)

## Component Patterns

### Navigation Components

#### TopBar (Main Navigation)
**File**: `/components/top-bar/index.tsx`

```tsx
// Main TopBar Container
className="fixed top-0 z-40 w-full shadow-lg transition-all duration-300"

// TopBar Content
className="bg-sky-950/95 py-1.5 backdrop-blur-md"

// Desktop Menu Items (glass morphism)
className="md:absolute md:mt-8 md:h-auto md:w-72 md:rounded-lg md:border md:border-white/20 md:bg-white/95 md:backdrop-blur-lg"

// Mobile Menu (solid backgrounds)
className="fixed left-0 right-0 bottom-0 top-[50px] z-40 h-[calc(100vh-50px)] w-screen overflow-y-auto bg-sky-50"
```

**Key Features**:
- Dark frosted glass background: `bg-sky-950/95 backdrop-blur-md`
- Mobile menus use solid `bg-sky-50` backgrounds
- Desktop menus use glass effect: `bg-white/95 backdrop-blur-lg`
- Menu starts below TopBar on mobile: `top-[50px]`
- z-index: `z-40` for TopBar, submenus also `z-40` but positioned below

#### QuickNav (Secondary Navigation)
**Integrated into**: `/components/top-bar/index.tsx`

```tsx
// QuickNav Container
className="w-full border-b-1 border-sky-200/30 bg-white/80 shadow-sm backdrop-blur-md"

// Navigation Links
className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-sky-900 transition-all hover:bg-sky-100/80"
```

**Key Features**:
- Light glass background: `bg-white/80 backdrop-blur-md`
- Subtle border: `border-sky-200/30`
- Conditionally hidden on pages with their own filters (markets list)
- Hover state: `hover:bg-sky-100/80`

### Menu & Dropdown Patterns

#### Mobile Menu Pattern

```tsx
// All mobile menus follow this pattern:
className="fixed left-0 right-0 bottom-0 top-[50px] z-40 h-[calc(100vh-50px)] w-screen overflow-y-auto bg-sky-50"

// Menu items (default state - transparent)
className="transition-all hover:bg-white/80"

// Menu items (active state)
className={`${active ? "bg-white/80" : ""}`}
```

**Rules**:
1. Always position below TopBar: `top-[50px]`
2. Full viewport coverage: `left-0 right-0 bottom-0`
3. Solid background on mobile: `bg-sky-50`
4. Scrollable: `overflow-y-auto`
5. Hover state uses semi-transparent white: `hover:bg-white/80`

#### Desktop Dropdown Pattern

```tsx
// Desktop dropdowns use glass morphism:
className="md:absolute md:rounded-lg md:border md:border-white/20 md:bg-white/95 md:backdrop-blur-lg"

// Menu items hover state
className="hover:bg-sky-50/60"
```

### Account Components

#### AccountButton
**File**: `/components/account/AccountButton.tsx`

```tsx
// Account Button
className="border-2 bg-sky-950/95 backdrop-blur-md hover:bg-sky-900/95"
className={`${open ? "border-sky-200" : "border-white/60"}`}

// Dropdown Menu
className="fixed left-0 right-0 bottom-0 top-[50px] z-40 h-[calc(100vh-50px)] w-screen overflow-y-auto bg-sky-50 md:absolute md:right-0 md:mt-6 md:h-auto md:w-72 md:rounded-lg md:border md:border-white/20 md:bg-white/95 md:backdrop-blur-lg"

// Menu Items
className="hover:bg-white/80"
```

**Key Features**:
- Button uses dark glass: `bg-sky-950/95 backdrop-blur-md`
- Border changes on open: `border-sky-200` vs `border-white/60`
- Dropdown follows mobile/desktop pattern
- Text colors: `text-sky-900` for headings, `text-sky-700` for descriptions

### Market Components

#### Market Cards
**Files**:
- `/components/markets/market-card/index.tsx`
- `/components/markets/market-card/MarketOrComboCard.tsx`

```tsx
// Card Container
className="rounded-lg bg-white/80 p-4 shadow-md transition-all hover:shadow-lg md:hover:scale-[1.01]"

// Text Elements
className="text-sky-900" // Primary text
className="text-sky-700" // Secondary text

// Icons
className="text-sky-900"

// Prediction Bar
className="h-8 w-full overflow-hidden rounded-lg bg-gradient-to-r from-sky-50 to-sky-100 shadow-sm"
className="h-full bg-gradient-to-r from-sky-200 to-sky-300"
```

**Key Features**:
- Light glass cards: `bg-white/80`
- Soft shadows with hover effect
- Gradient backgrounds for prediction bars
- Consistent sky-900 for primary text

#### MarketTimer
**File**: `/components/markets/MarketTimer.tsx`

```tsx
// Timer Container
className="relative h-6 w-full overflow-hidden rounded-lg border border-sky-200/30 bg-sky-50/50 shadow-sm backdrop-blur-sm"

// Progress Bar (dynamic colors)
className="bg-gradient-to-r from-emerald-400/80 to-emerald-500/80" // Trading/Active
className="bg-gradient-to-r from-yellow-400/80 to-yellow-500/80"   // Proposed
className="bg-gradient-to-r from-purple-400/80 to-purple-500/80"   // Reporting
className="bg-gradient-to-r from-orange-400/80 to-orange-500/80"   // Disputed

// Text
className="text-sky-950" // Very dark for high contrast
```

**Key Features**:
- Light frosted background: `bg-sky-50/50 backdrop-blur-sm`
- Gradient progress bars with 80% opacity
- Darker text for better readability: `text-sky-950`
- Subtle border: `border-sky-200/30`

### Search Components

#### MarketSearch
**File**: `/components/markets/MarketSearch.tsx`

```tsx
// Search Input
className="h-9 w-full rounded-lg bg-sky-900 pl-9 pr-3 text-sm text-sky-200 placeholder:text-sky-400"

// Search Results
className="bg-white px-2 py-4 shadow-2xl"
className="text-sky-900" // Result text
```

**Key Features**:
- Dark input background: `bg-sky-900`
- Light text: `text-sky-200`
- Solid white results panel
- Always open by default (no toggle)

## Layout & Spacing

### Container Widths

Use `container-fluid` class throughout for consistent max-width:

```tsx
className="container-fluid"
```

This ensures uniform content width across all pages.

### Breathing Room

Calculate TopBar height dynamically and add spacing:

```tsx
// In DefaultLayout
const [topBarHeight, setTopBarHeight] = useState(52);

// Measure actual height
useEffect(() => {
  const topBarElement = document.getElementById("top-bar-container");
  if (topBarElement) {
    setTopBarHeight(topBarElement.offsetHeight);
  }
}, [router.pathname]);

// Apply spacing (height + 16px breathing room)
style={{ marginTop: `${topBarHeight + 16}px` }}
```

### Z-Index Hierarchy

```
z-50: Nested mobile submenus (categories, create market)
z-40: TopBar and primary mobile menus
z-30: QuickNav (when separate component)
z-20: Menu item buttons
z-10: Overlays and modals
```

## Typography

### Font Weights

- **font-bold**: Primary headings, important numbers
- **font-semibold**: Section titles, menu items, labels
- **font-medium**: Body text, descriptions
- **font-light**: Subtle text (deprecated - prefer font-medium with lighter color)

### Text Sizes

- **text-xs**: 0.75rem - Metadata, small labels, menu items
- **text-sm**: 0.875rem - Body text, descriptions
- **text-base**: 1rem - Standard headings
- **text-lg**: 1.125rem - Large headings

### Text Colors

```tsx
text-sky-950 // Darkest - high contrast (timers, critical info)
text-sky-900 // Primary text, headings
text-sky-700 // Secondary text, descriptions
text-sky-600 // Icons, accents
text-sky-400 // Placeholders, disabled states
text-sky-200 // Light text on dark backgrounds
text-white   // Text on very dark backgrounds
```

## Effects & Animations

### Backdrop Blur

```tsx
backdrop-blur-md  // Standard glass effect
backdrop-blur-lg  // Stronger glass effect
backdrop-blur-sm  // Subtle blur for light elements
```

### Shadows

```tsx
shadow-sm     // Subtle depth (cards, inputs)
shadow-md     // Medium depth (elevated cards)
shadow-lg     // Strong depth (hover states)
shadow-xl     // Maximum depth (dropdowns, overlays)
shadow-2xl    // Strongest (search results, modals)
```

### Transitions

```tsx
transition-all          // Smooth all property changes
transition-all duration-300 // Longer transitions for major changes
```

### Hover States

```tsx
// On light backgrounds (sky-50)
hover:bg-white/80

// On white/glass backgrounds
hover:bg-sky-50/60
hover:bg-sky-100/80

// On dark backgrounds
hover:bg-sky-900/95

// Scale effects (cards)
md:hover:scale-[1.01]

// Shadow effects
hover:shadow-lg
hover:shadow-md
```

## Responsive Breakpoints

Follow mobile-first approach:

```tsx
// Mobile (default)
className="bg-sky-50"

// Desktop (md: 768px and up)
className="md:bg-white/95 md:backdrop-blur-lg"
```

Common breakpoint patterns:
- `md:` - 768px and up (tablet/desktop)
- `sm:` - 640px and up (small tablets)
- `lg:` - 1024px and up (large screens)

## Implementation Guidelines

### Adding New Components

1. **Choose Background**:
   - Light sections: `bg-sky-50/50` or `bg-white/80`
   - Dark sections: `bg-sky-950/95`
   - Mobile menus: `bg-sky-50` (solid)
   - Desktop menus: `bg-white/95 backdrop-blur-lg`

2. **Add Border** (if needed):
   ```tsx
   border border-sky-200/30  // Subtle borders
   border-white/20           // Glass panel borders
   ```

3. **Add Shadow**:
   ```tsx
   shadow-sm   // Default for most elements
   shadow-md   // Cards and elevated elements
   ```

4. **Set Text Color**:
   ```tsx
   text-sky-900  // Primary text
   text-sky-700  // Secondary text
   ```

5. **Add Hover State**:
   ```tsx
   hover:bg-white/80      // On light backgrounds
   hover:bg-sky-100/80    // On white backgrounds
   transition-all         // Smooth transition
   ```

### Mobile Menu Checklist

When creating mobile dropdown menus:

- [ ] Uses `fixed left-0 right-0 bottom-0 top-[50px]`
- [ ] Height is `h-[calc(100vh-50px)]`
- [ ] Background is solid `bg-sky-50` on mobile
- [ ] Has `overflow-y-auto` for scrolling
- [ ] Desktop uses `md:bg-white/95 md:backdrop-blur-lg`
- [ ] Menu items use `hover:bg-white/80`
- [ ] Text colors are `text-sky-900`

### Glass Morphism Checklist

For any glass morphism component:

- [ ] Uses translucent background (`/80`, `/90`, `/95`)
- [ ] Has `backdrop-blur-md` or `backdrop-blur-lg`
- [ ] Includes subtle border (`border-sky-200/30` or `border-white/20`)
- [ ] Has soft shadow (`shadow-sm` or `shadow-md`)
- [ ] Text is readable (sky-900 or darker)
- [ ] Hover states are defined

## Common Patterns Reference

### Glass Panel (Light)
```tsx
className="rounded-lg border border-sky-200/30 bg-white/80 p-4 shadow-md backdrop-blur-md"
```

### Glass Panel (Dark)
```tsx
className="rounded-lg border border-white/20 bg-sky-950/95 p-4 shadow-md backdrop-blur-md"
```

### Mobile Full-Screen Menu
```tsx
className="fixed left-0 right-0 bottom-0 top-[50px] z-40 h-[calc(100vh-50px)] w-screen overflow-y-auto bg-sky-50 md:absolute md:inset-auto md:mt-6 md:h-auto md:w-72 md:rounded-lg md:border md:border-white/20 md:bg-white/95 md:backdrop-blur-lg"
```

### Interactive Button/Link
```tsx
className="rounded-md px-3 py-1.5 text-sm font-medium text-sky-900 transition-all hover:bg-white/80"
```

### Card with Hover Effect
```tsx
className="rounded-lg bg-white/80 p-4 shadow-md transition-all hover:shadow-lg md:hover:scale-[1.01]"
```

### Gradient Progress Bar
```tsx
className="h-full rounded-lg bg-gradient-to-r from-emerald-400/80 to-emerald-500/80 transition-all"
```

## Accessibility Considerations

1. **Text Contrast**: Always use sky-900 or darker on light backgrounds for WCAG compliance
2. **Focus States**: Ensure keyboard navigation is visible (use `focus:outline-none` with custom focus styles)
3. **Touch Targets**: Minimum 44x44px for mobile interactive elements
4. **Readable Text**: Avoid light text on light backgrounds - use sky-700 minimum

## Migration Guide

When updating existing components to this design system:

1. Replace solid backgrounds with glass morphism:
   - `bg-white` → `bg-white/80 backdrop-blur-md`
   - `bg-gray-100` → `bg-sky-50/50 backdrop-blur-sm`

2. Update text colors to sky palette:
   - `text-black` → `text-sky-900`
   - `text-gray-600` → `text-sky-700`
   - `text-gray-400` → `text-sky-400`

3. Replace hover states:
   - `hover:bg-gray-100` → `hover:bg-white/80`
   - `hover:bg-slate-100` → `hover:bg-sky-100/80`

4. Add borders to panels:
   - Add `border border-sky-200/30`

5. Update shadows:
   - Use `shadow-sm` for subtle depth
   - Use `shadow-md` for cards
   - Use `shadow-xl` for dropdowns

## File References

Key files implementing this design system:

- `/components/top-bar/index.tsx` - Navigation with integrated QuickNav
- `/components/account/AccountButton.tsx` - Account dropdown
- `/components/markets/market-card/index.tsx` - Market cards
- `/components/markets/MarketTimer.tsx` - Progress/status timer
- `/components/markets/MarketSearch.tsx` - Search component
- `/layouts/DefaultLayout.tsx` - Main layout with dynamic spacing
- `/DESIGN_SYSTEM.md` - This document

## Version History

- **v1.0** (2025-01-10): Initial glass morphism design system implementation
  - Established sky color palette
  - Implemented mobile/desktop menu patterns
  - Created consistent spacing and typography rules
  - Documented all component patterns
