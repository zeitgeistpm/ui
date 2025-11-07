import { useMediaQuery } from "./useMediaQuery";

/**
 * Simple hook that uses CSS media queries instead of JS calculations
 * This replaces all the window.innerWidth < 640 checks
 *
 * @deprecated Use useIsMobile from useMediaQuery instead
 */
export function useIsMobileCSS() {
  return useMediaQuery("(max-width: 639px)");
}

/**
 * Example of how to migrate components
 *
 * BEFORE (Bad):
 * ```tsx
 * const [isMobile, setIsMobile] = useState(false);
 * useEffect(() => {
 *   const checkMobile = () => setIsMobile(window.innerWidth < 640);
 *   checkMobile();
 *   window.addEventListener("resize", checkMobile);
 *   return () => window.removeEventListener("resize", checkMobile);
 * }, []);
 * ```
 *
 * AFTER (Good):
 * ```tsx
 * import { useIsMobile } from "lib/hooks/useMediaQuery";
 * const isMobile = useIsMobile();
 * ```
 *
 * EVEN BETTER (Best) - Use CSS classes:
 * ```tsx
 * <div className="text-sm md:text-base">
 *   Content that adapts without any JS
 * </div>
 * ```
 */