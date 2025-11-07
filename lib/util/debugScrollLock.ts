/**
 * Debug utility to check if scroll lock is currently active
 * Run this in the browser console to check scroll lock status
 */
export function debugScrollLock() {
  const body = document.body;
  const html = document.documentElement;

  const info = {
    bodyStyles: {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      height: body.style.height,
    },
    htmlStyles: {
      overflow: html.style.overflow,
    },
    computedBodyStyles: {
      overflow: window.getComputedStyle(body).overflow,
      position: window.getComputedStyle(body).position,
    },
    computedHtmlStyles: {
      overflow: window.getComputedStyle(html).overflow,
    },
    scrollY: window.scrollY,
    isLocked: body.style.position === "fixed" || body.style.overflow === "hidden",
  };

  console.log("🔍 Scroll Lock Debug Info:", info);

  if (info.isLocked) {
    console.warn("⚠️ Scroll lock is currently ACTIVE!");
  } else {
    console.log("✅ Scroll lock is NOT active");
  }

  return info;
}

/**
 * Force remove all scroll locks (emergency fix)
 * Run this in the browser console if scroll is stuck
 */
export function forceRemoveScrollLock() {
  const body = document.body;
  const html = document.documentElement;

  // Clear all inline styles that might be blocking scroll
  body.style.overflow = "";
  body.style.position = "";
  body.style.top = "";
  body.style.width = "";
  body.style.height = "";
  html.style.overflow = "";

  console.log("🔓 Forced removal of all scroll locks");
  console.log("Current body styles:", {
    overflow: body.style.overflow || "none",
    position: body.style.position || "none",
  });
}

// Make these available globally for debugging
if (typeof window !== "undefined") {
  (window as any).debugScrollLock = debugScrollLock;
  (window as any).forceRemoveScrollLock = forceRemoveScrollLock;
}