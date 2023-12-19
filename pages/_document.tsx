import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  const useAnalytics =
    process.env.NEXT_PUBLIC_SITE_URL === "https://app.zeitgeist.pm";

  return (
    <Html>
      <Head>
        {/* TODO make dynamic */}
        {/* {useAnalytics && (
          <Script id="google-analytics" strategy="afterInteractive">
            {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-HRMGM0K16B');
            `}
          </Script>
        )}
        {useAnalytics && (
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-HRMGM0K16B"
            strategy="afterInteractive"
          />
        )} */}
        {/* TODO make dynamic */}
        <meta
          name="description"
          content="The application interface for NTT Global Project Management Portal."
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />

        {/* TODO: swap for NTT Twitter  */}
        <meta key="twitter:site" name="twitter:site" content="@ZeitgeistPM" />
        <meta
          key="twitter:card"
          name="twitter:card"
          content="summary_large_image"
        />
        <meta
          key="twitter:creator"
          name="twitter:creator"
          content="@ZeitgeistPM"
        />
      </Head>
      <body className="overflow-x-hidden">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
