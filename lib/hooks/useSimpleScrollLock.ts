import { useEffect } from "react";

/**
 * Simple CSS-based scroll lock that avoids complex JS calculations.
 * Uses a data attribute on the body element to enable CSS-based scroll locking.
 * This prevents multiple hooks from conflicting with each other.
 */
let scrollLockCount = 0; // Track nested locks

export function useSimpleScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isLocked) {
      // Increment lock count
      scrollLockCount++;

      // Apply lock if this is the first lock
      if (scrollLockCount === 1) {
        document.body.setAttribute("data-scroll-locked", "true");
      }

      return () => {
        // Decrement lock count on cleanup
        scrollLockCount--;

        // Remove lock only when all locks are released
        if (scrollLockCount === 0) {
          document.body.removeAttribute("data-scroll-locked");
        }
      };
    }
  }, [isLocked]);
}

/**
 * Emergency function to clear all scroll locks.
 * Use this if the scroll gets stuck.
 */
export function clearAllScrollLocks() {
  scrollLockCount = 0;
  document.body.removeAttribute("data-scroll-locked");
}

// Make it available globally for debugging
if (typeof window !== "undefined") {
  (window as any).clearAllScrollLocks = clearAllScrollLocks;
}