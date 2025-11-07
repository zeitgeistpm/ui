import { useEffect, useState } from "react";

/**
 * Hook to match media queries using native CSS media query matching
 * Much more performant than window.innerWidth checks
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === "undefined") return;

    // Create media query list
    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Create listener
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(listener);
      return () => mediaQuery.removeListener(listener);
    }
  }, [query]);

  return matches;
}

/**
 * Tailwind-compatible breakpoint hooks
 * These use CSS media queries instead of JavaScript calculations
 */
export function useIsMobile() {
  return useMediaQuery("(max-width: 639px)"); // sm breakpoint
}

export function useIsTablet() {
  return useMediaQuery("(min-width: 640px) and (max-width: 1023px)"); // sm to lg
}

export function useIsDesktop() {
  return useMediaQuery("(min-width: 1024px)"); // lg and up
}

/**
 * Hook to get current breakpoint
 */
export function useBreakpoint() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  if (isMobile) return "mobile";
  if (isTablet) return "tablet";
  if (isDesktop) return "desktop";
  return "mobile"; // fallback
}