import { useCallback, useEffect } from 'react';

/**
 * Types of haptic feedback
 */
export type HapticFeedbackType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection';

/**
 * Custom hook for providing haptic feedback on supported devices
 * Uses the Vibration API when available
 */
export const useHapticFeedback = () => {
  /**
   * Check if haptic feedback is supported
   */
  const isSupported = useCallback(() => {
    if (typeof window === 'undefined') return false;

    // Check for Vibration API support
    return 'vibrate' in navigator || 'mozVibrate' in navigator || 'webkitVibrate' in navigator;
  }, []);

  /**
   * Trigger haptic feedback
   * @param type - The type of feedback to provide
   */
  const triggerHaptic = useCallback((type: HapticFeedbackType = 'light') => {
    if (!isSupported()) return;

    // Map feedback types to vibration patterns
    const patterns: Record<HapticFeedbackType, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 30,
      success: [10, 50, 10],
      warning: [20, 100, 20],
      error: [50, 100, 50, 100, 50],
      selection: 5,
    };

    const pattern = patterns[type];

    try {
      // Use the standard API
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
      // Fallback for older browsers
      else if ('mozVibrate' in navigator) {
        (navigator as any).mozVibrate(pattern);
      }
      else if ('webkitVibrate' in navigator) {
        (navigator as any).webkitVibrate(pattern);
      }
    } catch (error) {
      // Fail silently - haptic feedback is a nice-to-have
      console.debug('Haptic feedback failed:', error);
    }
  }, [isSupported]);

  /**
   * Create a click handler with haptic feedback
   * @param onClick - The original click handler
   * @param feedbackType - The type of haptic feedback
   */
  const withHapticFeedback = useCallback(
    <T extends (...args: any[]) => any>(
      onClick?: T,
      feedbackType: HapticFeedbackType = 'light'
    ) => {
      return ((...args: Parameters<T>) => {
        triggerHaptic(feedbackType);
        return onClick?.(...args);
      }) as T;
    },
    [triggerHaptic]
  );

  return {
    isSupported: isSupported(),
    triggerHaptic,
    withHapticFeedback,
  };
};

/**
 * Hook to add haptic feedback to all interactive elements automatically
 */
export const useAutoHapticFeedback = (enabled: boolean = true) => {
  const { isSupported, triggerHaptic } = useHapticFeedback();

  useEffect(() => {
    if (!enabled || !isSupported) return;

    // Add haptic feedback to button clicks
    const handleButtonClick = (e: Event) => {
      const target = e.target as HTMLElement;

      // Check if the element is interactive
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.role === 'button' ||
        target.classList.contains('touch-manipulation')
      ) {
        // Use different feedback for different elements
        if (target.classList.contains('destructive') || target.classList.contains('ztg-red')) {
          triggerHaptic('warning');
        } else if (target.classList.contains('ztg-green') || target.classList.contains('success')) {
          triggerHaptic('success');
        } else {
          triggerHaptic('light');
        }
      }
    };

    // Add listener for touch events
    document.addEventListener('touchstart', handleButtonClick, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleButtonClick);
    };
  }, [enabled, isSupported, triggerHaptic]);
};