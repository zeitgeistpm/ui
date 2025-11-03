import { useEffect, useRef } from 'react';

/**
 * Custom hook for trapping focus within a modal or menu
 * This improves accessibility for keyboard navigation
 * @param isActive - Whether the focus trap is active
 * @param elementRef - Optional ref to the container element
 */
export const useFocusTrap = (
  isActive: boolean,
  elementRef?: React.RefObject<HTMLElement>
) => {
  const firstFocusableElementRef = useRef<HTMLElement | null>(null);
  const lastFocusableElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const element = elementRef?.current || document;

    // Find all focusable elements within the container
    const focusableElements = (element instanceof Document ? element : element).querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const focusableArray = Array.from(focusableElements) as HTMLElement[];

    if (focusableArray.length === 0) return;

    firstFocusableElementRef.current = focusableArray[0];
    lastFocusableElementRef.current = focusableArray[focusableArray.length - 1];

    // Store the currently focused element to restore later
    const previouslyFocusedElement = document.activeElement as HTMLElement;

    // Focus the first focusable element
    firstFocusableElementRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const activeElement = document.activeElement;

      // Shift + Tab
      if (e.shiftKey) {
        if (activeElement === firstFocusableElementRef.current) {
          e.preventDefault();
          lastFocusableElementRef.current?.focus();
        }
      }
      // Tab
      else {
        if (activeElement === lastFocusableElementRef.current) {
          e.preventDefault();
          firstFocusableElementRef.current?.focus();
        }
      }
    };

    // Handle Escape key to close
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // The parent component should handle closing
        previouslyFocusedElement?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleEscape);

      // Restore focus to the previously focused element
      previouslyFocusedElement?.focus();
    };
  }, [isActive, elementRef]);
};