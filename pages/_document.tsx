import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return (
    <Html className="overflow-x-hidden max-w-full">
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-J3881Y08L6');
        `}
      </Script>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-J3881Y08L6"
        strategy="afterInteractive"
      />
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Kanit:wght@700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Condiment&family=Lato:wght@100;300;400;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Condiment&family=Space+Grotesk:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="overflow-x-hidden max-w-full">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
