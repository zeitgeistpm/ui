import { useEffect } from "react";

/**
 * Listen for document wide key press.
 * Subscribes when component mounts, unsubscribes when component unmounts.
 *
 * @param key string - the key to listen for
 * @param cb - callback function to run when key is pressed
 */
export const useGlobalKeyPress = (key: string, cb: () => void) => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === key) {
        cb();
      }
    };
    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [key, cb]);
};
