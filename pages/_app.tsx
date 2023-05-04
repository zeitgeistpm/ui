import "react-datetime/css/react-datetime.css";
import "styles/index.css";

import { QueryClientProvider } from "@tanstack/react-query";
import * as Fathom from "fathom-client";

import { observer } from "mobx-react";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { hotjar } from "react-hotjar";

import { AvatarContext } from "@zeitgeistpm/avatara-react";
import { ModalStoreContext } from "components/context/ModalStoreContext";
import Devtools from "components/devtools";
import ModalContainer from "components/modal/ModalContainer";
import DefaultLayout from "layouts/DefaultLayout";
import { queryClient } from "lib/query-client";
import ModalStore from "lib/stores/ModalStore";
import dynamic from "next/dynamic";
import { registerValidationRules } from "lib/form";

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

const MyApp = observer(({ Component, pageProps }) => {
  const Layout = Component.Layout ? Component.Layout : React.Fragment;
  const router = useRouter();
  const [modalStore] = useState(() => new ModalStore());

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
        <ModalStoreContext.Provider value={modalStore}>
          {modalStore.modal && (
            <ModalContainer>{modalStore.modal}</ModalContainer>
          )}
          <Head>
            <title>Zeitgeist - Prediction Markets</title>
          </Head>
          <DefaultLayout>
            <Layout>
              <Component {...pageProps} />
              <Onboarding />
            </Layout>
          </DefaultLayout>
          <Devtools />
        </ModalStoreContext.Provider>
      </AvatarContext.Provider>
    </QueryClientProvider>
  );
});

export default MyApp;
