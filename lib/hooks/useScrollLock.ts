import { useEffect } from "react";

/**
 * Hook to lock body scroll when modal/dialog is open
 * Prevents scrolling while keeping background content visible for backdrop blur effect
 */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (locked) {
      const body = document.body;
      const html = document.documentElement;

      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Get current styles to restore later
      const originalBodyOverflow = body.style.overflow;
      const originalBodyPosition = body.style.position;
      const originalBodyTop = body.style.top;
      const originalBodyWidth = body.style.width;
      const originalHtmlOverflow = html.style.overflow;

      // Lock scroll by setting position fixed but preserving scroll position visually
      // This keeps content visible for backdrop blur while preventing scrolling
      body.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.width = "100%";
      
      html.style.overflow = "hidden";

      return () => {
        // Restore original styles
        body.style.overflow = originalBodyOverflow;
        body.style.position = originalBodyPosition;
        body.style.top = originalBodyTop;
        body.style.width = originalBodyWidth;
        html.style.overflow = originalHtmlOverflow;

        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [locked]);
}
