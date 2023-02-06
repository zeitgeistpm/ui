import "react-datetime/css/react-datetime.css";
import "styles/index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import BatsthitDevtools from "@yornaath/batshit-devtools-react";
import * as Fathom from "fathom-client";

import { observer } from "mobx-react";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { Suspense, useEffect } from "react";
import { hotjar } from "react-hotjar";

import dynamic from "next/dynamic";

// environment variables set in .env.local or vercel interface
const fathomSiteId = process.env["NEXT_PUBLIC_FATHOM_SITE_ID"];
const domain = process.env["NEXT_PUBLIC_DOMAIN"];
const hotjarSiteId = process.env["NEXT_PUBLIC_HOTJAR_SITE_ID"];
const environment = process.env.NEXT_PUBLIC_ENVIRONMENT_NAME;
const isProduction = environment === "production" || environment == null;

const queryClient = new QueryClient();

const DefaultLayout = dynamic(import("../layouts/DefaultLayout"), {
  ssr: false,
});

const StoreComponent = dynamic(import("../components/_app/Store"), {
  ssr: false,
});

const MobileMenuComponent = dynamic(import("../components/_app/MobileMenu"), {
  ssr: false,
});
const AvataraContextComponents = dynamic(
  import("../components/_app/AvataraContext"),
  {
    ssr: false,
  },
);

const MyApp = observer(({ Component, pageProps }) => {
  const Layout = Component.Layout ? Component.Layout : React.Fragment;
  const router = useRouter();

  useEffect(() => {
    if (!isProduction) {
      return;
    }
    // disable fathom analyitics if not set
    if (!fathomSiteId) {
      return;
    }

    Fathom.load(fathomSiteId, {
      includedDomains: [domain],
    });

    function onRouteChangeComplete() {
      Fathom.trackPageview();
    }

    router.events.on("routeChangeComplete", onRouteChangeComplete);

    if (hotjarSiteId) {
      hotjar.initialize(Number(hotjarSiteId), 6);
    }

    return () =>
      router.events.off("routeChangeComplete", onRouteChangeComplete);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <StoreComponent>
        <AvataraContextComponents>
          <Head>
            <title>Zeitgeist - Prediction Markets</title>
          </Head>
          <DefaultLayout>
            {/* <DemoLayout> */}
            <MobileMenuComponent />
            <Layout>
              <Component {...pageProps} />
            </Layout>
            {/* </DemoLayout> */}
          </DefaultLayout>
          {process.env.NEXT_PUBLIC_REACT_QUERY_DEVTOOLS === "true" &&
          typeof window === "object" ? (
            <Suspense fallback={<></>}>
              <ReactQueryDevtools />
              <BatsthitDevtools />
            </Suspense>
          ) : null}
        </AvataraContextComponents>
      </StoreComponent>
    </QueryClientProvider>
  );
});

export default MyApp;
