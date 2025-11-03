import { useEffect, useRef, useState } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventDefaultEvents?: boolean;
}

/**
 * Custom hook for detecting swipe gestures on mobile devices
 * @param elementRef - Ref to the element that should detect swipes
 * @param config - Configuration for swipe detection
 */
export const useSwipeGesture = (
  elementRef: React.RefObject<HTMLElement>,
  config: SwipeConfig
) => {
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  const [isSwiping, setIsSwiping] = useState(false);
  const threshold = config.threshold || 50;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });
      setIsSwiping(true);

      if (config.preventDefaultEvents) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping) return;

      setTouchEnd({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });

      if (config.preventDefaultEvents) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwiping) return;

      const horizontalDiff = touchStart.x - touchEnd.x;
      const verticalDiff = touchStart.y - touchEnd.y;
      const isHorizontal = Math.abs(horizontalDiff) > Math.abs(verticalDiff);

      // Horizontal swipes
      if (isHorizontal && Math.abs(horizontalDiff) > threshold) {
        if (horizontalDiff > 0 && config.onSwipeLeft) {
          config.onSwipeLeft();
        } else if (horizontalDiff < 0 && config.onSwipeRight) {
          config.onSwipeRight();
        }
      }

      // Vertical swipes
      if (!isHorizontal && Math.abs(verticalDiff) > threshold) {
        if (verticalDiff > 0 && config.onSwipeUp) {
          config.onSwipeUp();
        } else if (verticalDiff < 0 && config.onSwipeDown) {
          config.onSwipeDown();
        }
      }

      setIsSwiping(false);
      if (config.preventDefaultEvents) {
        e.preventDefault();
      }
    };

    // Add passive: false to allow preventDefault
    const options = { passive: !config.preventDefaultEvents };

    element.addEventListener('touchstart', handleTouchStart, options);
    element.addEventListener('touchmove', handleTouchMove, options);
    element.addEventListener('touchend', handleTouchEnd, options);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, config, touchStart, touchEnd, isSwiping, threshold]);

  return { isSwiping };
};

/**
 * Hook specifically for menu swipe-to-close functionality
 */
export const useMenuSwipeToClose = (
  isOpen: boolean,
  onClose: () => void,
  direction: 'left' | 'right' = 'left'
) => {
  const menuRef = useRef<HTMLDivElement>(null);

  const swipeConfig: SwipeConfig = {
    onSwipeLeft: direction === 'left' ? onClose : undefined,
    onSwipeRight: direction === 'right' ? onClose : undefined,
    threshold: 75,
    preventDefaultEvents: false,
  };

  const { isSwiping } = useSwipeGesture(menuRef, swipeConfig);

  return { menuRef, isSwiping };
};