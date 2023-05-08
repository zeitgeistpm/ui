import "react-datetime/css/react-datetime.css";
import "styles/index.css";

import { QueryClientProvider } from "@tanstack/react-query";
import * as Fathom from "fathom-client";

import { AvatarContext } from "@zeitgeistpm/avatara-react";
import { Account } from "components/account/Account";
import Devtools from "components/devtools";
import DefaultLayout from "layouts/DefaultLayout";
import { registerValidationRules } from "lib/form";
import { queryClient } from "lib/query-client";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { hotjar } from "react-hotjar";

const Onboarding = dynamic(
  () => import("../components/onboarding/Onboarding"),
  {
    ssr: false,
  },
);

// environment variables set in .env.local or vercel interface
const fathomSiteId = process.env["NEXT_PUBLIC_FATHOM_SITE_ID"];
const domain = process.env["NEXT_PUBLIC_DOMAIN"];
const hotjarSiteId = process.env["NEXT_PUBLIC_HOTJAR_SITE_ID"];
const isProduction =
  process.env.NEXT_PUBLIC_SITE_URL === "https://app.zeitgeist.pm";

registerValidationRules();

const MyApp = ({ Component, pageProps }) => {
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
      <AvatarContext.Provider
        value={{
          api: process.env.NEXT_PUBLIC_AVATAR_API_HOST,
          ipfs: { node: { url: process.env.NEXT_PUBLIC_IPFS_NODE } },
          rpc: process.env.NEXT_PUBLIC_RMRK_CHAIN_RPC_NODE,
          indexer: process.env.NEXT_PUBLIC_RMRK_INDEXER_API,
          avatarCollectionId: process.env.NEXT_PUBLIC_AVATAR_COLLECTION_ID,
          badgeCollectionId: process.env.NEXT_PUBLIC_BADGE_COLLECTION_ID,
          avatarBaseId: process.env.NEXT_PUBLIC_AVATAR_BASE_ID,
          prerenderUrl: process.env.NEXT_PUBLIC_RMRK_PRERENDER_URL,
        }}
      >
        <Head>
          <title>Zeitgeist - Prediction Markets</title>
        </Head>
        <DefaultLayout>
          <Layout>
            <Component {...pageProps} />
            <Account />
            <Onboarding />
          </Layout>
        </DefaultLayout>
        <Devtools />
      </AvatarContext.Provider>
    </QueryClientProvider>
  );
};

export default MyApp;
