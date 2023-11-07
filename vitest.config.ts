import { defineConfig, defaultExclude } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    exclude: [...defaultExclude, "e2e/**"],
  },
});
