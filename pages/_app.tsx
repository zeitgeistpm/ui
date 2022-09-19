import "react-datetime/css/react-datetime.css";
import "styles/index.css";

import { observer } from "mobx-react";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import * as Fathom from "fathom-client";
import Head from "next/head";
import { hotjar } from "react-hotjar";

import ModalStore from "lib/stores/ModalStore";
import { StoreProvider } from "components/context/StoreContext";
import { ModalStoreContext } from "components/context/ModalStoreContext";
import ModalContainer from "components/modal/ModalContainer";
import Store from "lib/stores/Store";
import DefaultLayout from "layouts/DefaultLayout";
import AppLaunchLayout from "layouts/launch/AppLaunchLayout";
import { AnimatePresence } from "framer-motion";
import MobileMenu from "components/menu/MobileMenu";
import { AvatarContext } from "@zeitgeistpm/avatara-react";

// environment variables set in .env.local or vercel interface
const fathomSiteId = process.env["NEXT_PUBLIC_FATHOM_SITE_ID"];
const domain = process.env["NEXT_PUBLIC_DOMAIN"];
const hotjarSiteId = process.env["NEXT_PUBLIC_HOTJAR_SITE_ID"];

const MyApp = observer(({ Component, pageProps }) => {
  const Layout = Component.Layout ? Component.Layout : React.Fragment;
  const router = useRouter();
  const [modalStore] = useState(() => new ModalStore());
  const [store] = useState(() => new Store());

  useEffect(() => {
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

    return () =>
      router.events.off("routeChangeComplete", onRouteChangeComplete);
  }, []);

  useEffect(() => {
    hotjar.initialize(Number(hotjarSiteId), 6);
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

  const launchDate = new Date(1663081200000);

  const [launched, setLaunched] = useState(Date.now() > launchDate.getTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setLaunched(Date.now() > launchDate.getTime());
    }, 1000);
    return () => clearInterval(timer);
  });

  return (
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
            <title>The Zeitgeist Prediction Markets App</title>
            <meta
              name="description"
              content="The application interface for Zeitgeist Prediction Markets. Built on Polkadot, Zeitgeist is the leader in decentralized prediction markets."
            />
            <link
              rel="apple-touch-icon"
              sizes="180x180"
              href="/apple-touch-icon.png"
            />
            <link
              rel="icon"
              type="image/png"
              sizes="32x32"
              href="/favicon-32x32.png"
            />
            <link
              rel="icon"
              type="image/png"
              sizes="16x16"
              href="/favicon-16x16.png"
            />
            <link rel="manifest" href="/site.webmanifest" />
            <link
              rel="mask-icon"
              href="/safari-pinned-tab.svg"
              color="#5bbad5"
            />
          </Head>
          {process.env.NEXT_PUBLIC_PRE_LAUNCH_PHASE === "false" ||
          process.env.NEXT_PUBLIC_PRE_LAUNCH_PHASE === undefined ||
          launched ? (
            <DefaultLayout>
              <AnimatePresence>
                {store.showMobileMenu && <MobileMenu />}
              </AnimatePresence>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </DefaultLayout>
          ) : (
            <AppLaunchLayout launchDate={launchDate} />
          )}
        </ModalStoreContext.Provider>
      </AvatarContext.Provider>
    </StoreProvider>
  );
});

export default MyApp;
