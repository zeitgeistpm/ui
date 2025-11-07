import { useEffect, useState } from "react";

export const useMobileViewport = () => {};

/**
 * Hook to detect if the user is on a mobile device
 * @deprecated Use useIsMobile from useMediaQuery instead for better performance
 */
export const useIsMobile = (breakpoint = 640) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    setIsMobile(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [breakpoint]);

  return isMobile;
};

export const useBodyScrollLock = (isLocked: boolean) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isLocked) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      const scrollY = window.scrollY || window.pageYOffset || 0;
      const body = document.body;

      const originalStyles = {
        overflow: body.style.overflow,
        position: body.style.position,
        top: body.style.top,
        width: body.style.width,
      };

      if (isIOS) {
        body.style.overflow = 'hidden';
        body.style.position = 'relative';
      } else {
        body.style.overflow = 'hidden';
        body.style.position = 'fixed';
        body.style.top = `-${scrollY}px`;
        body.style.width = '100%';
      }

      return () => {
        Object.keys(originalStyles).forEach(key => {
          body.style[key] = originalStyles[key] || '';
        });

        if (!isIOS && scrollY > 0) {
          window.scrollTo(0, scrollY);
        }
      };
    }
  }, [isLocked]);
};