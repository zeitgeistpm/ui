import { observer } from "mobx-react";
import { Skeleton } from "@material-ui/lab";
import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import { useResizeDetector } from "react-resize-detector";
import { debounce } from "lodash";

import * as Fathom from "fathom-client";
import Store, { useStore } from "lib/stores/Store";
import { TradeSlipStoreContext } from "lib/stores/TradeSlipStore";
import TopBar from "components/top-bar";
import Footer from "components/ui/Footer";
import NotificationCenter from "components/ui/NotificationCenter";
import RightDrawer from "components/drawer/RightDrawer";
import LeftDrawer from "components/drawer/LeftDrawer";
import { ContentDimensionsProvider } from "components/context/ContentDimensionsContext";
import { useRouter } from "next/router";
import { AnimatePresence } from "framer-motion";
import MobileMenu from "components/menu/MobileMenu";
import { StoreProvider } from "components/context/StoreContext";
import { AvatarContext } from "@zeitgeistpm/avatara-react";
import { ModalStoreContext } from "components/context/ModalStoreContext";
import ModalContainer from "components/modal/ModalContainer";
import Head from "next/head";
import { hotjar } from "react-hotjar";
import ModalStore, { useModalStore } from "lib/stores/ModalStore";

// environment variables set in .env.local or vercel interface
const fathomSiteId = process.env["NEXT_PUBLIC_FATHOM_SITE_ID"];
const domain = process.env["NEXT_PUBLIC_DOMAIN"];
const hotjarSiteId = process.env["NEXT_PUBLIC_HOTJAR_SITE_ID"];

const DefaultLayout: FC = observer(({ children }) => {
  const store = useMemo(() => new Store(), []);
  const modalStore = useMemo(() => new ModalStore(), []);
  const router = useRouter();

  const { width, height, ref: mainRef } = useResizeDetector();

  const contentRef = useRef<HTMLDivElement>();
  const [scrollTop, setScrollTop] = useState(0);

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

  const onScrollCapture: React.UIEventHandler<HTMLDivElement> = debounce(() => {
    setScrollTop(contentRef.current?.scrollTop);
  }, 66);

  const scrollTo = (scrollTop: number) => {
    if (contentRef.current) {
      contentRef.current.scrollTop = scrollTop;
    }
  };

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

          <>
            <AnimatePresence>
              {store.showMobileMenu && <MobileMenu />}
            </AnimatePresence>
            <div
              onScrollCapture={onScrollCapture}
              className="relative flex min-h-screen justify-evenly bg-white dark:bg-sky-1000 overflow-hidden"
            >
              <TradeSlipStoreContext.Provider value={store.tradeSlipStore}>
                <LeftDrawer />
                <div
                  ref={contentRef}
                  className="overflow-y-auto overflow-x-hidden flex-grow"
                >
                  <TopBar />
                  <main
                    className="main-container flex flex-col dark:text-white"
                    ref={mainRef}
                  >
                    <div className="max-w-ztg-1100 mx-auto py-0 px-ztg-32 pt-ztg-14 w-full ">
                      <ContentDimensionsProvider
                        scrollTop={scrollTop}
                        scrollTo={scrollTo}
                        height={height}
                        width={width}
                      >
                        {store.initialized || router.pathname === "/" ? (
                          children
                        ) : (
                          <Skeleton
                            className="!transform-none !mt-ztg-30"
                            style={{ height: "550px" }}
                          />
                        )}
                      </ContentDimensionsProvider>
                    </div>
                    <Footer />
                  </main>
                </div>
                <RightDrawer />
                <NotificationCenter />
              </TradeSlipStoreContext.Provider>
            </div>
          </>
        </ModalStoreContext.Provider>
      </AvatarContext.Provider>
    </StoreProvider>
  );
});

export default DefaultLayout;
