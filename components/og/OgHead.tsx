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
          <meta property="og:title" content={props.title} key="title" />
          <meta property="twitter:title" content={props.title} key="title" />
        </>
      )}
      {props.description && (
        <>
          <meta name="description" content={props.description} />
          <meta property="og:description" content={props.description} />
          <meta property="twitter:description" content={props.description} />
        </>
      )}
      {props.image && (
        <>
          <meta key="og:image" property="og:image" content={props.image} />
          <meta key="twitter:image" property="og:image" content={props.image} />
        </>
      )}
    </Head>
  );
};
