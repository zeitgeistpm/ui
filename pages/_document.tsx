import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT_NAME;
  const useAnalytics = environment === "production" || environment == null;

  return (
    <Html className="overflow-x-hidden max-w-full">
      <Head>
        {useAnalytics && (
          <Script id="google-analytics" strategy="afterInteractive">
            {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-J3881Y08L6');
            `}
          </Script>
        )}
        {useAnalytics && (
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-J3881Y08L6"
            strategy="afterInteractive"
          />
        )}
        <meta
          name="description"
          content="The application interface for Zeitgeist Prediction Markets. Built on Polkadot, Zeitgeist is the leader in decentralized prediction markets."
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
      </Head>
      <body className="overflow-x-hidden max-w-full">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
