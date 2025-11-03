import { useEffect, useState } from "react";

/**
 * Custom hook to handle mobile viewport height calculations
 * This addresses the issue where 100vh doesn't account for browser chrome on mobile
 */
export const useMobileViewport = () => {
  useEffect(() => {
    // Calculate the actual viewport height and set CSS variable
    const setViewportHeight = () => {
      // Get the actual viewport height
      const vh = window.innerHeight * 0.01;
      // Set the CSS variable --vh
      document.documentElement.style.setProperty('--vh', `${vh}px`);

      // Also set dynamic viewport units for modern browsers
      document.documentElement.style.setProperty('--dvh', `${window.innerHeight}px`);

      // Calculate safe area for iOS devices
      const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)') || '0');
      const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)') || '0');

      document.documentElement.style.setProperty('--safe-area-top', `${safeAreaTop}px`);
      document.documentElement.style.setProperty('--safe-area-bottom', `${safeAreaBottom}px`);
    };

    // Set on mount
    setViewportHeight();

    // Update on resize and orientation change
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);

    // Also listen for visual viewport changes (for keyboard appearing/disappearing)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', setViewportHeight);
    }

    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', setViewportHeight);
      }
    };
  }, []);
};

/**
 * Hook to detect if the user is on a mobile device
 */
export const useIsMobile = (breakpoint = 640) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
};

/**
 * Hook for body scroll lock management
 * Properly handles scroll locking and restoration for mobile viewport
 */
export const useBodyScrollLock = (isLocked: boolean) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const body = document.body;
    const html = document.documentElement;

    if (isLocked) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Save original styles to restore later
      const originalBodyOverflow = body.style.overflow;
      const originalBodyPosition = body.style.position;
      const originalBodyTop = body.style.top;
      const originalBodyWidth = body.style.width;
      const originalHtmlOverflow = html.style.overflow;

      // Lock scroll by setting position fixed but preserving scroll position visually
      body.style.overflow = 'hidden';
      body.style.position = 'fixed';
      body.style.top = `-${scrollY}px`;
      body.style.width = '100%';
      
      // Also lock HTML to prevent iOS Safari scrolling issues
      html.style.overflow = 'hidden';

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
    } else {
      // Ensure scroll is enabled when unlocked
      // This handles the case where the hook is used with isLocked=false
      // but previous locks may have left the body in a locked state
      if (body.style.position === 'fixed') {
        const scrollY = parseInt(body.style.top || '0', 10) * -1;
        
        body.style.overflow = '';
        body.style.position = '';
        body.style.top = '';
        body.style.width = '';
        html.style.overflow = '';
        
        window.scrollTo(0, scrollY);
      }
    }
  }, [isLocked]);
};