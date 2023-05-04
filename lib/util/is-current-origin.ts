/**
 *
 * Check if a url is same origin as the current page.
 *
 * @param url url to test
 * @returns boolean
 */
export const isCurrentOrigin = (url: string) => {
  const currentOrigin = new URL(
    process.env.NEXT_PUBLIC_SITE_URL.match("vercel.app")
      ? `https://${process.env.NEXT_PUBLIC_SITE_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL,
  ).origin;

  return new URL(currentOrigin).origin === new URL(url, currentOrigin).origin;
};
