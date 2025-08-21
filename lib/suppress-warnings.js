// Suppress known React/Next.js warnings for Next.js 13.4.x compatibility
// This file is imported at the very top of _app.tsx

// Create a more aggressive suppression that runs immediately
(function() {
  // Store original console methods immediately
  const originalError = console.error;
  const originalWarn = console.warn;

  // Very specific patterns to avoid suppressing legitimate errors
  const suppressedPatterns = [
    // Only suppress the exact fetchPriority React warning
    /^Warning: React does not recognize the `fetchPriority` prop on a DOM element\./,
    /^Warning: React does not recognize the `fetchpriority` prop on a DOM element\./,
    // Only suppress Next.js Image sizes warnings
    /^Image with src .* has "fill" but is missing "sizes" prop\./,
  ];

  const shouldSuppress = (message) => {
    if (!message) return false;
    const msgStr = typeof message === "string" ? message : message.toString();
    // Only suppress if the message starts with one of our specific patterns
    return suppressedPatterns.some(pattern => pattern.test(msgStr));
  };

  // Only check the first argument (the main message) to avoid over-suppression
  const shouldSuppressMessage = (...args) => {
    if (args.length === 0) return false;
    return shouldSuppress(args[0]);
  };

  // Override console.error - only suppress specific React warnings
  console.error = function(...args) {
    if (shouldSuppressMessage(...args)) {
      return; // Suppress only the specific fetchPriority warning
    }
    originalError.apply(console, args);
  };

  // Override console.warn - only suppress specific Next.js Image warnings
  console.warn = function(...args) {
    if (shouldSuppressMessage(...args)) {
      return; // Suppress only specific Image warnings
    }
    originalWarn.apply(console, args);
  };
})();

// Override global error handler - only for very specific React warnings
if (typeof window !== "undefined") {
  const originalOnError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    // Only suppress the exact fetchPriority warning, not other errors
    if (message && /^Warning: React does not recognize the `fetchPriority` prop on a DOM element\./.test(message.toString())) {
      return true; // Prevent only this specific warning from being logged
    }
    if (originalOnError) {
      return originalOnError.call(window, message, source, lineno, colno, error);
    }
    return false;
  };
}