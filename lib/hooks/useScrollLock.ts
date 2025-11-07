import { useEffect, useRef } from "react";

/**
 * Hook to lock body scroll when modal/dialog is open
 * Properly handles scroll position to prevent content jumping
 */
export function useScrollLock(locked: boolean) {
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (locked) {
      // Check if we're on mobile iOS (which has specific scrolling issues)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      // Save current scroll position
      scrollPositionRef.current = window.scrollY || window.pageYOffset || 0;
      const body = document.body;

      // Store original styles
      const originalStyles = {
        overflow: body.style.overflow,
        position: body.style.position,
        top: body.style.top,
        width: body.style.width,
      };

      // Apply scroll lock with iOS-friendly approach
      if (isIOS) {
        // For iOS, use a simpler approach to avoid conflicts
        body.style.overflow = "hidden";
        body.style.position = "relative";
      } else {
        // For other devices, use the fixed position approach
        body.style.overflow = "hidden";
        body.style.position = "fixed";
        body.style.top = `-${scrollPositionRef.current}px`;
        body.style.width = "100%";
      }

      return () => {
        // Restore original styles
        Object.keys(originalStyles).forEach(key => {
          body.style[key] = originalStyles[key] || "";
        });

        // Restore scroll position (not needed for iOS)
        if (!isIOS && scrollPositionRef.current > 0) {
          window.scrollTo({
            top: scrollPositionRef.current,
            behavior: "instant" as ScrollBehavior,
          });
        }
      };
    }
  }, [locked]);
}
