import Head from "next/head";

export type OgProps = {
  title?: string;
  description?: string;
  image?: string;
};

export const Og = (props: OgProps) => {
  return (
    <Head>
      {props.title && <title>{props.title}</title>}
      {props.description && (
        <meta name="description" content={props.description} />
      )}
      {props.title && (
        <meta property="og:title" content={props.title} key="title" />
      )}
      {props.description && (
        <meta property="og:description" content={props.description} />
      )}
      {props.image && (
        <meta key="og:image" property="og:image" content={props.image} />
      )}
    </Head>
  );
};
