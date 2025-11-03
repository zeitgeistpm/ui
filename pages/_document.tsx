import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  const useAnalytics =
    process.env.NEXT_PUBLIC_SITE_URL === "https://app.zeitgeist.pm";

  return (
    <Html>
      <Head>
        {/* Mobile optimization meta tags */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#1a1e3b" />

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
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-5KVRHBT');
            `}
          </Script>
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
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5KVRHBT"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
