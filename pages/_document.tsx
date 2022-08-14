import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html className="dark overflow-x-hidden max-w-full">
      <Head />
      <body className="dark overflow-x-hidden max-w-full">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
