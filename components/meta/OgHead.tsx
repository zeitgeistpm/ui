import Head from "next/head";

export type OgProps = {
  title?: string;
  description?: string;
  image?: URL;
};

const defaultDescription =
  "The application interface for Zeitgeist Prediction Markets. Built on Polkadot, Zeitgeist is the leader in decentralized prediction markets.";

export const OgHead = ({ title, description, image }: OgProps) => {
  description ??= defaultDescription;

  return (
    <Head>
      {title && (
        <>
          <title>{title}</title>
          <meta key="og:title" property="og:title" content={title} />
          <meta key="twitter:title" property="twitter:title" content={title} />
        </>
      )}
      <>
        <meta key="description" name="description" content={description} />
        <meta
          key="og:description"
          property="og:description"
          content={description}
        />
        <meta
          key="twitter:description"
          property="twitter:description"
          content={description}
        />
      </>
      {image && (
        <>
          <meta key="og:image" property="og:image" content={image.href} />
          <meta
            key="twitter:image"
            property="twitter:image"
            content={`${image}`}
          />
          <meta
            key="twitter:image:src"
            property="twitter:image:src"
            content={`${image}`}
          />
        </>
      )}
    </Head>
  );
};
