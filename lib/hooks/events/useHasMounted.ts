import { useEffect, useState } from "react";

/**
 * Returns true if the component has mounted.
 * Useful for two pass rendering where props like className or style changes on the client
 * based on values that are only available on the client like window width etc.
 *
 * @link https://github.com/vercel/next.js/issues/17463#issuecomment-701472340
 * @link https://joshwcomeau.com/react/the-perils-of-rehydration/#abstractions
 */
export const useHasMounted = () => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
};
