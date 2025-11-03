# Mobile UX Guidelines for Zeitgeist UI

## Overview
This document outlines the mobile user experience best practices implemented in the Zeitgeist UI application. All new components and features should follow these guidelines to ensure a consistent and optimal mobile experience.

## Core Principles

### 1. Touch Target Guidelines
- **Minimum Size**: All interactive elements must have a minimum touch target of 44x44px (iOS) / 48x48dp (Android)
- **Implementation**: Use `min-h-[48px]` or `h-[56px]` for buttons and interactive elements
- **Spacing**: Maintain at least 8px between adjacent touch targets

### 2. Typography for Mobile
- **Minimum Font Size**: 14px (`text-sm` in Tailwind) for body text
- **Headers**: Use `text-base` (16px) or larger for section headers
- **Interactive Text**: Buttons and links should use at least `text-sm` (14px)
- **Line Height**: Ensure appropriate line-height for readability (`leading-relaxed` for body text)

### 3. Viewport Handling

#### Dynamic Viewport Height
The application uses custom CSS variables to handle mobile browser chrome:

```css
/* Set via useMobileViewport hook */
--vh: dynamic viewport height unit
--dvh: dynamic viewport height in pixels
--safe-area-top: iOS safe area top inset
--safe-area-bottom: iOS safe area bottom inset
```

Usage in components:
```tsx
style={{ height: "calc(var(--vh, 1vh) * 100)" }}
```

#### Safe Area Insets
Account for device notches and home indicators:
```tsx
style={{
  paddingTop: "calc(64px + env(safe-area-inset-top, 0px))",
  paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))"
}}
```

### 4. Mobile Navigation Patterns

#### Swipe Gestures
Mobile menus support swipe-to-close functionality:
```tsx
import { useMenuSwipeToClose } from "lib/hooks/useSwipeGesture";

const { menuRef } = useMenuSwipeToClose(isOpen, onClose, "left");
```

#### Body Scroll Locking
Prevent background scrolling when modals/menus are open:
```tsx
import { useBodyScrollLock } from "lib/hooks/useMobileViewport";

useBodyScrollLock(isOpen);
```

### 5. Performance Optimizations

#### iOS Momentum Scrolling
Enable smooth scrolling on iOS devices:
```css
-webkit-overflow-scrolling: touch;
```

#### Hardware Acceleration
Use for animated elements:
```css
transform: translateZ(0);
will-change: transform;
```

### 6. Haptic Feedback
Provide tactile feedback for interactions:
```tsx
import { useHapticFeedback } from "lib/hooks/useHapticFeedback";

const { triggerHaptic } = useHapticFeedback();
// Use: triggerHaptic("light") on button clicks
```

## Component Guidelines

### Buttons
```tsx
// Standard button sizing
className="h-[56px] px-6 text-sm font-semibold"

// Mobile-optimized touch target
className="min-h-[48px] min-w-[44px] touch-manipulation"
```

### Form Inputs
```tsx
// Text inputs with proper sizing
className="h-[56px] px-4 text-base"

// Disable auto-zoom on iOS
<meta name="viewport" content="maximum-scale=1.0, user-scalable=no" />
```

### Navigation Menus
```tsx
// Mobile menu with proper spacing
className="flex min-h-[48px] items-center px-4 py-3"

// Adequate spacing between items
className="space-y-2" // Minimum 8px gap
```

### Modal/Panel Positioning
```tsx
// Full viewport height accounting for browser chrome
style={{
  height: "calc(var(--vh, 1vh) * 100)",
  paddingBottom: "env(safe-area-inset-bottom)"
}}
```

## Accessibility Considerations

### ARIA Attributes
- Use `aria-expanded` for collapsible elements
- Add `aria-label` for icon-only buttons
- Include `role` attributes for custom interactive elements

### Focus Management
```tsx
import { useFocusTrap } from "lib/hooks/useFocusTrap";

const { containerRef } = useFocusTrap(isOpen);
```

## Testing Checklist

### Device Testing
- [ ] iPhone (various models with/without notch)
- [ ] Android phones (various screen sizes)
- [ ] iPad/Tablets
- [ ] Test in both portrait and landscape orientations

### Interaction Testing
- [ ] All buttons have minimum 48px touch target
- [ ] Text is readable without zooming (min 14px)
- [ ] Adequate spacing between interactive elements
- [ ] Swipe gestures work smoothly
- [ ] Scroll locking prevents background scrolling
- [ ] Safe areas are respected on devices with notches

### Performance Testing
- [ ] Smooth scrolling on all devices
- [ ] No layout shifts on orientation change
- [ ] Animations run at 60fps
- [ ] Haptic feedback triggers appropriately

## Implementation Examples

### Mobile-First Responsive Design
```tsx
// Mobile base styles, desktop enhancements
className="text-sm md:text-base"
className="h-[48px] md:h-[40px]"
className="px-4 md:px-6"
```

### Glass Morphism on Mobile
```tsx
// Solid background on mobile, glass effect on desktop
className="bg-sky-50 md:bg-white/95 md:backdrop-blur-lg"
```

### Conditional Mobile Features
```tsx
const { isMobile } = useIsMobile(768);

if (isMobile) {
  // Enable mobile-specific features
  useAutoHapticFeedback(true);
}
```

## Utility Hooks Reference

### useMobileViewport
Sets CSS variables for viewport calculations and provides mobile detection.

### useBodyScrollLock
Locks/unlocks body scroll for modals and overlays.

### useSwipeGesture / useMenuSwipeToClose
Adds swipe gesture support to components.

### useHapticFeedback
Provides haptic feedback on supported devices.

### useFocusTrap
Traps focus within a container for accessibility.

### useIsMobile
Detects if the user is on a mobile device based on viewport width.

## Migration Guide

When updating existing components for mobile optimization:

1. **Audit Touch Targets**: Ensure all interactive elements meet minimum size requirements
2. **Update Font Sizes**: Replace `text-xs` with `text-sm` for better readability
3. **Add Spacing**: Ensure 8px minimum gap between interactive elements
4. **Implement Viewport Handling**: Use `useMobileViewport()` in components with fixed positioning
5. **Add Swipe Support**: Implement swipe-to-close for mobile panels
6. **Test on Devices**: Verify changes on actual mobile devices

## Resources

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)
- [Material Design - Touch Targets](https://material.io/design/usability/accessibility.html#layout-and-typography)
- [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)