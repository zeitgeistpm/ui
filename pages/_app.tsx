import "react-datetime/css/react-datetime.css";
import "styles/index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Fathom from "fathom-client";
import { observer } from "mobx-react";
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { hotjar } from "react-hotjar";

import { AvatarContext } from "@zeitgeistpm/avatara-react";
import { ModalStoreContext } from "components/context/ModalStoreContext";
import { StoreProvider } from "components/context/StoreContext";
import MobileMenu from "components/menu/MobileMenu";
import ModalContainer from "components/modal/ModalContainer";
import { AnimatePresence } from "framer-motion";
import DefaultLayout from "layouts/DefaultLayout";
import ModalStore from "lib/stores/ModalStore";
import Store from "lib/stores/Store";

// font optimization from @next/font
import { inter, kanit, roboto_mono } from "lib/util/fonts";

// environment variables set in .env.local or vercel interface
const fathomSiteId = process.env["NEXT_PUBLIC_FATHOM_SITE_ID"];
const domain = process.env["NEXT_PUBLIC_DOMAIN"];
const hotjarSiteId = process.env["NEXT_PUBLIC_HOTJAR_SITE_ID"];
const environment = process.env.NEXT_PUBLIC_ENVIRONMENT_NAME;
const isProduction = environment === "production" || environment == null;

const queryClient = new QueryClient();

const MyApp = observer(({ Component, pageProps }) => {
  const Layout = Component.Layout ? Component.Layout : React.Fragment;
  const router = useRouter();
  const [modalStore] = useState(() => new ModalStore());
  const [store] = useState(() => new Store());

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

  useEffect(() => {
    const clientWidth = window.innerWidth;
    if (clientWidth < 1300) {
      store.toggleDrawer("right");
    } else {
      store.navigationStore.toggleGroupOpen("markets");
    }
    if (clientWidth < 900) {
      store.toggleDrawer("left");
    }
  }, []);

  return (
    <>
      {/* loads optimized fonts for global access */}
      <style jsx global>
        {`
          :root {
            --font-inter: ${inter.style.fontFamily};
            --font-kanit: ${kanit.style.fontFamily};
            --font-roboto-mono: ${roboto_mono.style.fontFamily};
          }
        `}
      </style>
      <QueryClientProvider client={queryClient}>
        <StoreProvider store={store}>
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
                <AnimatePresence>
                  {store.showMobileMenu && <MobileMenu />}
                </AnimatePresence>
                <Layout>
                  <Component {...pageProps} />
                </Layout>
              </DefaultLayout>
            </ModalStoreContext.Provider>
          </AvatarContext.Provider>
        </StoreProvider>
      </QueryClientProvider>
    </>
  );
});

export default MyApp;
