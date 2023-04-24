/**
 *
 * Check if a url is same origin as the current page.
 *
 * @param url url to test
 * @returns boolean
 */
export const isCurrentOrigin = (url: string) =>
  new URL(process.env.NEXT_PUBLIC_SITE_URL).origin ===
  new URL(url, process.env.NEXT_PUBLIC_SITE_URL).origin;
