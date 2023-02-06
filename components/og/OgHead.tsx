import Head from "next/head";

export type OgProps = {
  title?: string;
  description?: string;
  image?: string;
};

export const OgHead = (props: OgProps) => {
  return (
    <Head>
      {props.title && (
        <>
          <title>{props.title}</title>
          <meta key="og:title" property="og:title" content={props.title} />
          <meta
            key="twitter:title"
            property="twitter:title"
            content={props.title}
          />
        </>
      )}
      {props.description && (
        <>
          <meta
            key="description"
            name="description"
            content={props.description}
          />
          <meta
            key="og:description"
            property="og:description"
            content={props.description}
          />
          <meta
            key="twitter:description"
            property="twitter:description"
            content={props.description}
          />
        </>
      )}
      {props.image && (
        <>
          <meta key="og:image" property="og:image" content={props.image} />
          <meta
            key="twitter:image"
            property="twitter:image"
            content={props.image}
          />
        </>
      )}
    </Head>
  );
};
